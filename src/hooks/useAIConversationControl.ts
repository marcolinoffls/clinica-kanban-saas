import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

/**
 * Hook para controlar o estado da IA em uma conversa específica
 * 
 * Este hook:
 * - Permite ativar/desativar a IA em conversas individuais
 * - Persiste o estado no banco de dados (Supabase)
 * - Lida com estados de carregamento e erros
 * - Otimizado para evitar chamadas desnecessárias ao banco
 */

/**
 * Props para o hook useAIConversationControl
 * Corrigindo a interface para aceitar leadId como string
 */
export interface UseAIConversationControlProps {
  leadId: string;
}

export const useAIConversationControl = ({ leadId }: UseAIConversationControlProps) => {
  const supabase = useSupabaseClient();
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchInitialState = async () => {
      if (!leadId) {
        console.warn("[useAIConversationControl] leadId não fornecido. IA desativada.");
        return;
      }

      setIsInitializing(true);
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('ai_conversation_enabled')
          .eq('id', leadId)
          .single();

        if (error) {
          console.error("[useAIConversationControl] Erro ao buscar estado inicial da IA:", error);
          toast.error("Erro ao carregar estado da IA.");
          return;
        }

        setAiEnabled(data?.ai_conversation_enabled || false);
        console.log(`[useAIConversationControl] Estado inicial da IA para lead ${leadId}: ${data?.ai_conversation_enabled}`);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchInitialState();
  }, [supabase, leadId]);

  const toggleAI = async () => {
    if (!leadId) {
      console.warn("[useAIConversationControl] leadId não fornecido. Não é possível alterar o estado da IA.");
      toast.warn("Selecione um lead para ativar/desativar a IA.");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ ai_conversation_enabled: !aiEnabled })
        .eq('id', leadId);

      if (error) {
        console.error("[useAIConversationControl] Erro ao atualizar estado da IA:", error);
        toast.error("Erro ao atualizar estado da IA.");
        return;
      }

      setAiEnabled(!aiEnabled);
      toast.success(`IA ${!aiEnabled ? 'ativada' : 'desativada'} para esta conversa.`);
      console.log(`[useAIConversationControl] IA ${!aiEnabled ? 'ativada' : 'desativada'} para lead ${leadId}.`);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    aiEnabled,
    toggleAI,
    isInitializing,
    isUpdating
  };
};
