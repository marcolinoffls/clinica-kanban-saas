
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthUser } from './useAuthUser';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para operações da clínica (criar leads e etapas)
 * 
 * Este hook fornece funções para:
 * - Criar novos leads associados à clínica do usuário
 * - Criar novas etapas do kanban
 * - Gerenciar dados específicos da clínica logada
 * 
 * Todas as operações são automaticamente associadas à clínica
 * do usuário autenticado através do userProfile.clinica_id
 */

// CORREÇÃO: Interface corrigida para criação de leads
interface CreateLeadData {
  nome: string;
  telefone?: string;
  email?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  anotacoes?: string;
  origem_lead?: string;
  servico_interesse?: string;
}

interface CreateEtapaData {
  nome: string;
  ordem: number;
}

export const useClinicaOperations = () => {
  const { userProfile } = useAuthUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation para criar novos leads
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: CreateLeadData) => {
      if (!userProfile?.clinica_id) {
        throw new Error('Usuário não está associado a uma clínica');
      }

      // CORREÇÃO: Incluir clinica_id na inserção
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          clinica_id: userProfile.clinica_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar lead:', error);
        throw new Error(error.message || 'Erro ao criar lead');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Erro na mutation de criar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lead. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar novas etapas
  const createEtapaMutation = useMutation({
    mutationFn: async (etapaData: CreateEtapaData) => {
      if (!userProfile?.clinica_id) {
        throw new Error('Usuário não está associado a uma clínica');
      }

      const { data, error } = await supabase
        .from('etapas_kanban')
        .insert({
          ...etapaData,
          clinica_id: userProfile.clinica_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar etapa:', error);
        throw new Error(error.message || 'Erro ao criar etapa');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      
      toast({
        title: "Sucesso",
        description: "Etapa criada com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Erro na mutation de criar etapa:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar etapa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função para criar lead (wrapper da mutation)
  const createLead = async (leadData: CreateLeadData) => {
    return createLeadMutation.mutateAsync(leadData);
  };

  // Função para criar etapa (wrapper da mutation)
  const createEtapa = async (etapaData: CreateEtapaData) => {
    return createEtapaMutation.mutateAsync(etapaData);
  };

  return {
    // Funções principais
    createLead,
    createEtapa,
    
    // Estados das mutations
    isCreatingLead: createLeadMutation.isPending, // CORREÇÃO: usar isPending
    isCreatingEtapa: createEtapaMutation.isPending,
    
    // Objetos das mutations para acesso direto se necessário
    createLeadMutation,
    createEtapaMutation,
  };
};
