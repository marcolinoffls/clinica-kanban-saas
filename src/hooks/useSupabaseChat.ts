// src/hooks/useSupabaseChat.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';
import { toast } from 'sonner';

/**
 * Hook para gerenciar chat com integração Supabase
 * 
 * Funcionalidades principais:
 * - Busca mensagens de leads específicos
 * - Envia mensagens para leads (texto e mídia)
 * - Gerencia contadores de mensagens não lidas
 * - Busca respostas prontas da clínica
 * - Marca mensagens como lidas
 * 
 * Integração com Supabase:
 * - Usa RLS para filtrar dados por clínica
 * - Garante que apenas dados da clínica do usuário sejam acessados
 * - Valida clinica_id antes de operações críticas
 * - Suporta anexos de mídia (imagens e áudios) via anexo_url
 */
export const useSupabaseChat = () => {
  // Obter o clinicaId real do hook useClinicaData
  const { clinicaId, loading: clinicaDataLoading, error: clinicaDataError } = useClinicaData();

  const [mensagens, setMensagens] = useState<any[]>([]);
  const [respostasProntas, setRespostasProntas] = useState<any[]>([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState<Record<string, number>>({});

  // Log detalhado para diagnosticar problemas com clinica_id
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useSupabaseChat DEBUG] Estado atual dos dados da clínica:');
      console.log('- clinicaId:', clinicaId);
      console.log('- clinicaDataLoading:', clinicaDataLoading);
      console.log('- clinicaDataError:', clinicaDataError);
      console.log('- Tipo do clinicaId:', typeof clinicaId);
      console.log('- clinicaId é válido?', !!clinicaId && clinicaId !== 'undefined' && clinicaId !== 'null');
    }
  }, [clinicaId, clinicaDataLoading, clinicaDataError]);

  // Função para validar clinica_id antes de operações
  const validarClinicaId = (operacao: string): boolean => {
    if (!clinicaId || clinicaDataLoading || clinicaDataError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[useSupabaseChat] ${operacao}: clinicaId não disponível ou dados da clínica carregando/com erro.`);
        console.log(`- clinicaId: ${clinicaId}`);
        console.log(`- clinicaDataLoading: ${clinicaDataLoading}`);
        console.log(`- clinicaDataError:`, clinicaDataError);
      }
      return false;
    }
    return true;
  };

  // Função para buscar contador de mensagens não lidas por lead
  const buscarMensagensNaoLidas = async () => {
    if (!validarClinicaId('buscarMensagensNaoLidas')) return;
    
    try {
      console.log('[useSupabaseChat] Buscando mensagens não lidas para clinica_id:', clinicaId);
      
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('lead_id')
        .eq('clinica_id', clinicaId)
        .eq('lida', false)
        .eq('enviado_por', 'lead');

      if (error) {
        console.error('Erro ao buscar mensagens não lidas:', error);
        throw error;
      }

      // Contar mensagens não lidas por lead
      const contadores: Record<string, number> = {};
      data?.forEach((msg) => {
        contadores[msg.lead_id] = (contadores[msg.lead_id] || 0) + 1;
      });

      setMensagensNaoLidas(contadores);
      console.log('Contadores de mensagens não lidas atualizados:', contadores);
    } catch (error) {
      console.error('Erro ao buscar mensagens não lidas:', error);
    }
  };

  // Função para marcar mensagens como lidas
  const marcarMensagensComoLidas = async (leadId: string) => {
    if (!validarClinicaId('marcarMensagensComoLidas')) return;
    
    try {
      console.log(`[useSupabaseChat] Marcando mensagens como lidas para lead ${leadId} na clínica ${clinicaId}`);
      
      const { error } = await supabase
        .from('chat_mensagens')
        .update({ lida: true })
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaId)
        .eq('enviado_por', 'lead')
        .eq('lida', false);

      if (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
        throw error;
      }

      // Atualizar contador local
      setMensagensNaoLidas(prev => {
        const updated = { ...prev };
        delete updated[leadId];
        return updated;
      });

      console.log(`Mensagens marcadas como lidas para lead ${leadId}`);
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Função para buscar mensagens de um lead específico
  const buscarMensagensLead = async (leadId: string) => {
    if (!validarClinicaId('buscarMensagensLead')) return [];
    
    try {
      console.log(`[useSupabaseChat] Buscando mensagens do lead ${leadId} na clínica ${clinicaId}`);
      
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
      }

      console.log(`Encontradas ${data?.length || 0} mensagens para o lead ${leadId}`);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  };

  // Função para enviar mensagem com suporte a anexos de mídia (ATUALIZADA)
  const enviarMensagem = async (
    leadId: string, 
    conteudo: string, 
    tipo: string = 'texto', // ATUALIZAÇÃO: Valor padrão alterado para 'texto' para consistência.
    anexoUrl?: string | null // Novo parâmetro para URL do anexo (MinIO)
  ) => {
    // Validações rigorosas antes do envio
    if (!validarClinicaId('enviarMensagem')) {
      const errorMsg = 'Não é possível enviar mensagem: ID da clínica não está disponível ou dados da clínica estão carregando/com erro.';
      console.error(`[useSupabaseChat] enviarMensagem: ${errorMsg}`);
      console.error('Debug - clinicaId:', clinicaId, 'type:', typeof clinicaId);
      console.error('Debug - clinicaDataLoading:', clinicaDataLoading);
      console.error('Debug - clinicaDataError:', clinicaDataError);
      
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Log detalhado dos dados que serão enviados
    console.log('[useSupabaseChat] Preparando para enviar mensagem:');
    console.log('- leadId:', leadId, 'type:', typeof leadId);
    console.log('- clinicaId:', clinicaId, 'type:', typeof clinicaId);
    console.log('- conteudo:', conteudo.substring(0, 50) + '...');
    console.log('- tipo:', tipo);
    console.log('- anexoUrl:', anexoUrl);

    try {
      // CORREÇÃO: Garante que o tipo da mensagem seja compatível com o banco de dados.
      // O banco de dados espera 'texto', mas algumas partes do código podem enviar 'text'.
      // Esta linha converte 'text' para 'texto', garantindo que a inserção funcione.
      const tipoCorrigido = tipo === 'text' ? 'texto' : tipo;

      // Preparar dados da mensagem com novos campos
      const mensagemData: any = {
        lead_id: leadId,
        clinica_id: clinicaId,
        conteudo: conteudo.trim(),
        enviado_por: 'usuario',
        tipo: tipoCorrigido, // CORREÇÃO: Usando o tipo corrigido.
        lida: false // Mensagens enviadas pelo usuário podem começar como não lidas
      };

      // Adicionar anexo_url apenas se fornecido (para mídias)
      if (anexoUrl) {
        mensagemData.anexo_url = anexoUrl;
      }

      const { data, error } = await supabase
        .from('chat_mensagens')
        .insert(mensagemData)
        .select()
        .single();

      if (error) {
        console.error('Erro no Supabase ao inserir mensagem:', error);
        throw error;
      }

      console.log('✅ Mensagem salva com sucesso no Supabase:', data);
      console.log('- ID da mensagem:', data.id);
      console.log('- clinica_id salvo:', data.clinica_id);
      console.log('- lead_id salvo:', data.lead_id);
      console.log('- tipo salvo:', data.tipo);
      console.log('- anexo_url salvo:', data.anexo_url);

      return data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem.');
      throw error;
    }
  };

  // Função para buscar respostas prontas
  const buscarRespostasProntas = async () => {
    if (!validarClinicaId('buscarRespostasProntas')) return [];
    
    try {
      console.log('[useSupabaseChat] Buscando respostas prontas para clinica_id:', clinicaId);
      
      const { data: respostasData, error: respostasError } = await supabase
        .from('respostas_prontas')
        .select('*')
        .eq('clinica_id', clinicaId)
        .eq('ativo', true);

      if (respostasError) {
        console.error('Erro ao buscar respostas prontas:', respostasError);
        throw respostasError;
      }

      console.log(`Encontradas ${respostasData?.length || 0} respostas prontas`);
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
      console.log('🚀 [useSupabaseChat] clinicaId disponível, iniciando busca de dados do chat');
      console.log('- Clinica ID confirmado:', clinicaId);
      
      buscarMensagensNaoLidas();
      buscarRespostasProntas();
    } else {
      if (process.env.NODE_ENV === 'development') {
        if (clinicaDataLoading) {
          console.log('⏳ [useSupabaseChat] Aguardando carregamento dos dados da clínica...');
        } else if (clinicaDataError) {
          console.error('❌ [useSupabaseChat] Erro ao carregar dados da clínica:', clinicaDataError);
        } else if (!clinicaId) {
          console.warn('⚠️ [useSupabaseChat] clinicaId não está disponível');
        }
      }
    }
  }, [clinicaId, clinicaDataLoading, clinicaDataError]);

  return {
    mensagens,
    respostasProntas,
    mensagensNaoLidas,
    setMensagensNaoLidas,
    buscarMensagensNaoLidas,
    marcarMensagensComoLidas,
    buscarMensagensLead,
    enviarMensagem, // Função atualizada com suporte a tipo e anexoUrl
    buscarRespostasProntas,
    // Indicador de que os dados do chat estão prontos para uso
    isChatDataReady: !!clinicaId && !clinicaDataLoading && !clinicaDataError
  };
};
