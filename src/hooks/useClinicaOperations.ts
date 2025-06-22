/**
 * =================================================================
 * ARQUIVO: useClinicaOperations.ts
 * =================================================================
 *
 * DESCRIÇÃO:
 * Hook central para operações de escrita relacionadas à clínica,
 * como a criação de leads, etapas do Kanban e tags.
 *
 * FUNCIONALIDADES:
 * - Garante que todas as operações de criação sejam associadas
 * automaticamente à clínica do usuário logado.
 * - Fornece feedback ao usuário (toasts de sucesso/erro).
 * - Invalida os caches de dados relevantes para que a interface
 * seja atualizada automaticamente após uma operação.
 *
 * SEGURANÇA:
 * - O ID da clínica é obtido do perfil do usuário autenticado
 * ('userProfile'), que é uma fonte segura, e não de dados
 * enviados pelo formulário, prevenindo erros de RLS.
 *
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthUser } from './useAuthUser';
import { useToast } from '@/hooks/use-toast';

// Interface para os dados necessários para criar um lead.
// Os campos são opcionais para acomodar diferentes fontes de criação (ex: formulário, automação).
interface CreateLeadData {
  nome?: string;
  telefone?: string;
  email?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  anotacoes?: string;
  origem_lead?: string;
  servico_interesse?: string;
}

// Interface para os dados de criação de uma etapa do Kanban.
interface CreateEtapaData {
  nome: string;
  ordem: number;
}

// Interface para os dados de criação de uma tag.
interface CreateTagData {
  nome: string;
  cor?: string;
}

// Interface para os dados de atualização da clínica.
interface UpdateClinicaData {
  id: string;
  nome?: string;
  razao_social?: string;
  email?: string;
  telefone?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  complemento?: string;
}

// Hook principal que exporta todas as operações.
export const useClinicaOperations = () => {
  const { userProfile } = useAuthUser(); // Hook para obter o perfil do usuário logado.
  const queryClient = useQueryClient(); // Cliente do React Query para gerenciar cache.
  const { toast } = useToast(); // Hook para exibir notificações (toasts).

  // =================================================================
  // MUTATION PARA CRIAR NOVOS LEADS
  // =================================================================
  const createLeadMutation = useMutation({
    // 'mutationFn' é a função assíncrona que executa a lógica de inserção.
    mutationFn: async (leadData: CreateLeadData) => {
      // 1. Validação de Segurança: Garante que o usuário tem um 'clinica_id' associado.
      if (!userProfile?.clinica_id) {
        throw new Error('Usuário não está associado a uma clínica');
      }

      // 2. ========= INÍCIO DA CORREÇÃO DE SEGURANÇA =========
      // Removemos a propriedade 'clinica_id' do objeto 'leadData' que vem do formulário,
      // caso ela exista. Isso evita que um valor incorreto do formulário sobrescreva o ID correto.
      const { clinica_id, ...dadosDoFormulario } = leadData as any;

      // Criamos um novo objeto para inserção, garantindo que o `clinica_id`
      // seja SEMPRE o do usuário autenticado, que é a fonte segura da verdade.
      const dadosParaInserir = {
        ...dadosDoFormulario, // Pega todos os outros dados do formulário.
        clinica_id: userProfile.clinica_id, // Adiciona o ID da clínica correto.
      };
      // ========= FIM DA CORREÇÃO DE SEGURANÇA =========

      // 3. Executa a inserção no banco de dados com os dados seguros.
      const { data, error } = await supabase
        .from('leads')
        .insert(dadosParaInserir) // Usa o objeto corrigido.
        .select()
        .single();

      // 4. Tratamento de Erro: Se o Supabase retornar um erro, ele é lançado.
      if (error) {
        console.error('Erro ao criar lead:', error);
        throw new Error(error.message || 'Erro ao criar lead');
      }

      return data;
    },
    // 'onSuccess' é executado quando a mutation tem sucesso.
    onSuccess: () => {
      // Invalida a query 'leads' para forçar a recarga dos dados e atualizar a interface.
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      // Exibe uma notificação de sucesso.
      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso!",
      });
    },
    // 'onError' é executado quando a mutation falha.
    onError: (error: any) => {
      console.error('Erro na mutation de criar lead:', error);
      // Exibe uma notificação de erro.
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lead. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // (As mutations para Etapa, Tag e Clínica seguem uma lógica similar)

  // =================================================================
  // MUTATION PARA CRIAR NOVAS ETAPAS
  // =================================================================
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

      if (error) throw new Error(error.message || 'Erro ao criar etapa');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast({ title: "Sucesso", description: "Etapa criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // =================================================================
  // MUTATION PARA CRIAR NOVAS TAGS
  // =================================================================
  const createTagMutation = useMutation({
    mutationFn: async (tagData: CreateTagData) => {
      if (!userProfile?.clinica_id) {
        throw new Error('Usuário não está associado a uma clínica');
      }

      const { data, error } = await supabase
        .from('tags')
        .insert({
          ...tagData,
          clinica_id: userProfile.clinica_id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message || 'Erro ao criar tag');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: "Sucesso", description: "Tag criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // =================================================================
  // MUTATION PARA ATUALIZAR DADOS DA CLÍNICA
  // =================================================================
  const updateClinicaMutation = useMutation({
    mutationFn: async (clinicaData: UpdateClinicaData) => {
      const { id, ...updateData } = clinicaData;

      const { data, error } = await supabase
        .from('clinicas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message || 'Erro ao atualizar clínica');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinica'] });
      toast({ title: "Sucesso", description: "Dados da clínica atualizados!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // Funções "wrapper" para facilitar o uso das mutations nos componentes.
  const createLead = async (leadData: CreateLeadData) => {
    return createLeadMutation.mutateAsync(leadData);
  };

  const createEtapa = async (etapaData: CreateEtapaData) => {
    return createEtapaMutation.mutateAsync(etapaData);
  };

  const createTag = async (tagData: CreateTagData) => {
    return createTagMutation.mutateAsync(tagData);
  };

  // Retorna as funções e estados para serem usados em outros lugares da aplicação.
  return {
    createLead,
    createEtapa,
    createTag,
    
    isCreatingLead: createLeadMutation.isPending,
    isCreatingEtapa: createEtapaMutation.isPending,
    isCreatingTag: createTagMutation.isPending,
    
    createLeadMutation,
    createEtapaMutation,
    createTagMutation,
    updateClinicaMutation,
  };
};

// Hook de conveniência para quem precisa apenas da função de atualizar a clínica.
export const useUpdateClinica = () => {
  const { updateClinicaMutation } = useClinicaOperations();
  return updateClinicaMutation;
};