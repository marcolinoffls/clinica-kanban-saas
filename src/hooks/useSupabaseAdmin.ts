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
        console.error('❌ [useSupabaseAdmin] Erro ao verificar permissão:', error);
        return false;
      }
      
      const isAdminUser = data?.profile_type === 'admin';
      console.log('🔍 [useSupabaseAdmin] Status de admin:', isAdminUser);
      return isAdminUser;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro inesperado na verificação:', error);
      return false;
    }
  };

  // Buscar todas as clínicas (apenas para admin)
  const buscarTodasClinicas = async () => {
    if (!isAdmin) {
      console.warn('⚠️ [useSupabaseAdmin] Acesso negado - usuário não é admin');
      return [];
    }
    
    try {
      setLoading(true);
      console.log('🏥 [useSupabaseAdmin] Buscando todas as clínicas...');
      
      // CORRIGIDO: Usar tabela 'clinicas' ao invés de 'clinicas_stats'
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .order('nome');

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar clínicas:', error);
        throw error;
      }
      
      console.log('✅ [useSupabaseAdmin] Clínicas encontradas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro inesperado ao buscar clínicas:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar clínica específica por ID
  const buscarClinicaPorId = async (clinicaId: string) => {
    if (!isAdmin) {
      console.error('❌ [useSupabaseAdmin] Acesso negado - não é admin');
      throw new Error('Acesso negado');
    }
    
    try {
      console.log('🏥 [useSupabaseAdmin] Buscando clínica por ID:', clinicaId);
      
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', clinicaId)
        .single();

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar clínica por ID:', error);
        throw error;
      }
      
      console.log('✅ [useSupabaseAdmin] Clínica encontrada:', data?.nome);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro inesperado ao buscar clínica por ID:', error);
      throw error;
    }
  };

  // Buscar estatísticas de leads de uma clínica
  const buscarEstatisticasDeLeadsDaClinica = async (clinicaId: string, startDate?: Date, endDate?: Date) => {
    if (!isAdmin) {
      console.error('❌ [useSupabaseAdmin] Acesso negado para estatísticas');
      throw new Error('Acesso negado');
    }
    
    try {
      console.log('📊 [useSupabaseAdmin] Buscando estatísticas de leads para clínica:', clinicaId);
      
      let query = supabase
        .from('leads')
        .select('*')
        .eq('clinica_id', clinicaId);

      if (startDate && endDate) {
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        console.log('📅 [useSupabaseAdmin] Filtros de data aplicados:', { startDate, endDate });
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar estatísticas de leads:', error);
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
      
      console.log('✅ [useSupabaseAdmin] Estatísticas calculadas:', estatisticas);
      return estatisticas;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro inesperado nas estatísticas:', error);
      throw error;
    }
  };

  // Buscar estatísticas de todas as clínicas
  const buscarEstatisticasClinicas = async () => {
    if (!isAdmin) {
      console.warn('⚠️ [useSupabaseAdmin] Acesso negado para estatísticas gerais');
      return [];
    }
    
    try {
      console.log('📊 [useSupabaseAdmin] Buscando estatísticas de todas as clínicas...');
      
      // CORRIGIDO: Usar consulta complexa ao invés de view inexistente
      const { data: clinicasData, error: clinicasError } = await supabase
        .from('clinicas')
        .select('*')
        .order('nome');

      if (clinicasError) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar clínicas para estatísticas:', clinicasError);
        throw clinicasError;
      }

      // Buscar leads para cada clínica e calcular estatísticas
      const estatisticasPromises = clinicasData?.map(async (clinica) => {
        try {
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .eq('clinica_id', clinica.id);

          if (leadsError) {
            console.error(`❌ [useSupabaseAdmin] Erro ao buscar leads da clínica ${clinica.nome}:`, leadsError);
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
            console.warn(`⚠️ [useSupabaseAdmin] Erro ao buscar usuários da clínica ${clinica.nome}:`, usuariosError);
          }

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
          console.error(`❌ [useSupabaseAdmin] Erro inesperado na clínica ${clinica.nome}:`, error);
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
      console.log('✅ [useSupabaseAdmin] Estatísticas de todas as clínicas calculadas:', estatisticas.length);
      return estatisticas;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro inesperado ao buscar estatísticas das clínicas:', error);
      return [];
    }
  };

  // Buscar KPIs globais
  const buscarKPIsGlobais = async () => {
    if (!isAdmin) {
      console.warn('⚠️ [useSupabaseAdmin] Acesso negado para KPIs globais');
      return null;
    }
    
    try {
      console.log('📈 [useSupabaseAdmin] Buscando KPIs globais...');
      
      const { data, error } = await supabase
        .from('leads')
        .select('*');

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar leads para KPIs:', error);
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
      
      console.log('✅ [useSupabaseAdmin] KPIs globais calculados:', kpis);
      return kpis;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro inesperado nos KPIs globais:', error);
      return null;
    }
  };

  // Obter ID do usuário atual
  const obterUserIdAtual = async (): Promise<string> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao obter usuário:', error);
        throw error;
      }
      
      if (!user) {
        console.error('❌ [useSupabaseAdmin] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      return user.id;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro inesperado ao obter user ID:', error);
      throw error;
    }
  };

  // Configurar como admin (para testes)
  const configurarComoAdmin = async (): Promise<boolean> => {
    try {
      console.log('🔧 [useSupabaseAdmin] Configurando usuário como admin...');
      
      const userId = await obterUserIdAtual();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ profile_type: 'admin' })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao configurar como admin:', error);
        throw error;
      }
      
      console.log('✅ [useSupabaseAdmin] Usuário configurado como admin com sucesso');
      
      // Atualizar estado local
      setIsAdmin(true);
      return true;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro inesperado ao configurar admin:', error);
      return false;
    }
  };

  // Verificar status de admin na inicialização
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('🔍 [useSupabaseAdmin] Verificando status de admin...');
        setAdminCheckLoading(true);
        
        const adminStatus = await verificarPermissaoAdmin();
        setIsAdmin(adminStatus);
        
        console.log('✅ [useSupabaseAdmin] Status de admin verificado:', adminStatus);
      } catch (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao verificar status de admin:', error);
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
        console.log('🔄 [useSupabaseAdmin] Carregando clínicas automaticamente...');
        try {
          const clinicasData = await buscarTodasClinicas();
          setClinicas(clinicasData);
        } catch (error) {
          console.error('❌ [useSupabaseAdmin] Erro ao carregar clínicas automaticamente:', error);
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
  };
};