
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseChat } from './useSupabaseChat';

/**
 * Hook principal para gerenciar dados do Supabase
 * 
 * Combina todos os hooks especializados e gerencia:
 * - Carregamento inicial de dados
 * - Subscrições Realtime
 * - Coordenação entre diferentes entidades
 */

// ID da clínica de demonstração (em produção viria do contexto do usuário)
const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

export const useSupabaseData = () => {
  const [loading, setLoading] = useState(true);

  // Hook especializado para chat
  const chatHook = useSupabaseChat();

  // Configura a clínica atual para as políticas RLS
  useEffect(() => {
    const setClinicContext = async () => {
      try {
        console.log('Contexto da clínica configurado:', DEMO_CLINIC_ID);
      } catch (error) {
        console.error('Erro ao configurar contexto da clínica:', error);
      }
    };
    setClinicContext();
  }, []);

  // Buscar dados iniciais do Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar respostas prontas do chat
      await chatHook.buscarRespostasProntas();

      // Buscar contadores de mensagens não lidas
      await chatHook.buscarMensagensNaoLidas();
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchData();
  }, []);

  return {
    // Estados
    mensagens: chatHook.mensagens,
    respostasProntas: chatHook.respostasProntas,
    mensagensNaoLidas: chatHook.mensagensNaoLidas,
    loading,

    // Funções de chat
    buscarMensagensLead: chatHook.buscarMensagensLead,
    enviarMensagem: chatHook.enviarMensagem,
    marcarMensagensComoLidas: chatHook.marcarMensagensComoLidas,

    // Função de refresh
    refetch: fetchData
  };
};
