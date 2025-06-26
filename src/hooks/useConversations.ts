
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';
import { useAuthUser } from './useAuthUser';

/**
 * Hook para gerenciar conversas de chat
 * 
 * O que faz:
 * - Busca leads com mensagens ativas
 * - Gerencia contadores de mensagens não lidas
 * - Marca mensagens como lidas
 * 
 * Onde é usado:
 * - ChatPage para listar conversas ativas
 * 
 * Como se conecta:
 * - Usa dados da clínica atual
 * - Integra com tabela de mensagens do chat
 */

interface Conversation {
  lead_id: string;
  nome_lead: string;
  telefone_lead: string;
  clinica_id: string;
  nome_clinica: string;
  unread_count: number;
  last_message_time: string;
  last_message_content: string;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { clinicaId } = useClinicaData();
  const { userProfile } = useAuthUser();

  // Buscar conversas ativas
  const fetchConversations = async () => {
    if (!clinicaId) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar leads com mensagens
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          nome,
          telefone,
          clinica_id,
          nome_clinica
        `)
        .eq('clinica_id', clinicaId);

      if (leadsError) throw leadsError;

      // Para cada lead, buscar contagem de mensagens não lidas e última mensagem
      const conversationsData: Conversation[] = [];
      
      for (const lead of leads || []) {
        // Contar mensagens não lidas
        const { count } = await supabase
          .from('chat_mensagens')
          .select('*', { count: 'exact', head: true })
          .eq('lead_id', lead.id)
          .eq('clinica_id', clinicaId)
          .eq('lida', false)
          .eq('enviado_por', 'lead');

        // Buscar última mensagem
        const { data: lastMessage } = await supabase
          .from('chat_mensagens')
          .select('created_at, conteudo')
          .eq('lead_id', lead.id)
          .eq('clinica_id', clinicaId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Só incluir leads que têm mensagens
        if (lastMessage) {
          conversationsData.push({
            lead_id: lead.id,
            nome_lead: lead.nome || 'Lead sem nome',
            telefone_lead: lead.telefone || '',
            clinica_id: lead.clinica_id,
            nome_clinica: lead.nome_clinica || '',
            unread_count: count || 0,
            last_message_time: lastMessage.created_at,
            last_message_content: lastMessage.conteudo
          });
        }
      }

      // Ordenar por última mensagem (mais recente primeiro)
      conversationsData.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setConversations(conversationsData);
    } catch (err: any) {
      console.error('Erro ao buscar conversas:', err);
      setError(err.message || 'Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  // Marcar mensagens como lidas
  const markAsRead = async (leadId: string) => {
    if (!clinicaId) return;

    try {
      await supabase
        .from('chat_mensagens')
        .update({ lida: true })
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaId)
        .eq('enviado_por', 'lead')
        .eq('lida', false);

      // Atualizar contadores localmente
      setConversations(prev => 
        prev.map(conv => 
          conv.lead_id === leadId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Refresh das conversas
  const refreshConversations = () => {
    fetchConversations();
  };

  // Carregar conversas quando clinicaId mudar
  useEffect(() => {
    fetchConversations();
  }, [clinicaId]);

  return {
    conversations,
    loading,
    error,
    markAsRead,
    refreshConversations
  };
};
