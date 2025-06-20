
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseChat } from './useSupabaseChat';
import { useLeads, useUpdateLeadAiConversationStatus } from './useLeadsData';
import { useEtapas } from './useEtapasData';
import { useTags } from './useTagsData';

/**
 * Hook principal para gerenciar dados do Supabase
 * 
 * MODIFICADO: Agora aceita clinica_id opcional para filtro
 * - Se clinica_id for fornecido: filtra dados apenas dessa clínica
 * - Se clinica_id for null: busca dados de todas as clínicas (apenas Admin)
 * - Se clinica_id for undefined: usa o comportamento padrão (clínica do usuário)
 * 
 * Este hook combina todos os hooks especializados e gerencia:
 * - Integração dos dados de diferentes entidades (leads, etapas, tags, chat)
 * - Subscrições Realtime para atualizações em tempo real
 * - Coordenação entre diferentes hooks especializados
 * - Controle de estado da IA por lead
 * - NOVO: Filtro por clínica para sistema multi-tenant
 * 
 * Utiliza os hooks especializados para cada domínio:
 * - useLeads: para dados de leads (agora com filtro de clínica)
 * - useEtapas: para etapas do kanban
 * - useTags: para tags/categorias
 * - useSupabaseChat: para mensagens e chat
 * - useUpdateLeadAiConversationStatus: para controle de IA por lead
 */

export const useSupabaseData = (clinicaIdFilter?: string | null) => {
  const [loading, setLoading] = useState(true);

  console.log('[useSupabaseData] Filtro de clínica:', clinicaIdFilter);

  // MODIFICADO: Hooks especializados agora recebem filtro de clínica
  const { data: leads = [], isLoading: leadsLoading } = useLeads(clinicaIdFilter);
  const { data: etapas = [], isLoading: etapasLoading } = useEtapas(clinicaIdFilter);
  const { data: tags = [], isLoading: tagsLoading } = useTags(clinicaIdFilter);
  
  // Hook especializado para chat
  const chatHook = useSupabaseChat();

  // Hook para atualizar estado da IA por lead
  const updateLeadAiConversationStatus = useUpdateLeadAiConversationStatus();

  // Verificar se ainda está carregando dados iniciais
  useEffect(() => {
    const isStillLoading = leadsLoading || etapasLoading || tagsLoading;
    setLoading(isStillLoading);
    
    if (!isStillLoading) {
      console.log(`[useSupabaseData] ✅ Dados carregados para clínica: ${clinicaIdFilter || 'todas'}`);
      console.log(`[useSupabaseData] Leads: ${leads.length}, Etapas: ${etapas.length}, Tags: ${tags.length}`);
    }
  }, [leadsLoading, etapasLoading, tagsLoading, clinicaIdFilter, leads.length, etapas.length, tags.length]);

  // Buscar dados iniciais do chat
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        console.log('🔄 Carregando dados iniciais do chat para clínica:', clinicaIdFilter || 'todas');
        
        // Buscar respostas prontas do chat (filtradas por clínica se necessário)
        await chatHook.buscarRespostasProntas();

        // Buscar contadores de mensagens não lidas (filtradas por clínica se necessário)
        await chatHook.buscarMensagensNaoLidas();
        
        console.log('✅ Dados do chat carregados');
      } catch (error) {
        console.error('❌ Erro ao carregar dados do chat:', error);
      }
    };

    fetchChatData();
  }, [clinicaIdFilter]); // Recarregar quando clínica muda

  // Configurar Realtime para leads e mensagens
  useEffect(() => {
    console.log('🔄 Configurando subscrições Realtime para leads e mensagens');
    console.log('🏥 Filtro de clínica ativo:', clinicaIdFilter || 'todas as clínicas');

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
          
          // Se tiver filtro de clínica, verificar se o lead pertence à clínica
          if (clinicaIdFilter && payload.new.clinica_id !== clinicaIdFilter) {
            console.log('⚠️ Lead ignorado - não pertence à clínica filtrada');
            return;
          }
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
          
          // Se tiver filtro de clínica, verificar se o lead pertence à clínica
          if (clinicaIdFilter && payload.new.clinica_id !== clinicaIdFilter) {
            console.log('⚠️ Atualização ignorada - não pertence à clínica filtrada');
            return;
          }
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

          // Se tiver filtro de clínica, verificar se a mensagem pertence à clínica
          if (clinicaIdFilter && novaMensagem.clinica_id !== clinicaIdFilter) {
            console.log('⚠️ Mensagem ignorada - não pertence à clínica filtrada');
            return;
          }

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
  }, [clinicaIdFilter]); // Reconfigurar quando clínica muda

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

    // Informações sobre filtro atual
    clinicaIdFilter,

    // Funções de chat
    buscarMensagensLead: chatHook.buscarMensagensLead,
    enviarMensagem: chatHook.enviarMensagem,
    marcarMensagensComoLidas: chatHook.marcarMensagensComoLidas,

    // Função para atualizar estado da IA por lead
    updateLeadAiConversationStatus: updateLeadAiConversationStatus.mutate,
  };
};
