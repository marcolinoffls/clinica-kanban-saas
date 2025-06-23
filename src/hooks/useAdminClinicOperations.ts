
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para operações de clínica específicas para administradores
 * 
 * O que faz:
 * - Permite que admins criem leads para qualquer clínica específica
 * - Sobrescreve as operações padrão quando em modo admin
 * - Gerencia operações com privilégios administrativos
 * 
 * Onde é usado:
 * - Pages e componentes admin que precisam operar em clínicas específicas
 * 
 * Como se conecta:
 * - Usa políticas RLS de admin já configuradas
 * - Permite especificar clinica_id diferente do usuário logado
 */

interface CreateLeadForClinicData {
  nome?: string;
  telefone?: string;
  email?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  anotacoes?: string;
  origem_lead?: string;
  servico_interesse?: string;
  clinica_id: string; // Obrigatório - clínica específica para admin
}

export const useAdminClinicOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation para criar leads em clínicas específicas (admin)
  const createLeadForClinicMutation = useMutation({
    mutationFn: async (leadData: CreateLeadForClinicData) => {
      console.log('🔧 [Admin] Criando lead para clínica:', leadData.clinica_id);
      
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('❌ [Admin] Erro ao criar lead:', error);
        throw new Error(error.message || 'Erro ao criar lead');
      }

      console.log('✅ [Admin] Lead criado com sucesso:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-data', variables.clinica_id] });
      
      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso para a clínica selecionada!",
      });
    },
    onError: (error: any) => {
      console.error('❌ [Admin] Erro na mutation de criar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lead. Verifique as permissões.",
        variant: "destructive",
      });
    },
  });

  // Função para criar lead em clínica específica
  const createLeadForClinic = async (leadData: CreateLeadForClinicData) => {
    return createLeadForClinicMutation.mutateAsync(leadData);
  };

  return {
    createLeadForClinic,
    isCreatingLead: createLeadForClinicMutation.isPending,
    createLeadForClinicMutation,
  };
};
