
/**
 * Hook principal para controle do ChatPage
 * 
 * Centraliza toda a lógica de:
 * - Estados da página
 * - Controle de Admin e clínicas
 * - Envio de mensagens
 * - Modais
 * - Integração com webhooks
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWebhook } from '@/hooks/useWebhook';
import { useClinicaData } from '@/hooks/useClinicaData';
import { useAIConversationControl } from '@/hooks/useAIConversationControl';
import { useUpdateLeadAiConversationStatus, useCreateLead } from '@/hooks/useLeadsData';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useAllClinicas } from '@/hooks/useAllClinicas';
import { Lead, MessageData } from '@/types';
import { validarClinicaId } from '../utils/chatUtils';

interface UseChatControlProps {
  selectedLeadId?: string;
}

export const useChatControl = ({ selectedLeadId }: UseChatControlProps) => {
  // Hooks para controle de Admin e seleção de clínicas
  const { isAdmin } = useAuthUser();
  const { clinicas, loading: loadingClinicas } = useAllClinicas();
  const [selectedClinicaId, setSelectedClinicaId] = useState<string>('all');

  // Hook original para dados da clínica do usuário
  const { clinicaId } = useClinicaData();

  // Determinar qual clinica_id usar baseado no tipo de usuário e seleção
  const effectiveClinicaId = (() => {
    if (isAdmin()) {
      // Admin: usar clínica selecionada ou null para "todas"
      return selectedClinicaId === 'all' ? null : selectedClinicaId;
    } else {
      // Usuário normal: usar sempre sua própria clínica
      return clinicaId;
    }
  })();

  console.log('[useChatControl] Controle de clínica:', {
    isAdmin: isAdmin(),
    selectedClinicaId,
    clinicaId,
    effectiveClinicaId
  });

  // Hook para dados do Supabase
  const {
    leads,
    etapas,
    tags,
    enviarMensagem,
    respostasProntas,
    mensagensNaoLidas,
    marcarMensagensComoLidas,
    loading
  } = useSupabaseData(effectiveClinicaId);

  const { enviarWebhook } = useWebhook();
  const updateLeadAiStatusMutation = useUpdateLeadAiConversationStatus();
  const createLeadMutation = useCreateLead();

  // Hook para controle de IA
  const { 
    aiEnabled, 
    toggleAI, 
    isInitializing, 
    isUpdating 
  } = useAIConversationControl({ leadId: selectedLeadId || '' });

  // Estados locais - ADICIONADOS sending e isUploadingMedia
  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedLeadId || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sending, setSending] = useState(false); // ADICIONADO
  const [isUploadingMedia, setIsUploadingMedia] = useState(false); // ADICIONADO
  
  // Estado para armazenar última mensagem de cada lead
  const [ultimasMensagens, setUltimasMensagens] = useState<Record<string, string>>({});

  // Estados para os modais
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [leadSourceForModal, setLeadSourceForModal] = useState<Lead | null>(null);

  // Lead selecionado baseado na conversa atual
  const selectedLead = leads.find(lead => lead.id === selectedConversation);

  // Recarregar dados quando clínica selecionada muda
  useEffect(() => {
    if (isAdmin()) {
      console.log(`[useChatControl] Admin mudou seleção de clínica para: ${selectedClinicaId}`);
      // Limpar conversa selecionada ao trocar de clínica
      setSelectedConversation(null);
      // Limpar termo de busca
      setSearchTerm('');
    }
  }, [selectedClinicaId, isAdmin]);

  useEffect(() => {
    if (selectedLeadId) {
      setSelectedConversation(selectedLeadId);
    }
  }, [selectedLeadId]);

  useEffect(() => {
    if (selectedConversation && mensagensNaoLidas[selectedConversation] > 0) {
      marcarMensagensComoLidas(selectedConversation);
    }
  }, [selectedConversation, mensagensNaoLidas, marcarMensagensComoLidas]);

  /**
   * Função para lidar com envio de mensagens (texto e mídia)
   * Recebe um objeto MessageData
   */
  const handleSendMessage = async (messageData: MessageData) => {
    // Validar se há conteúdo (texto) ou anexo (mídia)
    if ((!messageData.content.trim() && !messageData.anexoUrl) || !selectedConversation || sendingMessage || isUploadingMedia) {
      // Validação específica por tipo
      if (messageData.type === 'text' && !messageData.content.trim()) return;
      if ((messageData.type === 'image' || messageData.type === 'audio') && !messageData.anexoUrl) return;
      if (!selectedConversation || sendingMessage) return;
    }

    console.log('📨 Enviando mensagem:', messageData);

    try {
      setSendingMessage(true);

      const leadSelecionado = leads.find(l => l.id === selectedConversation);

      let clinicaIdParaWebhook: string | null = null;

      if (leadSelecionado?.clinica_id && validarClinicaId(leadSelecionado.clinica_id)) {
        clinicaIdParaWebhook = leadSelecionado.clinica_id;
      } else if (clinicaId && validarClinicaId(clinicaId)) {
        clinicaIdParaWebhook = clinicaId;
      }

      if (!clinicaIdParaWebhook) {
        console.error('❌ [useChatControl] ERRO CRÍTICO: Não foi possível determinar um clinica_id válido para o webhook.');
        alert('Erro: ID da clínica não pôde ser determinado para o envio.');
        setSendingMessage(false);
        return;
      }

      // Chamar enviarMensagem com os novos parâmetros (incluindo tipo e anexoUrl)
      const novaMensagemRaw = await enviarMensagem(
        selectedConversation,        // leadId
        messageData.content,         // conteúdo (nome do arquivo para mídia, texto para mensagens de texto)
        messageData.type,            // tipo: 'text', 'image', 'audio'
        messageData.anexoUrl         // URL do MinIO para mídias, undefined para texto
      );

      // Limpar input de texto apenas se for mensagem de texto
      if (messageData.type === 'text') {
        setMessageInput('');
      }

      // Enviar webhook se a mensagem foi criada com sucesso
      if (novaMensagemRaw && novaMensagemRaw.enviado_por === 'usuario') {
        console.log('📡 Enviando webhook para a mensagem:', novaMensagemRaw.id);
        
        await enviarWebhook(
          novaMensagemRaw.id,
          novaMensagemRaw.lead_id,
          clinicaIdParaWebhook,
          novaMensagemRaw.conteudo,
          novaMensagemRaw.tipo || 'text',
          novaMensagemRaw.created_at,
          messageData.aiEnabled || false
        );
      }

      console.log('✅ Mensagem e/ou mídia enviada com sucesso e webhook disparado.');

    } catch (error: any) {
      console.error('❌ [useChatControl] Erro no envio da mensagem:', error.message);
      alert(`Erro no envio: ${error.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  /**
   * Funções para controle de modais e contatos
   */
  const handleAddContact = (sourceLead: Lead) => {
    setLeadSourceForModal(sourceLead);
    setIsAddContactModalOpen(true);
  };

  const handleSaveContact = (newLeadData: Partial<Lead>) => {
    if (!clinicaId) {
      toast.error("ID da clínica não encontrado. Não é possível criar o lead.");
      console.error("Tentativa de criar lead sem clinica_id");
      return;
    }

    const finalLeadData = {
      ...newLeadData,
      clinica_id: clinicaId,
      etapa_id: newLeadData.etapa_id || '', // Garantir que etapa_id seja fornecida
      anotacoes: `Contato criado a partir de um lead do Instagram (${leadSourceForModal?.nome}).\n${newLeadData.anotacoes || ''}`.trim()
    };
    
    createLeadMutation.mutate(finalLeadData, {
      onSuccess: (createdLead) => {
        toast.success(`Contato "${createdLead.nome}" criado com sucesso!`);
        setIsAddContactModalOpen(false);
        setLeadSourceForModal(null);
      },
      onError: (error) => {
        toast.error(`Erro ao criar contato: ${error.message}`);
      }
    });
  };

  const handleCloseContactModal = () => {
    setIsAddContactModalOpen(false);
    setLeadSourceForModal(null);
  };

  return {
    // Estados principais
    loading: loading || (isAdmin() && loadingClinicas),
    
    // Dados
    leads,
    etapas,
    tags,
    respostasProntas,
    mensagensNaoLidas,
    ultimasMensagens,
    
    // Conversa selecionada
    selectedConversation,
    setSelectedConversation,
    selectedLead,
    
    // Input e busca
    messageInput,
    setMessageInput,
    searchTerm,
    setSearchTerm,
    
    // Estados de envio - ADICIONADOS sending e isUploadingMedia
    sendingMessage,
    sending,
    setSending,
    isUploadingMedia,
    setIsUploadingMedia,
    
    // IA
    aiEnabled,
    toggleAI,
    isInitializing,
    isUpdating,
    
    // Admin e clínicas
    isAdmin: isAdmin(),
    selectedClinicaId,
    setSelectedClinicaId,
    clinicas,
    loadingClinicas,
    clinicaId,
    
    // Modais
    isAgendamentoModalOpen,
    setIsAgendamentoModalOpen,
    isHistoricoModalOpen,
    setIsHistoricoModalOpen,
    isAddContactModalOpen,
    leadSourceForModal,
    
    // Funções
    handleSendMessage,
    marcarMensagensComoLidas,
    handleAddContact,
    handleSaveContact,
    handleCloseContactModal,
  };
};
