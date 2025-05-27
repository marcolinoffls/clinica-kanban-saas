
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar mensagens e chat no Supabase
 * 
 * Funcionalidades:
 * - Buscar e enviar mensagens
 * - Marcar mensagens como lidas
 * - Contador de mensagens não lidas
 * - Buscar respostas prontas
 */

// ID da clínica de demonstração (em produção viria do contexto do usuário)
const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

export const useSupabaseChat = () => {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [respostasProntas, setRespostasProntas] = useState<any[]>([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState<Record<string, number>>({});

  // Função para buscar contador de mensagens não lidas por lead
  const buscarMensagensNaoLidas = async () => {
    try {
      console.log('📊 Buscando contadores de mensagens não lidas');
      
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('lead_id')
        .eq('clinica_id', DEMO_CLINIC_ID)
        .eq('lida', false)
        .eq('enviado_por', 'lead');

      if (error) throw error;

      // Contar mensagens não lidas por lead_id
      const contadores: Record<string, number> = {};
      data?.forEach(msg => {
        contadores[msg.lead_id] = (contadores[msg.lead_id] || 0) + 1;
      });

      console.log('📊 Contadores de mensagens não lidas:', contadores);
      setMensagensNaoLidas(contadores);
    } catch (error) {
      console.error('Erro ao buscar mensagens não lidas:', error);
    }
  };

  // Função para marcar mensagens como lidas
  const marcarMensagensComoLidas = async (leadId: string) => {
    try {
      console.log('📖 Marcando mensagens como lidas para lead:', leadId);
      
      const { error } = await supabase
        .from('chat_mensagens')
        .update({ lida: true })
        .eq('lead_id', leadId)
        .eq('clinica_id', DEMO_CLINIC_ID)
        .eq('enviado_por', 'lead')
        .eq('lida', false);

      if (error) throw error;

      // Atualizar o contador local
      setMensagensNaoLidas(contadores => {
        const novosContadores = { ...contadores };
        delete novosContadores[leadId];
        return novosContadores;
      });

      console.log('✅ Mensagens marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
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

      setMensagens(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  };

  // Função para buscar respostas prontas
  const buscarRespostasProntas = async () => {
    try {
      const { data: respostasData, error: respostasError } = await supabase
        .from('respostas_prontas')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID)
        .eq('ativo', true);

      if (respostasError) throw respostasError;
      setRespostasProntas(respostasData || []);
      return respostasData || [];
    } catch (error) {
      console.error('Erro ao buscar respostas prontas:', error);
      return [];
    }
  };

  return {
    mensagens,
    respostasProntas,
    mensagensNaoLidas,
    setMensagensNaoLidas,
    buscarMensagensNaoLidas,
    marcarMensagensComoLidas,
    buscarMensagensLead,
    enviarMensagem,
    buscarRespostasProntas
  };
};
