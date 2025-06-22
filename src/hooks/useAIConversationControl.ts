import { useState, useEffect } from 'react';
import { toast } from 'sonner';
// CORREÇÃO: Importa o cliente Supabase centralizado do projeto.
import { supabase } from '@/integrations/supabase/client';

// Define a interface para as propriedades que o hook recebe.
interface UseAIConversationControlProps {
  leadId: string | null;
}

/**
 * Hook para controlar a ativação e desativação da conversa com IA para um lead específico.
 * @param {UseAIConversationControlProps} props - Propriedades do hook, incluindo o ID do lead.
 * @returns Um objeto com o estado da IA e funções para controlá-la.
 */
export const useAIConversationControl = ({ leadId }: UseAIConversationControlProps) => {
    // CORREÇÃO: A linha 'const supabase = useSupabaseClient()' foi removida,
    // pois agora importamos o 'supabase' diretamente.

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
    }, [leadId]); // 'supabase' foi removido do array de dependências pois é uma instância estática.

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