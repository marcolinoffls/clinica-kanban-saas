
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar logs de atividade no sistema
 * 
 * Funcionalidades:
 * - Buscar logs de atividade de uma clínica específica
 * - Registrar novas atividades no sistema
 * - Filtrar logs por tipo de ação
 */

export const useActivityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Função para registrar uma nova atividade
  const registrarAtividade = async (
    actionType: string,
    actorDescription: string,
    details?: string,
    clinicaId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          action_type: actionType,
          actor_description: actorDescription,
          details: details,
          clinica_id: clinicaId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      console.log('📝 Atividade registrada:', actionType);
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  };

  // Função para buscar logs de uma clínica específica
  const buscarLogsClinica = async (clinicaId: string, limite: number = 20) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('timestamp', { ascending: false })
        .limit(limite);

      if (error) throw error;
      setLogs(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs da clínica:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar logs gerais do sistema
  const buscarLogsGerais = async (limite: number = 50) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limite);

      if (error) throw error;
      setLogs(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs gerais:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    registrarAtividade,
    buscarLogsClinica,
    buscarLogsGerais
  };
};
