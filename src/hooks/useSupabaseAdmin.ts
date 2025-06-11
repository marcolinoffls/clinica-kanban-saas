
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar dados administrativos no Supabase
 * 
 * Funcionalidades:
 * - Buscar estatísticas de clínicas
 * - Atualizar dados administrativos das clínicas
 * - Verificar permissões de administrador
 * - Configurar usuário como administrador
 * - Buscar KPIs globais do sistema
 * - Gerenciar usuários das clínicas
 * - Gerenciar configurações da Evolution API (Nome da Instância e API Key)
 */

export const useSupabaseAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [clinicas, setClinicas] = useState<any[]>([]);

  // Função para obter o user_id atual
  const obterUserIdAtual = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Erro ao obter user_id:', error);
      return null;
    }
  };

  // Função para configurar o usuário atual como administrador
  const configurarComoAdmin = async () => {
    try {
      const userId = await obterUserIdAtual();
      
      if (!userId) {
        throw new Error('Usuário não está autenticado');
      }

      console.log('🔧 Configurando usuário como admin:', userId);

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          profile_type: 'admin',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('✅ Usuário configurado como admin com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao configurar usuário como admin:', error);
      throw error;
    }
  };

  // Função para verificar se o usuário atual é administrador
  const verificarPermissaoAdmin = async () => {
    try {
      const userId = await obterUserIdAtual();
      if (!userId) return false;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('profile_type')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao verificar permissões:', error);
        return false;
      }

      return profile?.profile_type === 'admin';
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  };

  // Função para buscar KPIs globais do sistema
  const buscarKPIsGlobais = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      console.log('📊 Buscando KPIs globais do sistema...');

      // KPI 1: Total de clínicas ativas
      const { data: clinicasAtivas, error: clinicasError } = await supabase
        .from('clinicas')
        .select('id')
        .eq('status', 'ativo');

      if (clinicasError) throw clinicasError;

      // KPI 2: Total de leads no sistema
      let leadsQuery = supabase.from('leads').select('id', { count: 'exact' });
      
      if (startDate && endDate) {
        leadsQuery = leadsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { count: totalLeads, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;

      // KPI 3: Novos leads no período
      let novosLeadsQuery = supabase.from('leads').select('id', { count: 'exact' });
      
      if (startDate && endDate) {
        novosLeadsQuery = novosLeadsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { count: novosLeads, error: novosLeadsError } = await novosLeadsQuery;
      if (novosLeadsError) throw novosLeadsError;

      // KPI 4: Total de usuários (não admins)
      const { data: usuarios, error: usuariosError } = await supabase
        .from('user_profiles')
        .select('id')
        .neq('profile_type', 'admin');

      if (usuariosError) throw usuariosError;

      const kpis = {
        clinicasAtivas: clinicasAtivas?.length || 0,
        totalLeads: totalLeads || 0,
        novosLeads: novosLeads || 0,
        totalUsuarios: usuarios?.length || 0
      };

      console.log('📈 KPIs globais carregados:', kpis);
      return kpis;
    } catch (error) {
      console.error('Erro ao buscar KPIs globais:', error);
      return {
        clinicasAtivas: 0,
        totalLeads: 0,
        novosLeads: 0,
        totalUsuarios: 0
      };
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar estatísticas de todas as clínicas
  const buscarEstatisticasClinicas = async () => {
    try {
      setLoading(true);
      console.log('🏥 Buscando estatísticas das clínicas...');

      const { data, error } = await supabase
        .from('clinicas_stats')
        .select('*')
        .order('nome');

      if (error) throw error;

      console.log('📊 Estatísticas das clínicas carregadas:', data);
      setClinicas(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar estatísticas das clínicas:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // NOVA FUNÇÃO: Buscar estatísticas de uma clínica específica
  const buscarEstatisticasClinica = async (clinicaId: string) => {
    try {
      console.log('🔍 Buscando estatísticas da clínica:', clinicaId);

      const { data, error } = await supabase
        .from('clinicas_stats')
        .select('*')
        .eq('id', clinicaId)
        .single();

      if (error) throw error;

      console.log('📋 Estatísticas da clínica carregadas:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas da clínica:', error);
      throw error;
    }
  };

  // Função para buscar dados detalhados de uma clínica específica
  const buscarDetalhesClinica = async (clinicaId: string) => {
    try {
      console.log('🔍 Buscando detalhes da clínica:', clinicaId);

      const { data, error } = await supabase
        .from('clinicas_stats')
        .select('*')
        .eq('id', clinicaId)
        .single();

      if (error) throw error;

      console.log('📋 Detalhes da clínica carregados:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar detalhes da clínica:', error);
      throw error;
    }
  };

  // Função para atualizar informações básicas de uma clínica
  const atualizarInformacoesClinica = async (clinicaId: string, dadosClinica: any) => {
    try {
      console.log('💾 Atualizando informações da clínica:', clinicaId);

      const { error } = await supabase
        .from('clinicas')
        .update({
          nome: dadosClinica.nome,
          razao_social: dadosClinica.razao_social,
          cnpj: dadosClinica.cnpj,
          email: dadosClinica.email,
          telefone: dadosClinica.telefone,
          endereco_completo: dadosClinica.endereco_completo,
          status: dadosClinica.status,
          plano_contratado: dadosClinica.plano_contratado,
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicaId);

      if (error) throw error;

      // Atualizar o estado local
      setClinicas(prev => prev.map(clinica => 
        clinica.id === clinicaId 
          ? { ...clinica, ...dadosClinica }
          : clinica
      ));

      console.log('✅ Informações da clínica atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar informações da clínica:', error);
      throw error;
    }
  };

  // Função para buscar usuários de uma clínica específica
  const buscarUsuariosClinica = async (clinicaId: string) => {
    try {
      console.log('👥 Buscando usuários da clínica:', clinicaId);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clinica_id', clinicaId)
        .neq('profile_type', 'admin');

      if (error) throw error;

      console.log('👥 Usuários da clínica carregados:', data);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários da clínica:', error);
      return [];
    }
  };

  // Função para atualizar o prompt administrativo de uma clínica
  const atualizarPromptClinica = async (clinicaId: string, prompt: string) => {
    try {
      console.log('💾 Atualizando prompt da clínica:', clinicaId);

      const { error } = await supabase
        .from('clinicas')
        .update({ admin_prompt: prompt })
        .eq('id', clinicaId);

      if (error) throw error;

      // Atualizar o estado local
      setClinicas(prev => prev.map(clinica => 
        clinica.id === clinicaId 
          ? { ...clinica, admin_prompt: prompt }
          : clinica
      ));

      console.log('✅ Prompt atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar prompt da clínica:', error);
      throw error;
    }
  };

  // Função para atualizar o ID da instância de integração
  const atualizarInstanciaIntegracao = async (clinicaId: string, instanceId: string) => {
    try {
      console.log('🔗 Atualizando instância de integração da clínica:', clinicaId);

      const { error } = await supabase
        .from('clinicas')
        .update({ integracao_instance_id: instanceId })
        .eq('id', clinicaId);

      if (error) throw error;

      // Atualizar o estado local
      setClinicas(prev => prev.map(clinica => 
        clinica.id === clinicaId 
          ? { ...clinica, integracao_instance_id: instanceId }
          : clinica
      ));

      console.log('✅ Instância de integração atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar instância de integração:', error);
      throw error;
    }
  };

  // Função para atualizar o nome da instância Evolution de uma clínica
  const atualizarNomeInstanciaEvolution = async (clinicaId: string, nomeInstancia: string) => {
    try {
      console.log('🔗 Atualizando nome da instância Evolution da clínica:', clinicaId);

      const { error } = await supabase
        .from('clinicas')
        .update({ evolution_instance_name: nomeInstancia })
        .eq('id', clinicaId);

      if (error) throw error;

      // Atualizar o estado local
      setClinicas(prev => prev.map(clinica => 
        clinica.id === clinicaId 
          ? { ...clinica, evolution_instance_name: nomeInstancia }
          : clinica
      ));

      console.log('✅ Nome da instância Evolution atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar nome da instância Evolution:', error);
      throw error;
    }
  };

  // Função para atualizar a API Key da Evolution de uma clínica
  const atualizarApiKeyEvolution = async (clinicaId: string, apiKey: string) => {
    try {
      console.log('🔑 Atualizando API Key da Evolution da clínica:', clinicaId);

      const { error } = await supabase
        .from('clinicas')
        .update({ evolution_api_key: apiKey })
        .eq('id', clinicaId);

      if (error) throw error;

      // Atualizar o estado local
      setClinicas(prev => prev.map(clinica => 
        clinica.id === clinicaId 
          ? { ...clinica, evolution_api_key: apiKey }
          : clinica
      ));

      console.log('✅ API Key da Evolution atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar API Key da Evolution:', error);
      throw error;
    }
  };

  return {
    loading,
    clinicas,
    obterUserIdAtual,
    configurarComoAdmin,
    verificarPermissaoAdmin,
    buscarKPIsGlobais,
    buscarEstatisticasClinicas,
    buscarEstatisticasClinica, // NOVA FUNÇÃO ADICIONADA
    buscarDetalhesClinica,
    atualizarInformacoesClinica,
    buscarUsuariosClinica,
    atualizarPromptClinica,
    atualizarNomeInstanciaEvolution,
    atualizarApiKeyEvolution
  };
};
