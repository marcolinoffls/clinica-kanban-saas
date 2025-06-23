
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para operações de clínica específicas para administradores
 * 
 * O que faz:
 * - Permite que admins atualizem configurações de qualquer clínica
 * - Operações de atualização da Evolution API
 * - Gerencia operações com privilégios administrativos
 * 
 * Onde é usado:
 * - AdminClinicDetails.tsx - página de detalhes da clínica
 * 
 * Como se conecta:
 * - Usa políticas RLS de admin já configuradas
 * - Atualiza tabela clinicas com configurações específicas
 */

interface UpdateClinicaData {
  clinica_id: string;
  evolution_instance_name?: string;
  evolution_api_key?: string;
  instagram_user_handle?: string;
}

export const useAdminClinicOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation para atualizar configurações da clínica
  const updateClinicaMutation = useMutation({
    mutationFn: async (data: UpdateClinicaData) => {
      console.log('🔧 [Admin] Atualizando clínica:', data.clinica_id);
      
      const { clinica_id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from('clinicas')
        .update(updateData)
        .eq('id', clinica_id)
        .select()
        .single();

      if (error) {
        console.error('❌ [Admin] Erro ao atualizar clínica:', error);
        throw new Error(error.message || 'Erro ao atualizar clínica');
      }

      console.log('✅ [Admin] Clínica atualizada com sucesso:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-data', variables.clinica_id] });
      
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('❌ [Admin] Erro na mutation de atualizar clínica:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar configurações.",
        variant: "destructive",
      });
    },
  });

  // Função para atualizar nome da instância Evolution
  const updateEvolutionInstanceName = async (clinica_id: string, instanceName: string) => {
    return updateClinicaMutation.mutateAsync({
      clinica_id,
      evolution_instance_name: instanceName
    });
  };

  // Função para atualizar API Key da Evolution
  const updateEvolutionApiKey = async (clinica_id: string, apiKey: string) => {
    return updateClinicaMutation.mutateAsync({
      clinica_id,
      evolution_api_key: apiKey
    });
  };

  // Função para atualizar Instagram handle
  const updateInstagramHandle = async (clinica_id: string, userHandle: string) => {
    return updateClinicaMutation.mutateAsync({
      clinica_id,
      instagram_user_handle: userHandle
    });
  };

  return {
    updateEvolutionInstanceName,
    updateEvolutionApiKey,
    updateInstagramHandle,
    isUpdating: updateClinicaMutation.isPending,
    updateClinicaMutation,
  };
};
