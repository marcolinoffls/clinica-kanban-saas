
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para administradores visualizarem mensagens de chat de qualquer clínica
 * 
 * O que faz:
 * - Busca mensagens de um lead específico de qualquer clínica
 * - Configura subscription em tempo real para mensagens
 * - Permite que admins vejam conversas de todas as clínicas
 * 
 * Onde é usado:
 * - ChatWindow quando usuário é admin
 * 
 * Como se conecta:
 * - Usa as políticas RLS de admin já configuradas
 * - Filtra mensagens por lead_id e clinica_id específicos
 * - Mantém sincronização em tempo real
 */

interface AdminChatMessagesHook {
  messages: any[];
  loading: boolean;
  error: string | null;
  refreshMessages: () => void;
}

export const useAdminChatMessages = (
  leadId: string | null, 
  targetClinicaId: string | null
): AdminChatMessagesHook => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar mensagens de um lead específico de qualquer clínica
  const fetchMessages = async () => {
    if (!leadId || !targetClinicaId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`📨 [useAdminChatMessages] Buscando mensagens do lead ${leadId} da clínica ${targetClinicaId}`);
      
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .eq('clinica_id', targetClinicaId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens (admin):', error);
        throw error;
      }

      console.log(`✅ [useAdminChatMessages] Encontradas ${data?.length || 0} mensagens`);
      setMessages(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar mensagens';
      console.error(`❌ [useAdminChatMessages] ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para refresh manual das mensagens
  const refreshMessages = () => {
    fetchMessages();
  };

  // Carregar mensagens quando leadId ou targetClinicaId mudam
  useEffect(() => {
    fetchMessages();
  }, [leadId, targetClinicaId]);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    if (!leadId || !targetClinicaId) return;

    console.log(`🔗 [useAdminChatMessages] Configurando subscription para lead ${leadId} da clínica ${targetClinicaId}`);

    const channel = supabase
      .channel(`admin-chat-${targetClinicaId}-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensagens',
          filter: `lead_id=eq.${leadId}`
        },
        (payload) => {
          console.log('📥 [Admin] Nova mensagem detectada:', payload.new);
          const novaMensagem = payload.new as any;
          
          // Verificar se a mensagem é da clínica correta
          if (novaMensagem.clinica_id === targetClinicaId) {
            setMessages(prev => [...prev, novaMensagem]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_mensagens',
          filter: `lead_id=eq.${leadId}`
        },
        (payload) => {
          console.log('📝 [Admin] Mensagem atualizada:', payload.new);
          const mensagemAtualizada = payload.new as any;
          
          // Verificar se a mensagem é da clínica correta
          if (mensagemAtualizada.clinica_id === targetClinicaId) {
            setMessages(prev => prev.map(msg => 
              msg.id === mensagemAtualizada.id ? mensagemAtualizada : msg
            ));
          }
        }
      )
      .subscribe();

    // Função de limpeza
    return () => {
      console.log(`🧹 [useAdminChatMessages] Removendo subscription para lead ${leadId}`);
      supabase.removeChannel(channel);
    };
  }, [leadId, targetClinicaId]);

  return {
    messages,
    loading,
    error,
    refreshMessages
  };
};
