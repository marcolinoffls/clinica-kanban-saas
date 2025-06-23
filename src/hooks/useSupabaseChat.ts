import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';
import { useAuthUser } from './useAuthUser';
import { toast } from 'sonner';

/**
 * Hook para gerenciar chat com integração Supabase
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Removidos loops infinitos nos useEffects
 * - Dependências otimizadas para evitar re-renders desnecessários
 * - Logs reduzidos apenas para operações essenciais
 * 
 * Funcionalidades principais:
 * - Busca mensagens de leads específicos
 * - Envia mensagens para leads (texto e mídia)
 * - Gerencia contadores de mensagens não lidas
 * - Busca respostas prontas da clínica
 * - Marca mensagens como lidas
 */
export const useSupabaseChat = () => {
  const { user, userProfile, loading: authLoading, isAuthenticated } = useAuthUser();
  const { clinicaId, loading: clinicaDataLoading, error: clinicaDataError } = useClinicaData();

  const [mensagens, setMensagens] = useState<any[]>([]);
  const [respostasProntas, setRespostasProntas] = useState<any[]>([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState<Record<string, number>>({});

  // Indicador de quando os dados estão prontos - CORRIGIDO
  const isChatDataReady = !authLoading && 
                          isAuthenticated && 
                          !!userProfile && 
                          !clinicaDataLoading && 
                          !clinicaDataError && 
                          !!clinicaId;

  // Função para validar clinica_id - SIMPLIFICADA
  const validarClinicaId = useCallback((operacao: string): boolean => {
    if (!isChatDataReady) {
      return false;
    }

    if (!clinicaId) {
      console.error(`[useSupabaseChat] ${operacao}: clinica_id não encontrado`);
      return false;
    }

    return true;
  }, [isChatDataReady, clinicaId]);

  // Função para obter clinica_id seguro - OTIMIZADA
  const obterClinicaIdSeguro = useCallback(async (leadId?: string): Promise<string | null> => {
    try {
      // Primeira tentativa: usar clinica_id do contexto
      if (clinicaId && validarClinicaId('fallback-check')) {
        return clinicaId;
      }

      // Segunda tentativa: usar clinica_id do perfil do usuário
      if (userProfile?.clinica_id) {
        return userProfile.clinica_id;
      }

      // Terceira tentativa: buscar do lead se fornecido
      if (leadId) {
        const { data: leadData, error } = await supabase
          .from('leads')
          .select('clinica_id')
          .eq('id', leadId)
          .single();

        if (error) {
          console.error('[useSupabaseChat] Erro ao buscar clinica_id do lead:', error);
          return null;
        }

        return leadData?.clinica_id || null;
      }

      return null;
    } catch (error) {
      console.error('[useSupabaseChat] Erro ao obter clinica_id seguro:', error);
      return null;
    }
  }, [clinicaId, validarClinicaId, userProfile?.clinica_id]);

  // Função para buscar mensagens não lidas - OTIMIZADA
  const buscarMensagensNaoLidas = useCallback(async () => {
    if (!validarClinicaId('buscarMensagensNaoLidas')) return;
    
    try {
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
    } catch (error) {
      console.error('Erro ao buscar mensagens não lidas:', error);
    }
  }, [validarClinicaId, clinicaId]);

  // Função para marcar mensagens como lidas - OTIMIZADA
  const marcarMensagensComoLidas = useCallback(async (leadId: string) => {
    const clinicaIdSeguro = await obterClinicaIdSeguro(leadId);
    if (!clinicaIdSeguro) {
      console.error('[useSupabaseChat] Não foi possível obter clinica_id para marcar mensagens como lidas');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('chat_mensagens')
        .update({ lida: true })
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaIdSeguro)
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
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  }, [obterClinicaIdSeguro]);

  // Função para buscar mensagens de um lead específico - OTIMIZADA
  const buscarMensagensLead = useCallback(async (leadId: string) => {
    const clinicaIdSeguro = await obterClinicaIdSeguro(leadId);
    if (!clinicaIdSeguro) {
      console.error('[useSupabaseChat] Não foi possível obter clinica_id para buscar mensagens');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaIdSeguro)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }, [obterClinicaIdSeguro]);

  // Função para enviar mensagem - OTIMIZADA
  const enviarMensagem = useCallback(async (
    leadId: string, 
    conteudo: string, 
    tipo: string = 'texto',
    anexoUrl?: string | null
  ) => {
    const clinicaIdSeguro = await obterClinicaIdSeguro(leadId);
    if (!clinicaIdSeguro) {
      const errorMsg = 'Não é possível enviar mensagem: não foi possível determinar a clínica do lead.';
      console.error(`[useSupabaseChat] enviarMensagem: ${errorMsg}`);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const tipoCorrigido = tipo === 'text' ? 'texto' : tipo;

      // Preparar dados da mensagem
      const mensagemData: any = {
        lead_id: leadId,
        clinica_id: clinicaIdSeguro,
        conteudo: conteudo.trim(),
        enviado_por: 'usuario',
        tipo: tipoCorrigido,
        lida: false
      };

      // Adicionar anexo_url apenas se fornecido
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

      return data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem.');
      throw error;
    }
  }, [obterClinicaIdSeguro]);

  // Função para buscar respostas prontas - OTIMIZADA
  const buscarRespostasProntas = useCallback(async () => {
    if (!validarClinicaId('buscarRespostasProntas')) return;
    
    try {
      const { data, error } = await supabase
        .from('respostas_prontas')
        .select('*')
        .eq('clinica_id', clinicaId)
        .eq('ativo', true)
        .order('titulo');

      if (error) {
        console.error('Erro ao buscar respostas prontas:', error);
        throw error;
      }

      setRespostasProntas(data || []);
    } catch (error) {
      console.error('Erro ao buscar respostas prontas:', error);
    }
  }, [validarClinicaId, clinicaId]);

  // CORREÇÃO PRINCIPAL: useEffect único para inicialização - SEM LOOPS
  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      if (!isChatDataReady) return;
      
      try {
        // Executar inicialização apenas uma vez quando dados estão prontos
        await Promise.all([
          buscarMensagensNaoLidas(),
          buscarRespostasProntas()
        ]);
      } catch (error) {
        console.error('Erro na inicialização do chat:', error);
      }
    };

    if (isMounted) {
      initializeChat();
    }

    return () => {
      isMounted = false;
    };
  }, [isChatDataReady]); // DEPENDÊNCIA ÚNICA E ESTÁVEL

  return {
    mensagens,
    respostasProntas,
    mensagensNaoLidas,
    setMensagensNaoLidas,
    buscarMensagensNaoLidas,
    marcarMensagensComoLidas,
    buscarMensagensLead,
    enviarMensagem,
    buscarRespostasProntas,
    isChatDataReady,
    // Informações adicionais para debug (reduzidas)
    authLoading,
    isAuthenticated,
    userProfile,
    clinicaDataLoading,
    clinicaDataError,
    clinicaId
  };
};