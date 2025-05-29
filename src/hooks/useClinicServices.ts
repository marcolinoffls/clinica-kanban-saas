
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthUser } from './useAuthUser';

/**
 * Interface para representar um serviço da clínica
 * 
 * Define a estrutura dos dados de um serviço/procedimento
 * oferecido pela clínica, baseado na tabela clinica_servicos.
 */
export interface ClinicaServico {
  id: string;
  clinica_id: string;
  nome_servico: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hook para gerenciar os serviços da clínica
 * 
 * Fornece funcionalidades para:
 * - Buscar a lista de serviços da clínica logada
 * - Adicionar novos serviços
 * - Remover serviços existentes
 * - Atualizar serviços
 * 
 * Utiliza React Query para cache e gerenciamento de estado.
 */
export const useClinicServices = () => {
  const { userProfile } = useAuthUser();
  const queryClient = useQueryClient();

  // Query para buscar os serviços da clínica
  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['clinic-services', userProfile?.clinica_id],
    queryFn: async (): Promise<ClinicaServico[]> => {
      if (!userProfile?.clinica_id) {
        console.warn('[useClinicServices] Clínica ID não encontrado');
        return [];
      }

      const { data, error } = await supabase
        .from('clinica_servicos')
        .select('*')
        .eq('clinica_id', userProfile.clinica_id)
        .eq('ativo', true)
        .order('nome_servico');

      if (error) {
        console.error('[useClinicServices] Erro ao buscar serviços:', error);
        throw new Error('Erro ao carregar serviços da clínica');
      }

      return data as ClinicaServico[];
    },
    enabled: !!userProfile?.clinica_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para adicionar um novo serviço
  const addServiceMutation = useMutation({
    mutationFn: async (nomeServico: string): Promise<ClinicaServico> => {
      if (!userProfile?.clinica_id) {
        throw new Error('Clínica não identificada');
      }

      if (!nomeServico.trim()) {
        throw new Error('Nome do serviço é obrigatório');
      }

      // Verificar se o serviço já existe
      const { data: existingService } = await supabase
        .from('clinica_servicos')
        .select('id')
        .eq('clinica_id', userProfile.clinica_id)
        .eq('nome_servico', nomeServico.trim())
        .eq('ativo', true)
        .single();

      if (existingService) {
        throw new Error('Este serviço já está cadastrado');
      }

      const { data, error } = await supabase
        .from('clinica_servicos')
        .insert({
          clinica_id: userProfile.clinica_id,
          nome_servico: nomeServico.trim(),
          ativo: true,
        })
        .select()
        .single();

      if (error) {
        console.error('[useClinicServices] Erro ao adicionar serviço:', error);
        throw new Error('Erro ao adicionar serviço');
      }

      return data as ClinicaServico;
    },
    onSuccess: () => {
      // Atualizar cache dos serviços
      queryClient.invalidateQueries({
        queryKey: ['clinic-services', userProfile?.clinica_id],
      });
      toast.success('Serviço adicionado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('[useClinicServices] Erro na mutation de adicionar:', error);
      toast.error(error.message || 'Erro ao adicionar serviço');
    },
  });

  // Mutation para remover um serviço
  const removeServiceMutation = useMutation({
    mutationFn: async (serviceId: string): Promise<void> => {
      const { error } = await supabase
        .from('clinica_servicos')
        .update({ ativo: false })
        .eq('id', serviceId);

      if (error) {
        console.error('[useClinicServices] Erro ao remover serviço:', error);
        throw new Error('Erro ao remover serviço');
      }
    },
    onSuccess: () => {
      // Atualizar cache dos serviços
      queryClient.invalidateQueries({
        queryKey: ['clinic-services', userProfile?.clinica_id],
      });
      toast.success('Serviço removido com sucesso!');
    },
    onError: (error: Error) => {
      console.error('[useClinicServices] Erro na mutation de remover:', error);
      toast.error(error.message || 'Erro ao remover serviço');
    },
  });

  return {
    services,
    isLoading,
    error,
    addService: addServiceMutation.mutateAsync,
    removeService: removeServiceMutation.mutateAsync,
    isAddingService: addServiceMutation.isPending,
    isRemovingService: removeServiceMutation.isPending,
  };
};
