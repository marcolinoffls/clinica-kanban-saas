
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseLeads } from './useSupabaseLeads';
import { useSupabaseEtapas } from './useSupabaseEtapas';
import { useSupabaseChat } from './useSupabaseChat';
import { useSupabaseTags } from './useSupabaseTags';

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

  // Hooks especializados
  const leadsHook = useSupabaseLeads();
  const etapasHook = useSupabaseEtapas();
  const chatHook = useSupabaseChat();
  const tagsHook = useSupabaseTags();

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
      
      // Buscar dados de todas as entidades
      const [etapasData] = await Promise.all([
        etapasHook.buscarEtapas(),
        leadsHook.buscarLeads(),
        tagsHook.buscarTags(),
        chatHook.buscarRespostasProntas()
      ]);

      // Configurar primeira etapa para novos leads se não existir
      if (etapasData && etapasData.length > 0) {
        // Atualizar função salvarLead para usar primeira etapa
        const salvarLeadComEtapa = async (leadData: any) => {
          if (!leadData.id && !leadData.etapa_kanban_id) {
            leadData.etapa_kanban_id = etapasData[0]?.id || null;
          }
          return leadsHook.salvarLead(leadData);
        };
        
        // Substituir função original
        leadsHook.salvarLead = salvarLeadComEtapa;
      }

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
          filter: `clinica_id=eq.${DEMO_CLINIC_ID}`
        },
        (payload) => {
          console.log('📥 Novo lead detectado:', payload.new);
          const novoLead = payload.new as any;
          
          leadsHook.setLeads(leadsAtuais => {
            const jaExiste = leadsAtuais.some(lead => lead.id === novoLead.id);
            if (jaExiste) {
              console.log('⚠️ Lead já existe, ignorando duplicata');
              return leadsAtuais;
            }
            
            console.log('✅ Adicionando novo lead à lista');
            return [novoLead, ...leadsAtuais];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `clinica_id=eq.${DEMO_CLINIC_ID}`
        },
        (payload) => {
          console.log('📝 Lead atualizado:', payload.new);
          const leadAtualizado = payload.new as any;
          
          leadsHook.setLeads(leadsAtuais => {
            const leadsAtualizados = leadsAtuais.map(lead =>
              lead.id === leadAtualizado.id ? { ...lead, ...leadAtualizado } : lead
            );
            
            return leadsAtualizados.sort((a, b) => {
              const dataA = a.data_ultimo_contato ? new Date(a.data_ultimo_contato).getTime() : 0;
              const dataB = b.data_ultimo_contato ? new Date(b.data_ultimo_contato).getTime() : 0;
              return dataB - dataA;
            });
          });
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
          filter: `clinica_id=eq.${DEMO_CLINIC_ID}`
        },
        (payload) => {
          console.log('📨 Nova mensagem detectada:', payload.new);
          const novaMensagem = payload.new as any;
          
          // Atualizar data_ultimo_contato do lead correspondente
          leadsHook.setLeads(leadsAtuais => {
            const leadsAtualizados = leadsAtuais.map(lead => {
              if (lead.id === novaMensagem.lead_id) {
                console.log('📅 Atualizando data_ultimo_contato do lead:', lead.id);
                return {
                  ...lead,
                  data_ultimo_contato: novaMensagem.created_at,
                  updated_at: novaMensagem.created_at
                };
              }
              return lead;
            });
            
            return leadsAtualizados.sort((a, b) => {
              const dataA = a.data_ultimo_contato ? new Date(a.data_ultimo_contato).getTime() : 0;
              const dataB = b.data_ultimo_contato ? new Date(b.data_ultimo_contato).getTime() : 0;
              return dataB - dataA;
            });
          });

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

  // Função especial para excluir etapa com validação de leads
  const excluirEtapa = async (etapaId: string) => {
    return etapasHook.excluirEtapa(etapaId, leadsHook.leads);
  };

  return {
    // Estados
    etapas: etapasHook.etapas,
    leads: leadsHook.leads,
    tags: tagsHook.tags,
    mensagens: chatHook.mensagens,
    respostasProntas: chatHook.respostasProntas,
    mensagensNaoLidas: chatHook.mensagensNaoLidas,
    loading,

    // Funções de leads
    moverLead: leadsHook.moverLead,
    salvarLead: leadsHook.salvarLead,
    excluirLead: leadsHook.excluirLead,
    buscarConsultasLead: leadsHook.buscarConsultasLead,

    // Funções de etapas
    criarEtapa: etapasHook.criarEtapa,
    editarEtapa: etapasHook.editarEtapa,
    excluirEtapa,

    // Funções de chat
    buscarMensagensLead: chatHook.buscarMensagensLead,
    enviarMensagem: chatHook.enviarMensagem,
    marcarMensagensComoLidas: chatHook.marcarMensagensComoLidas,

    // Funções de tags
    salvarTag: tagsHook.salvarTag,
    atualizarTag: tagsHook.atualizarTag,
    excluirTag: tagsHook.excluirTag,

    // Função de refresh
    refetch: fetchData
  };
};
