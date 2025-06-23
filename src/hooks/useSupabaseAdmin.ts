
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para operações administrativas no Supabase
 * 
 * Centraliza todas as operações que requerem privilégios administrativos,
 * incluindo busca de clínicas, usuários, estatísticas e configurações.
 */
export const useSupabaseAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  // Verificar permissão de admin internamente (sem usar useAdminCheck para evitar recursão)
  const verificarPermissaoAdmin = async (): Promise<boolean> => {
    try {
      const userId = await obterUserIdAtual();
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_type')
        .eq('user_id', userId)
        .single();

      if (error) {
        return false;
      }
      
      const isAdminUser = data?.profile_type === 'admin';
      return isAdminUser;
    } catch (error) {
      return false;
    }
  };

  // Buscar todas as clínicas (apenas para admin)
  const buscarTodasClinicas = async () => {
    if (!isAdmin) {
      return [];
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .order('nome');

      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar clínica específica por ID
  const buscarClinicaPorId = async (clinicaId: string) => {
    if (!isAdmin) {
      throw new Error('Acesso negado');
    }
    
    try {
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', clinicaId)
        .single();

      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Buscar estatísticas de leads de uma clínica
  const buscarEstatisticasDeLeadsDaClinica = async (clinicaId: string, startDate?: Date, endDate?: Date) => {
    if (!isAdmin) {
      throw new Error('Acesso negado');
    }
    
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('clinica_id', clinicaId);

      if (startDate && endDate) {
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Calcular estatísticas
      const totalLeads = data?.length || 0;
      const leadsConvertidos = data?.filter(lead => lead.convertido).length || 0;
      const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
      const leadsAnuncios = data?.filter(lead => lead.origem_lead === 'anuncio').length || 0;

      const estatisticas = {
        totalLeads,
        leadsConvertidos,
        taxaConversao: Math.round(taxaConversao * 100) / 100,
        leadsAnuncios
      };
      
      return estatisticas;
    } catch (error) {
      throw error;
    }
  };

  // Buscar estatísticas de todas as clínicas
  const buscarEstatisticasClinicas = async () => {
    if (!isAdmin) {
      return [];
    }
    
    try {
      const { data: clinicasData, error: clinicasError } = await supabase
        .from('clinicas')
        .select('*')
        .order('nome');

      if (clinicasError) {
        throw clinicasError;
      }

      // Buscar leads e usuários para cada clínica de forma paralela
      const estatisticasPromises = clinicasData?.map(async (clinica) => {
        try {
          // Buscar leads da clínica
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .eq('clinica_id', clinica.id);

          if (leadsError) {
            return {
              ...clinica,
              total_leads: 0,
              leads_convertidos: 0,
              leads_anuncios_count: 0,
              taxa_conversao: 0,
              total_usuarios: 0
            };
          }

          // Buscar usuários da clínica
          const { data: usuariosData, error: usuariosError } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('clinica_id', clinica.id);

          if (usuariosError) {
            // Ignora erro de usuários e continua com 0
          }

          // Calcular estatísticas
          const totalLeads = leadsData?.length || 0;
          const leadsConvertidos = leadsData?.filter(lead => lead.convertido).length || 0;
          const leadsAnuncios = leadsData?.filter(lead => lead.origem_lead === 'anuncio').length || 0;
          const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
          const totalUsuarios = usuariosData?.length || 0;

          return {
            ...clinica,
            total_leads: totalLeads,
            leads_convertidos: leadsConvertidos,
            leads_anuncios_count: leadsAnuncios,
            taxa_conversao: Math.round(taxaConversao * 100) / 100,
            total_usuarios: totalUsuarios
          };
        } catch (error) {
          return {
            ...clinica,
            total_leads: 0,
            leads_convertidos: 0,
            leads_anuncios_count: 0,
            taxa_conversao: 0,
            total_usuarios: 0
          };
        }
      }) || [];

      const estatisticas = await Promise.all(estatisticasPromises);
      return estatisticas;
    } catch (error) {
      return [];
    }
  };

  // Buscar KPIs globais
  const buscarKPIsGlobais = async () => {
    if (!isAdmin) {
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*');

      if (error) {
        throw error;
      }

      const totalLeads = data?.length || 0;
      const leadsConvertidos = data?.filter(lead => lead.convertido).length || 0;
      const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;

      const kpis = {
        totalLeads,
        leadsConvertidos,
        taxaConversao: Math.round(taxaConversao * 100) / 100,
        totalClinicas: clinicas.length
      };
      
      return kpis;
    } catch (error) {
      return null;
    }
  };

  // Obter ID do usuário atual
  const obterUserIdAtual = async (): Promise<string> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      return user.id;
    } catch (error) {
      throw error;
    }
  };

  // ✅ NOVA FUNÇÃO: Atualizar configurações da Evolution API
  const atualizarConfiguracaoEvolution = async (
    clinicaId: string, 
    instanceName?: string, 
    apiKey?: string
  ): Promise<any> => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }
    
    try {
      console.log(`🔧 [useSupabaseAdmin] Atualizando configuração Evolution da clínica: ${clinicaId}`);
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (instanceName !== undefined) {
        updateData.evolution_instance_name = instanceName;
        console.log(`📝 [useSupabaseAdmin] Instance name: ${instanceName}`);
      }
      
      if (apiKey !== undefined) {
        updateData.evolution_api_key = apiKey;
        console.log(`🔑 [useSupabaseAdmin] API key: ${apiKey ? '[FORNECIDA]' : '[VAZIA]'}`);
      }
      
      if (Object.keys(updateData).length <= 1) {
        console.warn('⚠️ [useSupabaseAdmin] Nenhum dado para atualizar além do timestamp');
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
      
      // Atualizar estado local das clínicas se existir
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

  // Configurar como admin (para testes)
  const configurarComoAdmin = async (): Promise<boolean> => {
    try {
      const userId = await obterUserIdAtual();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ profile_type: 'admin' })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
      
      // Atualizar estado local
      setIsAdmin(true);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Verificar status de admin na inicialização
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setAdminCheckLoading(true);
        
        const adminStatus = await verificarPermissaoAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Carregar clínicas inicialmente quando usuário for admin
  useEffect(() => {
    const carregarClinicas = async () => {
      if (isAdmin && !adminCheckLoading) {
        try {
          const clinicasData = await buscarTodasClinicas();
          setClinicas(clinicasData);
        } catch (error) {
          setClinicas([]);
        }
      }
    };

    carregarClinicas();
  }, [isAdmin, adminCheckLoading]);

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
    atualizarConfiguracaoEvolution, // ✅ NOVA FUNÇÃO EXPORTADA
  };
};
