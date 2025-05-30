
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AgendamentoFormData } from '@/constants/agendamentos';
import { useClinica } from '@/contexts/ClinicaContext';

/**
 * Hook para gerenciar operações de agendamentos no Supabase
 * 
 * Funcionalidades:
 * - Criar novos agendamentos
 * - Buscar agendamentos da clínica
 * - Atualizar agendamentos existentes
 * - Excluir agendamentos
 * - Invalidar cache para atualizar a UI automaticamente
 * - Feedback visual para o usuário via toast
 * 
 * Conecta com:
 * - Tabela 'agendamentos' no Supabase
 * - Sistema de autenticação para RLS
 * - React Query para cache e invalidação
 */

interface CreateAgendamentoData {
  cliente_id: string;
  clinica_id: string;
  usuario_id: string;
  titulo: string;
  data_inicio: string; // ISO date string
  data_fim: string; // ISO date string
  valor?: number;
  status: string;
  descricao?: string;
}

interface UpdateAgendamentoData {
  id: string;
  cliente_id?: string;
  titulo?: string;
  data_inicio?: string;
  data_fim?: string;
  valor?: number;
  status?: string;
  descricao?: string;
}

interface AgendamentoFromDatabase {
  id: string;
  cliente_id: string;
  clinica_id: string;
  usuario_id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  valor: number | null;
  status: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

// Hook para buscar agendamentos da clínica
export const useFetchAgendamentos = () => {
  const { clinicaAtiva } = useClinica();

  return useQuery({
    queryKey: ['agendamentos', clinicaAtiva?.id],
    queryFn: async (): Promise<AgendamentoFromDatabase[]> => {
      if (!clinicaAtiva?.id) {
        console.warn('🚫 Tentativa de buscar agendamentos sem clinica_id');
        return [];
      }

      console.log('🔄 Buscando agendamentos da clínica:', clinicaAtiva.id);

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('clinica_id', clinicaAtiva.id)
        .order('data_inicio', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        throw new Error('Falha ao carregar agendamentos');
      }

      console.log('✅ Agendamentos encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!clinicaAtiva?.id, // Só executa se tiver clinica_id
    staleTime: 2 * 60 * 1000, // Dados ficam "frescos" por 2 minutos
  });
};

// Hook para criar agendamento
export const useCreateAgendamento = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgendamentoData) => {
      console.log('🔄 Criando agendamento no Supabase:', data);
      
      const { data: agendamento, error } = await supabase
        .from('agendamentos')
        .insert([{
          cliente_id: data.cliente_id,
          clinica_id: data.clinica_id,
          usuario_id: data.usuario_id,
          titulo: data.titulo,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
          valor: data.valor || 0,
          status: data.status,
          descricao: data.descricao
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        throw error;
      }

      console.log('✅ Agendamento criado com sucesso:', agendamento);
      return agendamento;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      toast({
        title: "Agendamento criado!",
        description: `O agendamento "${data.titulo}" foi criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutação de agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar agendamento",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
      });
    },
  });
};

// Hook para atualizar agendamento
export const useUpdateAgendamento = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAgendamentoData) => {
      console.log('🔄 Atualizando agendamento no Supabase:', data);
      
      const { id, ...updateData } = data;
      
      const { data: agendamento, error } = await supabase
        .from('agendamentos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar agendamento:', error);
        throw error;
      }

      console.log('✅ Agendamento atualizado com sucesso:', agendamento);
      return agendamento;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      toast({
        title: "Agendamento atualizado!",
        description: `O agendamento "${data.titulo}" foi atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na atualização de agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar agendamento",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
      });
    },
  });
};

// Hook para excluir agendamento
export const useDeleteAgendamento = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agendamentoId: string) => {
      console.log('🔄 Excluindo agendamento no Supabase:', agendamentoId);
      
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoId);

      if (error) {
        console.error('❌ Erro ao excluir agendamento:', error);
        throw error;
      }

      console.log('✅ Agendamento excluído com sucesso');
      return { id: agendamentoId };
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      toast({
        title: "Agendamento excluído!",
        description: "O agendamento foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na exclusão de agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir agendamento",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
      });
    },
  });
};

// Exportar tipos para uso em outros arquivos
export type { CreateAgendamentoData, UpdateAgendamentoData, AgendamentoFromDatabase };
