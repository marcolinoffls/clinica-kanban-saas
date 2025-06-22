
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '@/services/dashboardService';
import { DashboardMetrics } from './dashboard/types';

/**
 * Hook para buscar dados de dashboard de qualquer clínica (modo admin)
 * 
 * O que faz:
 * - Permite que administradores busquem dados de dashboard de qualquer clínica
 * - Similar ao useDashboardData mas aceita clinicaId como parâmetro
 * 
 * Onde é usado:
 * - Páginas admin que precisam visualizar dashboard de clínicas específicas
 * 
 * Como se conecta:
 * - Usa o mesmo serviço fetchDashboardData
 * - Não depende do contexto de clínica, usa ID fornecido diretamente
 */

export const useAdminDashboardData = (
  clinicaId: string | null, 
  startDate: Date | null, 
  endDate: Date | null
) => {
  const { data, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['adminDashboardData', clinicaId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => {
      if (!clinicaId) {
        throw new Error('ID da clínica é obrigatório para admin');
      }
      return fetchDashboardData(clinicaId, startDate, endDate);
    },
    enabled: !!clinicaId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  return {
    data: data || null,
    isLoading,
    error
  };
};
