import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLeads } from './useLeadsData';
import { useEtapas } from './useEtapasData';
import { useTags } from './useTagsData';
import { useSupabaseChat } from './useSupabaseChat';

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
export const useSupabaseData = () => {
  
  // 📊 ESTADO LOCAL CONSOLIDADO
  const [loading, setLoading] = useState(true);     // Loading geral do sistema

  // 🔗 HOOKS ESPECIALIZADOS PARA CADA DOMÍNIO
  
  /**
   * 👥 Hook de Leads
   * Gerencia todos os leads da clínica atual do usuário
   */
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  
  /**
   * 📋 Hook de Etapas  
   * Gerencia as etapas do kanban (Novo, Contato, Proposta, etc.)
   */
  const { data: etapas = [], isLoading: etapasLoading } = useEtapas();
  
  /**
   * 🏷️ Hook de Tags
   * Gerencia tags/categorias para organização de leads
   */
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  
  /**
   * 💬 Hook Especializado para Chat
   * Gerencia mensagens, respostas prontas e contadores
   */
  const chatHook = useSupabaseChat();

  /**
   * 🔄 useEffect: Gerenciamento de Loading Consolidado
   * 
   * Monitora o loading de todos os hooks especializados e
   * define o estado de loading geral baseado na combinação.
   * 
   * O loading geral só é removido quando TODOS os dados
   * essenciais foram carregados.
   */
  useEffect(() => {
    // Verificar se algum hook ainda está carregando dados essenciais
    const isStillLoading = leadsLoading || etapasLoading || tagsLoading;
    
    // Atualizar loading consolidado
    setLoading(isStillLoading);
  }, [leadsLoading, etapasLoading, tagsLoading]);

  /**
   * 🔄 useEffect: Subscription Realtime para Chat
   * 
   * Configura subscription para receber atualizações em tempo real
   * de novas mensagens inseridas na tabela 'chat_mensagens'.
   * 
   * ⚡ OTIMIZAÇÕES IMPLEMENTADAS:
   * - Executa apenas quando dados do chat estão prontos
   * - Subscription única e eficiente
   * - Cleanup automático na desmontagem
   * - Atualização incremental de contadores
   */
  useEffect(() => {
    // ✅ Só configura subscription se dados do chat estão prontos
    if (!chatHook.isChatDataReady) return;

    // 📡 CONFIGURAR CANAL REALTIME
    const canalMensagens = supabase
      .channel('mensagens-realtime')                  // Nome único do canal
      .on(
        'postgres_changes',                           // Tipo de evento
        {
          event: 'INSERT',                            // Apenas novos registros
          schema: 'public',                           // Schema do banco
          table: 'chat_mensagens',                    // Tabela a monitorar
        },
        (payload) => {
          // 📨 PROCESSAR NOVA MENSAGEM
          const novaMensagem = payload.new as any;
          
          // 🔔 Atualizar contador de mensagens não lidas
          // Apenas para mensagens enviadas pelo lead que ainda não foram lidas
          if (novaMensagem.enviado_por === 'lead' && !novaMensagem.lida) {
            chatHook.setMensagensNaoLidas(contadores => ({
              ...contadores,
              [novaMensagem.lead_id]: (contadores[novaMensagem.lead_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();                                   // Ativar subscription

    // 🧹 FUNÇÃO DE LIMPEZA
    // Remove o canal quando componente é desmontado ou dependências mudam
    return () => {
      supabase.removeChannel(canalMensagens);
    };
  }, [chatHook.isChatDataReady]); // Dependência única e estável

  // 📤 INTERFACE PÚBLICA DO HOOK
  return {
    // 📊 DADOS DAS ENTIDADES PRINCIPAIS
    // Garantindo que sempre retornamos arrays válidos
    leads: Array.isArray(leads) ? leads : [],               // Lista de leads
    etapas: Array.isArray(etapas) ? etapas : [],             // Etapas do kanban  
    tags: Array.isArray(tags) ? tags : [],                   // Tags disponíveis
    
    // 💬 DADOS DO CHAT
    // Estados do chat com fallbacks seguros
    mensagens: chatHook.mensagens || [],                     // Mensagens carregadas
    respostasProntas: chatHook.respostasProntas || [],        // Templates de resposta
    mensagensNaoLidas: chatHook.mensagensNaoLidas || {},      // Contadores por lead
    
    // ⏳ ESTADO DE LOADING
    loading,                                                  // Loading consolidado

    // 🔧 FUNÇÕES DO CHAT
    // Interface para operações de chat
    buscarMensagensLead: chatHook.buscarMensagensLead,        // Buscar msgs de um lead
    enviarMensagem: chatHook.enviarMensagem,                  // Enviar nova mensagem
    marcarMensagensComoLidas: chatHook.marcarMensagensComoLidas, // Marcar como lidas
  };
};