
import { useEtapasData } from '@/hooks/useEtapasData';

/**
 * Hook específico para buscar etapas do Kanban
 * 
 * Este hook é um wrapper do useEtapasData para manter
 * compatibilidade com o código existente do Kanban
 */
export const useEtapasKanban = () => {
  const { data: etapas, isLoading, error, refetch } = useEtapasData();
  
  return {
    data: etapas || [],
    isLoading,
    error,
    refetch
  };
};
