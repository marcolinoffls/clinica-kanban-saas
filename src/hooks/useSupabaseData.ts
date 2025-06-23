import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLeads } from './useLeadsData';
import { useEtapas } from './useEtapasData';
import { useTags } from './useTagsData';
import { useSupabaseChat } from './useSupabaseChat';
import { useUpdateLeadAiConversationStatus } from './useSupabaseLeads';


/**
 * 🎯 Hook Principal para Gerenciamento de Dados do Supabase
 * 
 * 📋 RESPONSABILIDADES:
 * - Agregar dados de diferentes domínios (leads, etapas, tags, chat)
 * - Gerenciar estado de loading consolidado
 * - Configurar subscriptions Realtime para atualizações automáticas
 * - Fornecer interface unificada para componentes
 * 
 * 🔗 HOOKS ESPECIALIZADOS UTILIZADOS:
 * - useLeads: Dados de leads e operações CRUD
 * - useEtapas: Etapas do kanban e configurações
 * - useTags: Tags/categorias para organização
 * - useSupabaseChat: Mensagens e chat em tempo real
 * 
 * 🔄 REALTIME:
 * - Subscription para novos mensagens no chat
 * - Atualização automática de contadores
 * - Sincronização em tempo real entre usuários
 * 
 * ⚡ PERFORMANCE:
 * - Hooks especializados com cache independente
 * - Loading states otimizados
 * - Cleanup adequado de subscriptions
 * 
 * 🎯 CASOS DE USO:
 * - Página principal do chat/kanban
 * - Dashboard com dados consolidados
 * - Relatórios que precisam de múltiplas entidades
 */


/**
 * 🎯 Hook Principal para Gerenciamento de Dados do Supabase
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Função buscarMensagensLead agora é acessível diretamente
 * - Melhor integração com ChatWindow para usuários normais
 * - Mantém compatibilidade com modo admin
 */
export const useSupabaseData = () => {
  const [loading, setLoading] = useState(true);

  // 🔗 HOOKS ESPECIALIZADOS
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: etapas = [], isLoading: etapasLoading } = useEtapas();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const chatHook = useSupabaseChat();

  // 📊 LOADING CONSOLIDADO
  useEffect(() => {
    const isStillLoading = leadsLoading || etapasLoading || tagsLoading;
    setLoading(isStillLoading);
  }, [leadsLoading, etapasLoading, tagsLoading]);

  // 🔄 SUBSCRIPTION REALTIME
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
          
          if (novaMensagem.enviado_por === 'lead' && !novaMensagem.lida) {
            chatHook.setMensagensNaoLidas(contadores => ({
              ...contadores,
              [novaMensagem.lead_id]: (contadores[novaMensagem.lead_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalMensagens);
    };
  }, [chatHook.isChatDataReady]);

  // 📤 INTERFACE PÚBLICA MELHORADA
  return {
    // 📊 DADOS DAS ENTIDADES
    leads: Array.isArray(leads) ? leads : [],
    etapas: Array.isArray(etapas) ? etapas : [],
    tags: Array.isArray(tags) ? tags : [],
    
    // 💬 DADOS DO CHAT
    mensagens: chatHook.mensagens || [],
    respostasProntas: chatHook.respostasProntas || [],
    mensagensNaoLidas: chatHook.mensagensNaoLidas || {},
    
    // ⏳ LOADING
    loading,

    // 🔧 FUNÇÕES DO CHAT (CORRIGIDAS)
    // CORREÇÃO: Expor função buscarMensagensLead diretamente
    buscarMensagensLead: chatHook.buscarMensagensLead,
    enviarMensagem: chatHook.enviarMensagem,
    marcarMensagensComoLidas: chatHook.marcarMensagensComoLidas,

    // ✅ STATUS DE PRONTIDÃO
    isChatDataReady: chatHook.isChatDataReady,
  };
};