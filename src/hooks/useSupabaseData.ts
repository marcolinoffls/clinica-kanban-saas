
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseChat } from './useSupabaseChat';
import { useLeads } from './useLeadsData';
import { useEtapas } from './useEtapasData';
import { useTags } from './useTagsData';

/**
 * Hook principal para gerenciar dados do Supabase
 * 
 * Este hook combina todos os hooks especializados e gerencia:
 * - Integração dos dados de diferentes entidades (leads, etapas, tags, chat)
 * - Subscrições Realtime para atualizações em tempo real
 * - Coordenação entre diferentes hooks especializados
 * 
 * Utiliza os hooks especializados para cada domínio:
 * - useLeads: para dados de leads
 * - useEtapas: para etapas do kanban
 * - useTags: para tags/categorias
 * - useSupabaseChat: para mensagens e chat
 */

export const useSupabaseData = () => {
  const [loading, setLoading] = useState(true);

  // Hooks especializados para cada domínio
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: etapas = [], isLoading: etapasLoading } = useEtapas();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  
  // Hook especializado para chat
  const chatHook = useSupabaseChat();

  // Verificar se ainda está carregando dados iniciais
  useEffect(() => {
    const isStillLoading = leadsLoading || etapasLoading || tagsLoading;
    setLoading(isStillLoading);
  }, [leadsLoading, etapasLoading, tagsLoading]);

  // Buscar dados iniciais do chat
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        console.log('🔄 Carregando dados iniciais do chat...');
        
        // Buscar respostas prontas do chat
        await chatHook.buscarRespostasProntas();

        // Buscar contadores de mensagens não lidas
        await chatHook.buscarMensagensNaoLidas();
        
        console.log('✅ Dados do chat carregados');
      } catch (error) {
        console.error('❌ Erro ao carregar dados do chat:', error);
      }
    };

    fetchChatData();
  }, []);

  // Configurar Realtime para leads e mensagens
  useEffect(() => {
    console.log('🔄 Configurando subscrições Realtime para leads e mensagens');

    // Canal para escutar novos leads
    const canalLeads = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('📥 Novo lead detectado:', payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('📝 Lead atualizado:', payload.new);
        }
      )
      .subscribe((status) => {
        console.log('🔗 Status da subscrição Realtime (leads):', status);
      });

    // Canal para escutar novas mensagens
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
          console.log('📨 Nova mensagem detectada:', payload.new);
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
      .subscribe((status) => {
        console.log('🔗 Status da subscrição Realtime (mensagens):', status);
      });

    // Função de limpeza
    return () => {
      console.log('🧹 Removendo subscrições Realtime');
      supabase.removeChannel(canalLeads);
      supabase.removeChannel(canalMensagens);
    };
  }, []);

  return {
    // Dados principais das entidades
    leads,
    etapas,
    tags,
    
    // Estados do chat
    mensagens: chatHook.mensagens,
    respostasProntas: chatHook.respostasProntas,
    mensagensNaoLidas: chatHook.mensagensNaoLidas,
    
    // Estado de loading geral
    loading,

    // Funções de chat
    buscarMensagensLead: chatHook.buscarMensagensLead,
    enviarMensagem: chatHook.enviarMensagem,
    marcarMensagensComoLidas: chatHook.marcarMensagensComoLidas,
  };
};
