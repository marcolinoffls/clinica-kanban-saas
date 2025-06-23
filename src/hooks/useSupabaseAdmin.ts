
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from './useAdminCheck';

/**
 * Hook para operações administrativas no Supabase
 * 
 * Centraliza todas as operações que requerem privilégios administrativos,
 * incluindo busca de clínicas, usuários, estatísticas e configurações.
 */
export const useSupabaseAdmin = () => {
  const { isAdmin, loading: adminCheckLoading } = useAdminCheck();
  const [loading, setLoading] = useState(false);
  const [clinicas, setClinicas] = useState<any[]>([]);

  // Buscar todas as clínicas (apenas para admin)
  const buscarTodasClinicas = async () => {
    if (!isAdmin) return [];
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinicas_stats')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar clínica específica por ID
  const buscarClinicaPorId = async (clinicaId: string) => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    try {
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', clinicaId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar clínica:', error);
      throw error;
    }
  };

  // Buscar estatísticas de leads de uma clínica
  const buscarEstatisticasDeLeadsDaClinica = async (clinicaId: string, startDate?: Date, endDate?: Date) => {
    if (!isAdmin) throw new Error('Acesso negado');
    
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

      if (error) throw error;

      // Calcular estatísticas
      const totalLeads = data?.length || 0;
      const leadsConvertidos = data?.filter(lead => lead.convertido).length || 0;
      const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;

      return {
        totalLeads,
        leadsConvertidos,
        taxaConversao: Math.round(taxaConversao * 100) / 100,
        leadsAnuncios: data?.filter(lead => lead.origem_lead === 'anuncio').length || 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  };

  // Obter ID do usuário atual
  const obterUserIdAtual = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    return user.id;
  };

  // Configurar como admin (para testes)
  const configurarComoAdmin = async (): Promise<boolean> => {
    try {
      const userId = await obterUserIdAtual();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ profile_type: 'admin' })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao configurar como admin:', error);
      return false;
    }
  };

  // Verificar permissão de admin
  const verificarPermissaoAdmin = async (): Promise<boolean> => {
    try {
      const userId = await obterUserIdAtual();
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_type')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.profile_type === 'admin';
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  };

  // Carregar clínicas inicialmente
  useEffect(() => {
    if (isAdmin && !adminCheckLoading) {
      buscarTodasClinicas().then(setClinicas);
    }
  }, [isAdmin, adminCheckLoading]);

  return {
    loading: loading || adminCheckLoading,
    clinicas,
    obterUserIdAtual,
    configurarComoAdmin,
    verificarPermissaoAdmin,
    buscarTodasClinicas,
    buscarClinicaPorId,
    buscarEstatisticasDeLeadsDaClinica,
  };
};
