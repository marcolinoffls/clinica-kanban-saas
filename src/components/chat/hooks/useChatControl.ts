
import { useState, useEffect, useMemo } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAIConversationControl } from '@/hooks/useAIConversationControl';
import { useAllClinicas } from '@/hooks/useAllClinicas';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useClinicaData } from '@/hooks/useClinicaData';
import { toast } from 'sonner';
import type { Lead, MessageData } from '@/types';

/**
 * Hook principal de controle do chat
 * 
 * Centraliza toda a lógica de estado e manipulação do sistema de chat:
 * - Seleção de conversas e leads
 * - Controle de entrada de mensagem
 * - Integração com IA
 * - Sistema Admin multi-clínica
 * - Modais e estados da UI
 */

interface UseChatControlProps {
  selectedLeadId?: string;
}

export const useChatControl = ({ selectedLeadId }: UseChatControlProps) => {
  // Estados básicos da UI
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Estados dos modais
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [leadSourceForModal, setLeadSourceForModal] = useState<any>(null);

  // Hooks de dados do usuário e clínica
  const { user } = useAuthUser();
  const { clinicaId } = useClinicaData();
  const isAdmin = user?.profile_type === 'admin';

  // Estados para Admin multi-clínica
  const [selectedClinicaId, setSelectedClinicaId] = useState<string | null>(
    isAdmin ? null : clinicaId
  );
  
  // Buscar dados das clínicas (apenas para Admin)
  const { data: clinicas = [], isLoading: loadingClinicas } = useAllClinicas(isAdmin);

  // Buscar dados principais usando filtro de clínica
  const {
    leads,
    etapas,
    respostasProntas,
    mensagensNaoLidas,
    loading,
    buscarMensagensLead,
    enviarMensagem,
    marcarMensagensComoLidas,
  } = useSupabaseData(selectedClinicaId);

  // Hook de controle da IA para a conversa selecionada
  const {
    aiEnabled,
    toggleAI,
    isInitializing,
    isUpdating
  } = useAIConversationControl({ 
    leadId: selectedConversation || '' 
  });

  // Calcular últimas mensagens
  const ultimasMensagens = useMemo(() => {
    const mensagensMap: Record<string, any> = {};
    
    leads.forEach(lead => {
      mensagensMap[lead.id] = {
        conteudo: `Conversa com ${lead.nome}`,
        created_at: lead.updated_at,
        enviado_por: 'sistema'
      };
    });
    
    return mensagensMap;
  }, [leads]);

  // Buscar lead selecionado
  const selectedLead = useMemo(() => {
    if (!selectedConversation) return null;
    return leads.find(lead => lead.id === selectedConversation) || null;
  }, [selectedConversation, leads]);

  // Efeito para lead pré-selecionado
  useEffect(() => {
    if (selectedLeadId && leads.length > 0) {
      const leadExists = leads.find(lead => lead.id === selectedLeadId);
      if (leadExists) {
        setSelectedConversation(selectedLeadId);
        marcarMensagensComoLidas(selectedLeadId);
      }
    }
  }, [selectedLeadId, leads]);

  // Marcar mensagens como lidas quando conversa muda
  useEffect(() => {
    if (selectedConversation) {
      marcarMensagensComoLidas(selectedConversation);
    }
  }, [selectedConversation, marcarMensagensComoLidas]);

  // Funções de manipulação
  const handleSendMessage = async (messageData: MessageData) => {
    if (!selectedConversation || !messageData.content.trim()) return;

    setSendingMessage(true);
    try {
      await enviarMensagem({
        leadId: selectedConversation,
        conteudo: messageData.content,
        tipo: messageData.type as any,
        anexoUrl: messageData.anexoUrl,
        aiEnabled: messageData.aiEnabled || false
      });
      
      setMessageInput('');
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddContact = (leadSource: any) => {
    setLeadSourceForModal(leadSource);
    setIsAddContactModalOpen(true);
  };

  const handleSaveContact = async (leadData: any) => {
    try {
      console.log('Salvando novo contato:', leadData);
      toast.success('Contato adicionado com sucesso!');
      setIsAddContactModalOpen(false);
      setLeadSourceForModal(null);
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      toast.error('Erro ao salvar contato');
    }
  };

  const handleCloseContactModal = () => {
    setIsAddContactModalOpen(false);
    setLeadSourceForModal(null);
  };

  return {
    // Estados básicos
    loading,
    leads,
    etapas,
    respostasProntas,
    mensagensNaoLidas,
    ultimasMensagens,
    
    // Conversa selecionada
    selectedConversation,
    setSelectedConversation,
    selectedLead,
    
    // Input de mensagem
    messageInput,
    setMessageInput,
    searchTerm,
    setSearchTerm,
    sendingMessage,
    
    // Controle da IA
    aiEnabled,
    toggleAI,
    isInitializing,
    isUpdating,
    
    // Sistema Admin
    isAdmin,
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
