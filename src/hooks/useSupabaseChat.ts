
// src/hooks/useSupabaseChat.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';
import { useAuthUser } from './useAuthUser';
import { toast } from 'sonner';

/**
 * Hook para gerenciar chat com integração Supabase
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Cadeia de dependências mais robusta: Auth -> UserProfile -> ClinicaData -> Chat
 * - Validação explícita de clinica_id antes de qualquer operação
 * - Logs detalhados para debug da cadeia de dependências
 * - Fallback para buscar clinica_id do lead quando necessário
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
  // CORREÇÃO: Cadeia de dependências mais robusta
  const { user, userProfile, loading: authLoading, isAuthenticated } = useAuthUser();
  const { clinicaId, loading: clinicaDataLoading, error: clinicaDataError } = useClinicaData();

  const [mensagens, setMensagens] = useState<any[]>([]);
  const [respostasProntas, setRespostasProntas] = useState<any[]>([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState<Record<string, number>>({});

  // CORREÇÃO: Log detalhado da cadeia de dependências
  useEffect(() => {
    console.log('[useSupabaseChat] Estado da cadeia de dependências:');
    console.log('1. Auth loading:', authLoading);
    console.log('2. User authenticated:', isAuthenticated);
    console.log('3. User profile:', userProfile ? {
      id: userProfile.id,
      profile_type: userProfile.profile_type,
      clinica_id: userProfile.clinica_id
    } : null);
    console.log('4. Clinica data loading:', clinicaDataLoading);
    console.log('5. Clinica ID:', clinicaId);
    console.log('6. Clinica data error:', clinicaDataError?.message);
    console.log('7. Chat data ready:', isChatDataReady);
  }, [authLoading, isAuthenticated, userProfile, clinicaDataLoading, clinicaId, clinicaDataError]);

  // CORREÇÃO: Função mais robusta para validar clinica_id
  const validarClinicaId = (operacao: string): boolean => {
    // Verificar se a cadeia de dependências está completa
    if (authLoading) {
      console.log(`[useSupabaseChat] ${operacao}: Aguardando autenticação...`);
      return false;
    }

    if (!isAuthenticated || !user) {
      console.warn(`[useSupabaseChat] ${operacao}: Usuário não autenticado`);
      return false;
    }

    if (!userProfile) {
      console.warn(`[useSupabaseChat] ${operacao}: Perfil do usuário não encontrado`);
      return false;
    }

    if (clinicaDataLoading) {
      console.log(`[useSupabaseChat] ${operacao}: Carregando dados da clínica...`);
      return false;
    }

    if (clinicaDataError) {
      console.error(`[useSupabaseChat] ${operacao}: Erro nos dados da clínica:`, clinicaDataError);
      return false;
    }

    if (!clinicaId) {
      console.error(`[useSupabaseChat] ${operacao}: clinica_id não disponível`);
      console.error('- userProfile.clinica_id:', userProfile.clinica_id);
      console.error('- clinicaId do hook:', clinicaId);
      return false;
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinicaId)) {
      console.error(`[useSupabaseChat] ${operacao}: clinica_id com formato inválido:`, clinicaId);
      return false;
    }

    return true;
  };

  // CORREÇÃO: Função mais robusta para buscar clinica_id como fallback
  const obterClinicaIdSeguro = async (leadId?: string): Promise<string | null> => {
    try {
      // Primeira tentativa: usar clinica_id do contexto
      if (clinicaId && validarClinicaId('fallback-check')) {
        return clinicaId;
      }

      // Segunda tentativa: buscar do perfil do usuário diretamente
      if (userProfile?.clinica_id) {
        console.log('[useSupabaseChat] Usando clinica_id do perfil do usuário como fallback');
        return userProfile.clinica_id;
      }

      // Terceira tentativa: se fornecido leadId, buscar clinica_id do lead
      if (leadId) {
        console.log('[useSupabaseChat] Buscando clinica_id do lead como fallback');
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
    const clinicaIdSeguro = await obterClinicaIdSeguro(leadId);
    if (!clinicaIdSeguro) {
      console.error('[useSupabaseChat] Não foi possível obter clinica_id para marcar mensagens como lidas');
      return;
    }
    
    try {
      console.log(`[useSupabaseChat] Marcando mensagens como lidas para lead ${leadId} na clínica ${clinicaIdSeguro}`);
      
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

      console.log(`Mensagens marcadas como lidas para lead ${leadId}`);
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Função para buscar mensagens de um lead específico
  const buscarMensagensLead = async (leadId: string) => {
    const clinicaIdSeguro = await obterClinicaIdSeguro(leadId);
    if (!clinicaIdSeguro) {
      console.error('[useSupabaseChat] Não foi possível obter clinica_id para buscar mensagens');
      return [];
    }
    
    try {
      console.log(`[useSupabaseChat] Buscando mensagens do lead ${leadId} na clínica ${clinicaIdSeguro}`);
      
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

      console.log(`Encontradas ${data?.length || 0} mensagens para o lead ${leadId}`);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  };

  // Função para enviar mensagem com suporte a anexos de mídia - ADMIN COMPATIBLE
  const enviarMensagem = async (
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

    // Log detalhado dos dados que serão enviados
    console.log('[useSupabaseChat] Preparando para enviar mensagem:');
    console.log('- leadId:', leadId, 'type:', typeof leadId);
    console.log('- clinicaIdSeguro:', clinicaIdSeguro, 'type:', typeof clinicaIdSeguro);
    console.log('- conteudo:', conteudo.substring(0, 50) + '...');
    console.log('- tipo:', tipo);
    console.log('- anexoUrl:', anexoUrl);

    try {
      const tipoCorrigido = tipo === 'text' ? 'texto' : tipo;

      // Preparar dados da mensagem com novos campos
      const mensagemData: any = {
        lead_id: leadId,
        clinica_id: clinicaIdSeguro,
        conteudo: conteudo.trim(),
        enviado_por: 'usuario',
        tipo: tipoCorrigido,
        lida: false
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
  
  // CORREÇÃO: Indicador mais robusto de quando os dados estão prontos
  const isChatDataReady = !authLoading && 
                          isAuthenticated && 
                          !!userProfile && 
                          !clinicaDataLoading && 
                          !clinicaDataError && 
                          !!clinicaId;

  // Efeito para buscar dados iniciais quando a cadeia de dependências estiver completa
  useEffect(() => {
    if (isChatDataReady) {
      console.log('🚀 [useSupabaseChat] Cadeia de dependências completa, iniciando busca de dados do chat');
      console.log('- Clinica ID confirmado:', clinicaId);
      
      buscarMensagensNaoLidas();
      buscarRespostasProntas();
    } else {
      console.log('⏳ [useSupabaseChat] Aguardando cadeia de dependências:', {
        authLoading,
        isAuthenticated,
        hasUserProfile: !!userProfile,
        clinicaDataLoading,
        hasClinicaDataError: !!clinicaDataError,
        hasClinicaId: !!clinicaId
      });
    }
  }, [isChatDataReady, clinicaId]);

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
    // CORREÇÃO: Indicador mais confiável de quando os dados estão prontos
    isChatDataReady,
    // Informações adicionais para debug
    authLoading,
    isAuthenticated,
    userProfile,
    clinicaDataLoading,
    clinicaDataError,
    clinicaId
  };
};
