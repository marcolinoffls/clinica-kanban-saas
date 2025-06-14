
/**
 * O que aquilo faz: Hook para buscar dados dinâmicos do dashboard.
 * Onde ele é usado no app: Principalmente no componente `Dashboard.tsx` para alimentar os cartões de métricas e gráficos.
 * Como ele se conecta com outras partes:
 * - Usa o `useClinica` para obter o ID da clínica ativa.
 * - Usa o `@tanstack/react-query` (`useQuery`) para gerenciar o estado da busca de dados (loading, error, data).
 * - Chama o `fetchDashboardData` do `dashboardService` para executar a busca e o processamento dos dados.
 * - A chave da query (`queryKey`) é dinâmica, incluindo o ID da clínica e as datas do filtro, para que os dados sejam recarregados automaticamente quando esses valores mudam.
 */
import { useQuery } from '@tanstack/react-query';
import { useClinica } from '@/contexts/ClinicaContext';
import { fetchDashboardData } from '@/services/dashboardService';
import { DashboardMetrics } from './dashboard/types';

export const useDashboardData = (startDate: Date | null, endDate: Date | null) => {
  const { clinicaId } = useClinica();

  // A queryKey garante que a busca seja refeita quando o filtro de data ou a clínica mudam.
  const { data, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboardData', clinicaId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => {
      // Validação para garantir que o ID da clínica existe antes de fazer a chamada.
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado');
      }
      // A lógica de busca foi movida para um serviço para melhor organização.
      return fetchDashboardData(clinicaId, startDate, endDate);
    },
    // `enabled` garante que a query só será executada se houver um `clinicaId`.
    enabled: !!clinicaId,
    // `staleTime` define que os dados são considerados "frescos" por 5 minutos,
    // evitando buscas desnecessárias em navegações rápidas.
    staleTime: 5 * 60 * 1000, // 5 minutos
    // `retry` define que a query tentará ser executada novamente 1 vez em caso de falha.
    retry: 1
  });

  return {
    data: data || null,
    isLoading,
    error
  };
};
