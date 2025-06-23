import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLeads } from './useLeadsData';
import { useEtapas } from './useEtapasData';
import { useTags } from './useTagsData';
import { useSupabaseChat } from './useSupabaseChat';
import { useUpdateLeadAiConversationStatus } from './mutations/useUpdateLeadAiConversationStatus';

/**
 * Hook principal para gerenciar dados do Supabase
 * 
 * CORREÇÃO: Removidos useEffects desnecessários que causavam loops
 */

export const useSupabaseData = () => {
  const [loading, setLoading] = useState(true);

  // Hooks especializados para cada domínio
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: etapas = [], isLoading: etapasLoading } = useEtapas();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  
  // Hook especializado para chat
  const chatHook = useSupabaseChat();

  // Hook para atualizar estado da IA por lead
  const updateLeadAiConversationStatus = useUpdateLeadAiConversationStatus();

  // Verificar se ainda está carregando dados iniciais
  useEffect(() => {
    const isStillLoading = leadsLoading || etapasLoading || tagsLoading;
    setLoading(isStillLoading);
  }, [leadsLoading, etapasLoading, tagsLoading]);

  // CORREÇÃO: Realtime subscription SIMPLIFICADA - SEM LOOPS
  useEffect(() => {
    if (!chatHook.isChatDataReady) return;

    const canalMensagens = supabase
      .channel('mensagens-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensagens',
        },
        (payload) => {
          const novaMensagem = payload.new as any;
          
          // Atualizar contador de mensagens não lidas
          if (novaMensagem.enviado_por === 'lead' && !novaMensagem.lida) {
            chatHook.setMensagensNaoLidas(contadores => ({
              ...contadores,
              [novaMensagem.lead_id]: (contadores[novaMensagem.lead_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    // Função de limpeza
    return () => {
      supabase.removeChannel(canalMensagens);
    };
  }, [chatHook.isChatDataReady]); // DEPENDÊNCIA ÚNICA

  return {
    // Dados principais das entidades
    leads: Array.isArray(leads) ? leads : [],
    etapas: Array.isArray(etapas) ? etapas : [],
    tags: Array.isArray(tags) ? tags : [],
    
    // Estados do chat
    mensagens: chatHook.mensagens || [],
    respostasProntas: chatHook.respostasProntas || [],
    mensagensNaoLidas: chatHook.mensagensNaoLidas || {},
    
    // Estado de loading geral
    loading,

    // Funções de chat
    buscarMensagensLead: chatHook.buscarMensagensLead,
    enviarMensagem: chatHook.enviarMensagem,
    marcarMensagensComoLidas: chatHook.marcarMensagensComoLidas,

    // Função para atualizar estado da IA por lead
    updateLeadAiConversationStatus: updateLeadAiConversationStatus.mutate,
  };
};