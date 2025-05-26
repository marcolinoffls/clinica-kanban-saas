import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook personalizado para gerenciar dados do Supabase com atualizações em tempo real
 * 
 * Funcionalidades:
 * - Conecta com as tabelas do Supabase
 * - Gerencia estado dos dados
 * - Fornece funções para CRUD
 * - Simula clínica atual (em produção seria baseada no usuário logado)
 * - Validação de dados antes de enviar ao banco
 * - Gerenciamento de mensagens de chat e respostas prontas
 * - Atualizações automáticas via Supabase Realtime para leads e mensagens
 */

// ID da clínica de demonstração (em produção viria do contexto do usuário)
const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

export const useSupabaseData = () => {
  const [etapas, setEtapas] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [respostasProntas, setRespostasProntas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configura a clínica atual para as políticas RLS
  useEffect(() => {
    const setClinicContext = async () => {
      try {
        // Em ambiente de demonstração, não precisamos configurar RPC
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
      
      // Buscar etapas ordenadas
      const { data: etapasData, error: etapasError } = await supabase
        .from('etapas_kanban')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID)
        .order('ordem');

      if (etapasError) throw etapasError;

      // Buscar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID);

      if (leadsError) throw leadsError;

      // Buscar tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID);

      if (tagsError) throw tagsError;

      // Buscar respostas prontas
      const { data: respostasData, error: respostasError } = await supabase
        .from('respostas_prontas')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID)
        .eq('ativo', true);

      if (respostasError) throw respostasError;

      setEtapas(etapasData || []);
      setLeads(leadsData || []);
      setTags(tagsData || []);
      setRespostasProntas(respostasData || []);
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
          
          setLeads(leadsAtuais => {
            // Verificar se o lead já existe (evitar duplicatas)
            const jaExiste = leadsAtuais.some(lead => lead.id === novoLead.id);
            if (jaExiste) {
              console.log('⚠️ Lead já existe, ignorando duplicata');
              return leadsAtuais;
            }
            
            console.log('✅ Adicionando novo lead à lista');
            return [...leadsAtuais, novoLead];
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
          
          setLeads(leadsAtuais => {
            return leadsAtuais.map(lead =>
              lead.id === leadAtualizado.id ? { ...lead, ...leadAtualizado } : lead
            );
          });
        }
      )
      .subscribe((status) => {
        console.log('🔗 Status da subscrição Realtime (leads):', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscrição Realtime ativa para leads');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscrição Realtime para leads');
        }
      });

    // Canal para escutar novas mensagens (para atualizar data_ultimo_contato dos leads)
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
          console.log('📨 Nova mensagem detectada para atualizar leads:', payload.new);
          const novaMensagem = payload.new as any;
          
          // Atualizar o data_ultimo_contato do lead correspondente
          setLeads(leadsAtuais => {
            return leadsAtuais.map(lead => {
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
          });
        }
      )
      .subscribe((status) => {
        console.log('🔗 Status da subscrição Realtime (mensagens):', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscrição Realtime ativa para mensagens');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscrição Realtime para mensagens');
        }
      });

    // Função de limpeza para remover subscrições
    return () => {
      console.log('🧹 Removendo subscrições Realtime');
      supabase.removeChannel(canalLeads);
      supabase.removeChannel(canalMensagens);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Função para mover lead entre etapas
  const moverLead = async (leadId: string, novaEtapaId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          etapa_kanban_id: novaEtapaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Atualizar estado local
      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, etapa_kanban_id: novaEtapaId }
          : lead
      ));
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      throw error;
    }
  };

  // Função para criar nova etapa
  const criarEtapa = async (nome: string) => {
    try {
      const proximaOrdem = Math.max(...etapas.map(e => e.ordem), 0) + 1;
      
      const { data, error } = await supabase
        .from('etapas_kanban')
        .insert({
          nome,
          ordem: proximaOrdem,
          clinica_id: DEMO_CLINIC_ID
        })
        .select()
        .single();

      if (error) throw error;

      setEtapas(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
      throw error;
    }
  };

  // Função para editar nome da etapa
  const editarEtapa = async (etapaId: string, novoNome: string) => {
    try {
      const { error } = await supabase
        .from('etapas_kanban')
        .update({ nome: novoNome })
        .eq('id', etapaId);

      if (error) throw error;

      setEtapas(prev => prev.map(etapa => 
        etapa.id === etapaId 
          ? { ...etapa, nome: novoNome }
          : etapa
      ));
    } catch (error) {
      console.error('Erro ao editar etapa:', error);
      throw error;
    }
  };

  // Função para excluir etapa
  const excluirEtapa = async (etapaId: string) => {
    try {
      // Verificar se há leads nesta etapa
      const leadsNaEtapa = leads.filter(lead => lead.etapa_kanban_id === etapaId);
      
      if (leadsNaEtapa.length > 0) {
        throw new Error('Não é possível excluir uma etapa que contém leads. Mova os leads para outra etapa primeiro.');
      }

      const { error } = await supabase
        .from('etapas_kanban')
        .delete()
        .eq('id', etapaId);

      if (error) throw error;

      setEtapas(prev => prev.filter(etapa => etapa.id !== etapaId));
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
      throw error;
    }
  };

  // Função para salvar lead com validação
  const salvarLead = async (leadData: any) => {
    try {
      // Validação local antes de enviar
      if (!leadData.nome?.trim()) {
        throw new Error('Nome do lead é obrigatório');
      }
      if (!leadData.telefone?.trim()) {
        throw new Error('Telefone do lead é obrigatório');
      }

      if (leadData.id) {
        // Atualizar lead existente
        const { error } = await supabase
          .from('leads')
          .update({
            nome: leadData.nome.trim(),
            telefone: leadData.telefone.trim(),
            email: leadData.email?.trim() || null,
            anotacoes: leadData.anotacoes?.trim() || null,
            tag_id: leadData.tag_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadData.id);

        if (error) throw error;

        setLeads(prev => prev.map(lead => 
          lead.id === leadData.id ? { ...lead, ...leadData } : lead
        ));
      } else {
        // Criar novo lead
        const { data, error } = await supabase
          .from('leads')
          .insert({
            nome: leadData.nome.trim(),
            telefone: leadData.telefone.trim(),
            email: leadData.email?.trim() || null,
            anotacoes: leadData.anotacoes?.trim() || null,
            tag_id: leadData.tag_id || null,
            clinica_id: DEMO_CLINIC_ID,
            etapa_kanban_id: etapas[0]?.id // Primeira etapa por padrão
          })
          .select()
          .single();

        if (error) throw error;

        setLeads(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      throw error;
    }
  };

  // Função para buscar consultas de um lead específico (usando agendamentos)
  const buscarConsultasLead = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('cliente_id', leadId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      return [];
    }
  };

  // Função para buscar mensagens de um lead específico
  const buscarMensagensLead = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  };

  // Função para enviar mensagem
  const enviarMensagem = async (leadId: string, conteudo: string, tipo: string = 'texto') => {
    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .insert({
          lead_id: leadId,
          clinica_id: DEMO_CLINIC_ID,
          conteudo: conteudo.trim(),
          enviado_por: 'usuario',
          tipo: tipo
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local se necessário
      setMensagens(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  };

  // Função para salvar tag
  const salvarTag = async (tagData: { nome: string; cor: string }) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          nome: tagData.nome,
          cor: tagData.cor,
          clinica_id: DEMO_CLINIC_ID
        })
        .select()
        .single();

      if (error) throw error;

      setTags(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      throw error;
    }
  };

  // Função para atualizar tag
  const atualizarTag = async (tagId: string, tagData: { nome: string; cor: string }) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          nome: tagData.nome,
          cor: tagData.cor
        })
        .eq('id', tagId);

      if (error) throw error;

      setTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, ...tagData } : tag
      ));
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      throw error;
    }
  };

  // Função para excluir tag
  const excluirTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      setTags(prev => prev.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      throw error;
    }
  };

  return {
    etapas,
    leads,
    tags,
    mensagens,
    respostasProntas,
    loading,
    moverLead,
    criarEtapa,
    editarEtapa,
    excluirEtapa,
    salvarLead,
    buscarConsultasLead,
    buscarMensagensLead,
    enviarMensagem,
    salvarTag,
    atualizarTag,
    excluirTag,
    refetch: fetchData
  };
};
