// src/hooks/useSupabaseChat.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData'; // IMPORTAR O HOOK useClinicaData

// REMOVER O DEMO_CLINIC_ID FIXO
// const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001'; 

export const useSupabaseChat = () => {
  // Obter o clinicaId real do hook useClinicaData
  const { clinicaId, loading: clinicaDataLoading, error: clinicaDataError } = useClinicaData();

  const [mensagens, setMensagens] = useState<any[]>([]);
  const [respostasProntas, setRespostasProntas] = useState<any[]>([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState<Record<string, number>>({});

  // Função para buscar contador de mensagens não lidas por lead
  const buscarMensagensNaoLidas = async () => {
    // Só executa se clinicaId estiver disponível e não houver erro/loading
    if (!clinicaId || clinicaDataLoading || clinicaDataError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useSupabaseChat] buscarMensagensNaoLidas: clinicaId não disponível ou dados da clínica carregando/com erro.');
      }
      return;
    }
    try {
      // ... (lógica como antes)
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('lead_id')
        .eq('clinica_id', clinicaId) // <--- USA O clinicaId REAL
        .eq('lida', false)
        .eq('enviado_por', 'lead');
      // ... (resto da função)
    } catch (error) {
      console.error('Erro ao buscar mensagens não lidas:', error);
    }
  };

  // Função para marcar mensagens como lidas
  const marcarMensagensComoLidas = async (leadId: string) => {
    if (!clinicaId || clinicaDataLoading || clinicaDataError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useSupabaseChat] marcarMensagensComoLidas: clinicaId não disponível.');
      }
      return;
    }
    try {
      // ... (lógica como antes)
      const { error } = await supabase
        .from('chat_mensagens')
        .update({ lida: true })
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaId) // <--- USA O clinicaId REAL
        .eq('enviado_por', 'lead')
        .eq('lida', false);
      // ... (resto da função)
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Função para buscar mensagens de um lead específico
  const buscarMensagensLead = async (leadId: string) => {
    // Esta função pode precisar do clinica_id também para RLS,
    // embora a RLS deva cuidar disso se a query não especificar.
    // Para consistência e se a RLS não for suficiente, adicione .eq('clinica_id', clinicaId)
    if (!clinicaId || clinicaDataLoading || clinicaDataError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useSupabaseChat] buscarMensagensLead: clinicaId não disponível.');
        }
        return [];
      }
    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaId) // <--- ADICIONAR PARA CONSISTÊNCIA E SEGURANÇA
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
    // Verifica se clinicaId está disponível antes de tentar enviar
    if (!clinicaId || clinicaDataLoading || clinicaDataError) {
      const errorMsg = 'Não é possível enviar mensagem: ID da clínica não está disponível ou dados da clínica estão carregando/com erro.';
      if (process.env.NODE_ENV === 'development') {
        console.error(`[useSupabaseChat] enviarMensagem: ${errorMsg}`);
      }
      toast.error(errorMsg); // Informa o usuário
      throw new Error(errorMsg);
    }

    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .insert({
          lead_id: leadId,
          clinica_id: clinicaId, // <--- USA O clinicaId REAL
          conteudo: conteudo.trim(),
          enviado_por: 'usuario', // Correto: mensagem enviada pelo usuário do SaaS
          tipo: tipo
        })
        .select()
        .single();

      if (error) throw error;

      // setMensagens(prev => [...prev, data]); // Considerar se este estado local 'mensagens' é realmente necessário
                                               // ou se as mensagens devem ser sempre buscadas ou atualizadas via subscription.
      return data; // Retorna a mensagem salva (que agora tem o clinica_id correto)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem.');
      throw error;
    }
  };

  // Função para buscar respostas prontas
  const buscarRespostasProntas = async () => {
    if (!clinicaId || clinicaDataLoading || clinicaDataError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useSupabaseChat] buscarRespostasProntas: clinicaId não disponível.');
        }
        return [];
      }
    try {
      const { data: respostasData, error: respostasError } = await supabase
        .from('respostas_prontas')
        .select('*')
        .eq('clinica_id', clinicaId) // <--- USA O clinicaId REAL
        .eq('ativo', true);

      if (respostasError) throw respostasError;
      setRespostasProntas(respostasData || []);
      return respostasData || [];
    } catch (error) {
      console.error('Erro ao buscar respostas prontas:', error);
      return [];
    }
  };
  
  // Efeito para buscar dados iniciais quando clinicaId estiver disponível
  useEffect(() => {
    if (clinicaId && !clinicaDataLoading && !clinicaDataError) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useSupabaseChat] clinicaId disponível, buscando dados iniciais do chat (mensagens não lidas, respostas prontas). Clinica ID:', clinicaId);
      }
      buscarMensagensNaoLidas();
      buscarRespostasProntas();
    } else if (process.env.NODE_ENV === 'development' && (clinicaDataLoading || authLoading)) {
        console.log('[useSupabaseChat] Aguardando clinicaId ou fim do loading de autenticação/clínica para buscar dados iniciais do chat.');
    } else if (process.env.NODE_ENV === 'development' && clinicaDataError) {
        console.error('[useSupabaseChat] Erro ao carregar dados da clínica, não será possível buscar dados iniciais do chat.', clinicaDataError);
    }
  }, [clinicaId, clinicaDataLoading, clinicaDataError]); // Dependências corretas

  return {
    mensagens,
    respostasProntas,
    mensagensNaoLidas,
    setMensagensNaoLidas, // Se você realmente precisar setar de fora
    buscarMensagensNaoLidas, // Expor se precisar chamar manualmente
    marcarMensagensComoLidas,
    buscarMensagensLead,
    enviarMensagem,
    buscarRespostasProntas, // Expor se precisar chamar manualmente
    // Adicionar um indicador de que os dados do chat estão prontos/carregando
    isChatDataReady: !!clinicaId && !clinicaDataLoading && !clinicaDataError
  };
};