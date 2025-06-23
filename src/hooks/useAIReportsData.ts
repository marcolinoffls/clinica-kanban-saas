
// src/hooks/useAIReportsData.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

/**
 * Hook para buscar dados de relatórios de IA do Supabase.
 *
 * O que faz:
 * - Busca relatórios da tabela `ai_reports`.
 * - Filtra por `clinica_id`.
 * - Separa os relatórios por status: pendente, concluído, falhou.
 */
export const useAIReportsData = (
  clinicaId: string | null,
  // CORREÇÃO: Adicionamos um valor padrão ao options e validação de null
  // Isso garante que, mesmo se o hook for chamado com `null` ou `undefined`,
  // `options` será um objeto `{}` e `options.adminMode` não causará um erro.
  options: { adminMode?: boolean } | null = null,
) => {
  // Garantir que options nunca seja null
  const safeOptions = options || {};
  const { adminMode = false } = safeOptions;

  const {
    data: reports,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['ai_reports', clinicaId, adminMode],
    queryFn: async () => {
      if (!clinicaId) return [];

      const query = supabase.from('ai_reports').select('*');

      // Se não estiver no modo admin, filtrar por clinica_id
      if (!adminMode) {
        query.eq('clinica_id', clinicaId);
      }
      // Em modo admin, o ID já é o da clínica alvo, então não precisamos
      // de filtro adicional, pois queremos todos os relatórios daquela clínica.

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        console.error('Erro ao buscar relatórios de IA:', error);
        throw new Error('Não foi possível buscar os relatórios de IA.');
      }
      
      // Converter tipos do Supabase para AIReport
      return (data || []).map(report => ({
        ...report,
        delivery_method: report.delivery_method as 'in_app' | 'whatsapp',
        status: report.status as 'pending' | 'processing' | 'success' | 'failed' | 'cancelled',
        start_date: new Date(report.start_date),
        end_date: new Date(report.end_date),
        created_at: new Date(report.created_at),
        updated_at: new Date(report.updated_at)
      }));
    },
    enabled: !!clinicaId, // A query só executa se clinicaId existir.
  });

  // Memoizar as listas filtradas para otimizar a performance
  const pendingReports = useMemo(
    () =>
      reports?.filter(
        (r) => r.status === 'pending' || r.status === 'processing',
      ) || [],
    [reports],
  );

  const completedReports = useMemo(
    () => reports?.filter((r) => r.status === 'success') || [],
    [reports],
  );

  const failedReports = useMemo(
    () => reports?.filter((r) => r.status === 'failed') || [],
    [reports],
  );

  return {
    reports: reports || [],
    pendingReports,
    completedReports,
    failedReports,
    isLoading,
    refetch,
  };
};
