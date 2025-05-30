
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AgendamentoFormData } from '@/constants/agendamentos';

/**
 * Hook para gerenciar operações de agendamentos no Supabase
 * 
 * Funcionalidades:
 * - Criar novos agendamentos
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

// Exportar o tipo para uso em outros arquivos
export type { CreateAgendamentoData };
