import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';

/**
 * MODIFICADO: Hook para buscar etapas do kanban
 * 
 * Agora aceita um parâmetro opcional clinicaIdFilter para filtrar etapas por clínica:
 * - Se clinicaIdFilter for fornecido: busca etapas apenas dessa clínica
 * - Se clinicaIdFilter for null: busca etapas de todas as clínicas (modo Admin)
 * - Se clinicaIdFilter for undefined: usa o comportamento padrão (clinica do usuário)
 */
export const useEtapas = (clinicaIdFilter?: string | null) => {
  const { clinicaId } = useClinicaData();
  
  // Determinar qual clinica_id usar para a query
  const effectiveClinicaId = (() => {
    if (clinicaIdFilter !== undefined) {
      return clinicaIdFilter;
    } else {
      return clinicaId;
    }
  })();

  console.log('[useEtapas] Filtro de clínica:', { clinicaIdFilter, clinicaId, effectiveClinicaId });

  return useQuery({
    queryKey: ['etapas', effectiveClinicaId],
    queryFn: async () => {
      console.log('[useEtapas] Buscando etapas para clínica:', effectiveClinicaId || 'todas');
      
      let query = supabase
        .from('etapas_kanban')
        .select('*')
        .order('ordem');

      // Aplicar filtro de clínica se especificado
      if (effectiveClinicaId !== null) {
        query = query.eq('clinica_id', effectiveClinicaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useEtapas] Erro ao buscar etapas:', error);
        throw error;
      }

      console.log(`[useEtapas] ✅ ${data?.length || 0} etapas encontradas`);
      return data || [];
    },
    enabled: effectiveClinicaId !== undefined,
    staleTime: 60000, // 1 minuto
  });
};
