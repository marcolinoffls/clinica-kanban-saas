
import { MessageSquare } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { ChatWindow } from './ChatWindow';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { ConversationList } from './ConversationList';
import { ConversationHeader } from './ConversationHeader';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';
import { HistoricoConsultasModal } from './HistoricoConsultasModal';
import { LeadModal } from '@/components/kanban/LeadModal';
import { useChatControl } from './hooks/useChatControl';
import { useFileUpload } from './hooks/useFileUpload';

/**
 * Página principal do chat refatorada
 * 
 * NOVA ARQUITETURA:
 * - Código dividido em componentes focados
 * - Hooks personalizados para lógica
 * - Utilitários separados
 * - Melhor manutenibilidade
 * 
 * FUNCIONALIDADES:
 * - Seleção de clínicas para Admin
 * - Chat de texto e mídia
 * - Integração com IA
 * - Webhook para notificações
 * - Follow-up integrado
 */

interface ChatPageProps {
  selectedLeadId?: string;
}

export const ChatPage = ({ selectedLeadId }: ChatPageProps) => {
  // Hook principal de controle
  const {
    loading,
    leads,
    etapas,
    respostasProntas,
    mensagensNaoLidas,
    ultimasMensagens,
    selectedConversation,
    setSelectedConversation,
    selectedLead,
    messageInput,
    setMessageInput,
    searchTerm,
    setSearchTerm,
    sendingMessage,
    aiEnabled,
    toggleAI,
    isInitializing,
    isUpdating,
    isAdmin,
    selectedClinicaId,
    setSelectedClinicaId,
    clinicas,
    loadingClinicas,
    clinicaId,
    isAgendamentoModalOpen,
    setIsAgendamentoModalOpen,
    isHistoricoModalOpen,
    setIsHistoricoModalOpen,
    isAddContactModalOpen,
    leadSourceForModal,
    handleSendMessage,
    marcarMensagensComoLidas,
    handleAddContact,
    handleSaveContact,
    handleCloseContactModal,
  } = useChatControl({ selectedLeadId });

  // Hook para upload de arquivos
  const {
    isUploadingMedia,
    uploadError,
    setUploadError,
    handleFileUploadAndSend
  } = useFileUpload({
    selectedConversation,
    clinicaId,
    aiEnabled,
    onSendMessage: handleSendMessage
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">
            {isAdmin ? 'Carregando sistema admin...' : 'Carregando conversas...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Lista de conversas - Lateral esquerda */}
      <ConversationList
        leads={leads}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        mensagensNaoLidas={mensagensNaoLidas}
        ultimasMensagens={ultimasMensagens}
        selectedConversation={selectedConversation}
        onConversationSelect={setSelectedConversation}
        isAdmin={isAdmin}
        selectedClinicaId={selectedClinicaId}
        onClinicaChange={setSelectedClinicaId}
        clinicas={clinicas}
        loadingClinicas={loadingClinicas}
      />

      {/* Área de mensagens - Centro */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedLead ? (
          <>
            {/* Header da conversa */}
            <ConversationHeader 
              lead={selectedLead} 
              isAdmin={isAdmin}
            />

            <div className="flex-1 bg-gray-50 overflow-hidden">
              <ChatWindow leadId={selectedConversation} />
            </div>

            <div className="border-t border-gray-200 bg-white flex-shrink-0">
              {/* Exibir erro de upload se houver */}
              {uploadError && (
                <div className="px-4 py-2 bg-red-50 border-b border-red-200">
                  <p className="text-sm text-red-600">Erro no upload: {uploadError}</p>
                </div>
              )}
              
              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={() => handleSendMessage({ 
                  type: 'text', 
                  content: messageInput, 
                  aiEnabled: aiEnabled 
                })}
                onFileSelect={handleFileUploadAndSend}
                loading={sendingMessage || isUploadingMedia}
                respostasProntas={respostasProntas}
                aiEnabled={aiEnabled}
                onToggleAI={toggleAI}
                isAIInitializing={isInitializing || isUpdating}
                leadId={selectedConversation}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                {isAdmin 
                  ? 'Escolha uma conversa para começar a mensagear (modo Admin)'
                  : 'Escolha uma conversa para começar a mensagear'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Painel de Informações do Lead - Lateral direita */}
      {selectedLead && (
        <LeadInfoSidebar
          lead={selectedLead}
          onClose={() => setSelectedConversation(null)}
        />
      )}
      
      {/* Modais centralizados */}
      {selectedLead && (
        <>
          <RegistroAgendamentoModal
            isOpen={isAgendamentoModalOpen}
            onClose={() => setIsAgendamentoModalOpen(false)}
            lead={selectedLead}
          />
          <HistoricoConsultasModal
            isOpen={isHistoricoModalOpen}
            onClose={() => setIsHistoricoModalOpen(false)}
            leadId={selectedLead.id}
            leadName={selectedLead.nome}
          />
        </>
      )}

      {/* Modal para adicionar contato */}
      {isAddContactModalOpen && leadSourceForModal && (
        <LeadModal
          isOpen={isAddContactModalOpen}
          onClose={handleCloseContactModal}
          lead={{
            nome: leadSourceForModal.nome,
            email: leadSourceForModal.email,
            servico_interesse: leadSourceForModal.servico_interesse,
            telefone: '',
            origem_lead: 'WhatsApp (via Instagram)',
            etapa_id: '', // Será definido no modal
          }}
          etapas={etapas}
          onSave={handleSaveContact}
        />
      )}
    </div>
  );
};
