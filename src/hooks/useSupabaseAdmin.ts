
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
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('profile_type')
        .eq('user_id', '00000000-0000-0000-0000-000000000001') // ID demo
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

  return {
    loading,
    clinicas,
    obterUserIdAtual,
    configurarComoAdmin,
    verificarPermissaoAdmin,
    buscarEstatisticasClinicas,
    buscarDetalhesClinica,
    atualizarPromptClinica,
    atualizarInstanciaIntegracao
  };
};
