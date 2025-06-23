
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useSupabaseAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  // Verificar se o usuário é admin
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        setAdminCheckLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        // Verificar se o usuário tem role de admin
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('profile_type')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao verificar perfil admin:', error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(profile?.profile_type === 'admin');
      } catch (error) {
        console.error('Erro na verificação de admin:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    verificarAdmin();
  }, []);

  // Buscar todas as clínicas
  const buscarTodasClinicas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .order('nome');

      if (error) throw error;
      setClinicas(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Buscar clínica por ID
  const buscarClinicaPorId = async (clinicaId: string) => {
    try {
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', clinicaId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar clínica por ID:', error);
      throw error;
    }
  };

  // Buscar estatísticas de leads da clínica
  const buscarEstatisticasDeLeadsDaClinica = async (clinicaId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('clinica_id', clinicaId);

      if (error) throw error;

      const totalLeads = data?.length || 0;
      const leadsAnuncios = data?.filter(lead => 
        lead.origem_lead?.toLowerCase().includes('meta') ||
        lead.origem_lead?.toLowerCase().includes('google') ||
        lead.origem_lead?.toLowerCase().includes('ads')
      ).length || 0;

      return {
        totalLeads,
        leadsAnuncios,
        leadsConvertidos: 0,
        taxaConversao: 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de leads:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO PRINCIPAL: Atualizar Configurações Evolution
  const atualizarConfiguracaoEvolution = async (
    clinicaId: string, 
    instanceName?: string, 
    apiKey?: string
  ) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }
    
    try {
      console.log(`🔧 [useSupabaseAdmin] Atualizando configuração Evolution da clínica: ${clinicaId}`);
      console.log(`📝 [useSupabaseAdmin] Instance name: ${instanceName}`);
      console.log(`🔑 [useSupabaseAdmin] API key: ${apiKey ? '[FORNECIDA]' : '[NÃO FORNECIDA]'}`);
      
      const updateData: any = {};
      
      if (instanceName !== undefined) {
        updateData.evolution_instance_name = instanceName;
      }
      
      if (apiKey !== undefined) {
        updateData.evolution_api_key = apiKey;
      }
      
      if (Object.keys(updateData).length === 0) {
        console.warn('⚠️ [useSupabaseAdmin] Nenhum dado para atualizar');
        return null;
      }
      
      const { data, error } = await supabase
        .from('clinicas')
        .update(updateData)
        .eq('id', clinicaId)
        .select();

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao atualizar configuração Evolution:', error);
        throw error;
      }
      
      console.log('✅ [useSupabaseAdmin] Configuração Evolution atualizada com sucesso:', data);
      
      // Atualizar estado local das clínicas
      setClinicas(prevClinicas => 
        prevClinicas.map(clinica => 
          clinica.id === clinicaId 
            ? { ...clinica, ...updateData }
            : clinica
        )
      );
      
      return data?.[0] || null;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro ao atualizar configuração Evolution:', error);
      throw error;
    }
  };

  // Configurar usuário como admin
  const configurarComoAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          role: 'admin',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setIsAdmin(true);
    } catch (error) {
      console.error('Erro ao configurar admin:', error);
      throw error;
    }
  };

  // Obter ID do usuário atual
  const obterUserIdAtual = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  // Verificar permissão de admin
  const verificarPermissaoAdmin = () => isAdmin;

  // Buscar estatísticas globais das clínicas
  const buscarEstatisticasClinicas = async () => {
    try {
      const { data, error } = await supabase
        .from('clinicas')
        .select('id, nome, created_at, status');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar estatísticas das clínicas:', error);
      throw error;
    }
  };

  // Buscar KPIs globais
  const buscarKPIsGlobais = async () => {
    try {
      // Buscar totais de clínicas, leads, etc.
      const { data: clinicasData } = await supabase.from('clinicas').select('id');
      const { data: leadsData } = await supabase.from('leads').select('id, convertido');
      
      const leadsConvertidos = leadsData?.filter(lead => lead.convertido).length || 0;
      const totalLeads = leadsData?.length || 0;
      const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
      
      return {
        totalClinicas: clinicasData?.length || 0,
        totalLeads,
        leadsConvertidos,
        taxaConversao,
        clinicasAtivas: clinicasData?.length || 0,
        crescimentoMensal: 0
      };
    } catch (error) {
      console.error('Erro ao buscar KPIs globais:', error);
      throw error;
    }
  };

  return {
    loading: loading || adminCheckLoading,
    clinicas,
    isAdmin,
    adminCheckLoading,
    obterUserIdAtual,
    configurarComoAdmin,
    verificarPermissaoAdmin,
    buscarTodasClinicas,
    buscarClinicaPorId,
    buscarEstatisticasDeLeadsDaClinica,
    buscarEstatisticasClinicas,
    buscarKPIsGlobais,
    atualizarConfiguracaoEvolution, // ✅ EXPORTAR A FUNÇÃO
  };
};
