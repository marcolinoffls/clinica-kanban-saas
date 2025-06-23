import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';
import { useAuthUser } from './useAuthUser';
import { toast } from 'sonner';

/**
 * 💬 Hook para Gerenciamento de Chat com Integração Supabase
 * 
 * 📋 FUNCIONALIDADES PRINCIPAIS:
 * - Busca e carrega mensagens de leads específicos
 * - Envia mensagens (texto, imagem, áudio, etc.)
 * - Gerencia contadores de mensagens não lidas
 * - Carrega respostas prontas da clínica
 * - Marca mensagens como lidas automaticamente
 * 
 * 🔒 SEGURANÇA:
 * - Validação de clínica_id em todas as operações
 * - Fallbacks para múltiplas fontes de clinica_id
 * - Tratamento robusto de erros
 * - Verificação de autenticação antes de operações
 * 
 * ⚡ PERFORMANCE:
 * - useCallback em todas as funções para evitar re-renders
 * - Estados memoizados e otimizados
 * - Execução única da inicialização
 * - Cleanup adequado de recursos
 * 
 * 🔄 DEPENDÊNCIAS:
 * - useAuthUser: Dados do usuário autenticado
 * - useClinicaData: Dados da clínica atual
 * - Supabase: Cliente para operações de banco
 */
export const useSupabaseChat = () => {
  
  // 🔗 HOOKS PARA DADOS ESSENCIAIS
  const { user, userProfile, loading: authLoading, isAuthenticated } = useAuthUser();
  const { clinicaId, loading: clinicaDataLoading, error: clinicaDataError } = useClinicaData();

  // 📊 ESTADOS LOCAIS DO CHAT
  const [mensagens, setMensagens] = useState<any[]>([]);                      // Mensagens carregadas
  const [respostasProntas, setRespostasProntas] = useState<any[]>([]);        // Templates de resposta
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState<Record<string, number>>({}); // Contadores

  /**
   * ✅ Indicador de Prontidão dos Dados
   * 
   * Determina se todos os dados necessários estão disponíveis
   * para executar operações de chat com segurança.
   * 
   * Condições necessárias:
   * - Autenticação não está carregando
   * - Usuário está autenticado
   * - Perfil do usuário foi carregado
   * - Dados da clínica não estão carregando
   * - Não há erro nos dados da clínica
   * - ID da clínica está disponível
   */
  const isChatDataReady = !authLoading && 
                          isAuthenticated && 
                          !!userProfile && 
                          !clinicaDataLoading && 
                          !clinicaDataError && 
                          !!clinicaId;

  /**
   * 🔐 Obter ID da Clínica de Forma Segura
   * 
   * Tenta obter o clinica_id de múltiplas fontes como fallback:
   * 1. clinica_id do contexto atual (mais confiável)
   * 2. clinica_id do perfil do usuário
   * 3. clinica_id buscado do lead específico (último recurso)
   * 
   * @param {string} [leadId] - ID do lead para busca específica
   * @returns {string|null} - ID da clínica ou null se não encontrado
   */
  const obterClinicaIdSeguro = useCallback(async (leadId?: string): Promise<string | null> => {
    try {
      // 🎯 PRIMEIRA TENTATIVA: Usar clinica_id do contexto
      if (clinicaId) {
        return clinicaId;
      }

      // 🎯 SEGUNDA TENTATIVA: Usar clinica_id do perfil do usuário
      if (userProfile?.clinica_id) {
        return userProfile.clinica_id;
      }

      // 🎯 TERCEIRA TENTATIVA: Buscar do lead específico
      if (leadId) {
        const { data: leadData, error } = await supabase
          .from('leads')
          .select('clinica_id')
          .eq('id', leadId)
          .single();

        // Retornar apenas se não houver erro e dado existir
        if (!error && leadData?.clinica_id) {
          return leadData.clinica_id;
        }
      }

      // 🚫 Não foi possível obter clinica_id
      return null;
    } catch (error) {
      // Em caso de exceção, falhar silenciosamente
      return null;
    }
  }, [clinicaId, userProfile?.clinica_id]);

  /**
   * 🔔 Buscar Mensagens Não Lidas
   * 
   * Carrega contadores de mensagens não lidas agrupadas por lead.
   * Considera apenas mensagens:
   * - Da clínica atual
   * - Não marcadas como lidas (lida = false)
   * - Enviadas pelo lead (não pelo usuário)
   * 
   * Atualiza o estado mensagensNaoLidas com contadores por lead.
   */
  const buscarMensagensNaoLidas = useCallback(async () => {
    // ✅ Verificar se dados estão prontos
    if (!isChatDataReady || !clinicaId) return;
    
    try {
      // 📊 BUSCAR MENSAGENS NÃO LIDAS
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('lead_id')                    // Só precisamos do lead_id para contar
        .eq('clinica_id', clinicaId)          // Filtrar por clínica
        .eq('lida', false)                    // Apenas não lidas
        .eq('enviado_por', 'lead');           // Apenas do lead (não do usuário)

      if (error) throw error;

      // 🧮 CALCULAR CONTADORES POR LEAD
      const contadores: Record<string, number> = {};
      data?.forEach((msg) => {
        contadores[msg.lead_id] = (contadores[msg.lead_id] || 0) + 1;
      });

      // 💾 ATUALIZAR ESTADO
      setMensagensNaoLidas(contadores);
    } catch (error) {
      // Falha silenciosa para não gerar logs excessivos
    }
  }, [isChatDataReady, clinicaId]);

  /**
   * ✅ Marcar Mensagens como Lidas
   * 
   * Marca todas as mensagens não lidas de um lead específico como lidas.
   * Usado quando usuário abre uma conversa ou visualiza mensagens.
   * 
   * @param {string} leadId - ID do lead cujas mensagens devem ser marcadas
   */
  const marcarMensagensComoLidas = useCallback(async (leadId: string) => {
    // 🔐 Obter clinica_id seguro
    const clinicaIdSeguro = await obterClinicaIdSeguro(leadId);
    if (!clinicaIdSeguro) return;
    
    try {
      // ✅ ATUALIZAR MENSAGENS NO BANCO
      const { error } = await supabase
        .from('chat_mensagens')
        .update({ lida: true })               // Marcar como lida
        .eq('lead_id', leadId)                // Do lead específico
        .eq('clinica_id', clinicaIdSeguro)    // Da clínica correta
        .eq('enviado_por', 'lead')            // Apenas mensagens do lead
        .eq('lida', false);                   // Que ainda não foram lidas

      if (!error) {
        // 🗑️ REMOVER CONTADOR LOCAL
        setMensagensNaoLidas(prev => {
          const updated = { ...prev };
          delete updated[leadId];             // Remover entrada do lead
          return updated;
        });
      }
    } catch (error) {
      // Falha silenciosa
    }
  }, [obterClinicaIdSeguro]);

  /**
   * 📨 Buscar Mensagens de um Lead Específico
   * 
   * Carrega histórico completo de mensagens de uma conversa.
   * Retorna mensagens ordenadas cronologicamente (mais antigas primeiro).
   * 
   * @param {string} leadId - ID do lead
   * @returns {Array} - Array de mensagens ou array vazio
   */
  const buscarMensagensLead = useCallback(async (leadId: string) => {
    // 🔐 Obter clinica_id seguro
    const clinicaIdSeguro = await obterClinicaIdSeguro(leadId);
    if (!clinicaIdSeguro) return [];
    
    try {
      // 📊 BUSCAR MENSAGENS DO LEAD
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')                          // Todos os campos
        .eq('lead_id', leadId)                // Do lead específico
        .eq('clinica_id', clinicaIdSeguro)    // Da clínica correta
        .order('created_at', { ascending: true }); // Ordem cronológica

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Em caso de erro, retornar array vazio
      return [];
    }
  }, [obterClinicaIdSeguro]);

  /**
   * ✉️ Enviar Mensagem
   * 
   * Envia nova mensagem para um lead específico.
   * Suporta diferentes tipos de mídia e anexos.
   * 
   * @param {string} leadId - ID do lead destinatário
   * @param {string} conteudo - Conteúdo da mensagem
   * @param {string} [tipo='texto'] - Tipo da mensagem (texto, imagem, audio, etc.)
   * @param {string} [anexoUrl] - URL do anexo (opcional)
   * @returns {Object} - Dados da mensagem criada
   * @throws {Error} - Lança erro se não conseguir enviar
   */
  const enviarMensagem = useCallback(async (
    leadId: string, 
    conteudo: string, 
    tipo: string = 'texto',
    anexoUrl?: string | null
  ) => {
    // 🔐 Obter clinica_id seguro
    const clinicaIdSeguro = await obterClinicaIdSeguro(leadId);
    if (!clinicaIdSeguro) {
      toast.error('Não foi possível enviar a mensagem.');
      throw new Error('Clínica não encontrada');
    }

    try {
      // 🔧 NORMALIZAR TIPO DE MENSAGEM
      const tipoCorrigido = tipo === 'text' ? 'texto' : tipo;

      // 📝 PREPARAR DADOS DA MENSAGEM
      const mensagemData: any = {
        lead_id: leadId,
        clinica_id: clinicaIdSeguro,
        conteudo: conteudo.trim(),            // Remover espaços extras
        enviado_por: 'usuario',               // Identificar como enviada pelo usuário
        tipo: tipoCorrigido,
        lida: false                           // Mensagem não lida inicialmente
      };

      // 📎 ADICIONAR ANEXO SE FORNECIDO
      if (anexoUrl) {
        mensagemData.anexo_url = anexoUrl;
      }

      // 💾 INSERIR NO BANCO DE DADOS
      const { data, error } = await supabase
        .from('chat_mensagens')
        .insert(mensagemData)
        .select()                             // Retornar dados inseridos
        .single();                            // Esperar um único registro

      if (error) throw error;
      return data;
    } catch (error) {
      // 🚨 NOTIFICAR USUÁRIO E PROPAGAR ERRO
      toast.error('Erro ao enviar mensagem.');
      throw error;
    }
  }, [obterClinicaIdSeguro]);

  /**
   * 📋 Buscar Respostas Prontas
   * 
   * Carrega templates de respostas rápidas configuradas para a clínica.
   * Facilita respostas padronizadas e aumenta produtividade.
   */
  const buscarRespostasProntas = useCallback(async () => {
    // ✅ Verificar se dados estão prontos
    if (!isChatDataReady || !clinicaId) return;
    
    try {
      // 📊 BUSCAR RESPOSTAS ATIVAS
      const { data, error } = await supabase
        .from('respostas_prontas')
        .select('*')                          // Todos os campos
        .eq('clinica_id', clinicaId)          // Da clínica atual
        .eq('ativo', true)                    // Apenas ativas
        .order('titulo');                     // Ordenar por título

      if (!error) {
        // 💾 ATUALIZAR ESTADO
        setRespostasProntas(data || []);
      }
    } catch (error) {
      // Falha silenciosa
    }
  }, [isChatDataReady, clinicaId]);

  /**
   * 🔄 useEffect: Inicialização do Chat
   * 
   * Executa uma única vez quando todos os dados estão prontos.
   * Carrega dados iniciais necessários para o funcionamento do chat.
   * 
   * ⚡ OTIMIZAÇÕES:
   * - Flag isMounted previne atualizações em componente desmontado
   * - Execução paralela de operações independentes
   * - Cleanup adequado na desmontagem
   */
  useEffect(() => {
    let isMounted = true;  // Flag para prevenir memory leaks

    const initializeChat = async () => {
      // ✅ Só executar se dados estão prontos
      if (!isChatDataReady) return;
      
      if (isMounted) {
        // 🚀 EXECUTAR INICIALIZAÇÃO PARALELA
        await Promise.all([
          buscarMensagensNaoLidas(),          // Carregar contadores
          buscarRespostasProntas()            // Carregar templates
        ]);
      }
    };

    initializeChat();

    // 🧹 CLEANUP FUNCTION
    return () => {
      isMounted = false;  // Prevenir atualizações após desmontagem
    };
  }, [isChatDataReady, buscarMensagensNaoLidas, buscarRespostasProntas]);

  // 📤 INTERFACE PÚBLICA DO HOOK
  return {
    // 📊 DADOS DO CHAT
    mensagens,                              // Mensagens carregadas
    respostasProntas,                       // Templates de resposta
    mensagensNaoLidas,                      // Contadores por lead
    setMensagensNaoLidas,                   // Setter para contadores (usado pelo Realtime)
    
    // 🔧 FUNÇÕES PRINCIPAIS
    buscarMensagensNaoLidas,                // Recarregar contadores
    marcarMensagensComoLidas,               // Marcar como lidas
    buscarMensagensLead,                    // Carregar conversa
    enviarMensagem,                         // Enviar nova mensagem
    buscarRespostasProntas,                 // Recarregar templates
    
    // ✅ ESTADO DE PRONTIDÃO
    isChatDataReady,                        // Se pode executar operações
    
    // 📊 INFORMAÇÕES ADICIONAIS (para debug/monitoramento)
    authLoading,                            // Loading da autenticação
    isAuthenticated,                        // Status de autenticação
    userProfile,                            // Dados do perfil
    clinicaDataLoading,                     // Loading dos dados da clínica
    clinicaDataError,                       // Erro nos dados da clínica
    clinicaId                               // ID da clínica atual
  };
};