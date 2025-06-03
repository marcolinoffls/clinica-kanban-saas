import { useState, useEffect } from 'react';
import { Search, Phone, Video, MessageSquare } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { ChatWindow } from './ChatWindow';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWebhook } from '@/hooks/useWebhook';
import { useClinicaData } from '@/hooks/useClinicaData';
import { useAIConversationControl } from '@/hooks/useAIConversationControl';
import { useUpdateLeadAiConversationStatus } from '@/hooks/useLeadsData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Lead } from '@/hooks/useLeadsData';
import { supabase } from '@/integrations/supabase/client';

/**
 * Página principal do chat com funcionalidades de mídia
 * 
 * Funcionalidades:
 * - Chat de texto tradicional
 * - Upload e envio de imagens e áudios via MinIO
 * - Integração com IA
 * - Webhook para notificações
 * - Estados de carregamento para uploads
 */

interface ChatPageProps {
  selectedLeadId?: string;
}

// Interface para dados de mensagem (texto ou mídia)
interface MessageData {
  type: string;
  content: string;
  anexoUrl?: string;
  aiEnabled?: boolean;
}

export const ChatPage = ({ selectedLeadId }: ChatPageProps) => {
  const { clinicaId } = useClinicaData(); // Obtém o ID da clínica diretamente

  const {
    leads,
    tags,
    enviarMensagem,
    respostasProntas,
    mensagensNaoLidas,
    marcarMensagensComoLidas,
    loading
  } = useSupabaseData();

  const { enviarWebhook } = useWebhook();
  const updateLeadAiStatusMutation = useUpdateLeadAiConversationStatus();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedLeadId || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Estados para upload de mídia
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedLead = leads.find(l => l.id === selectedConversation) || null;

  const { aiEnabled, toggleAI, isInitializing, isUpdating } = useAIConversationControl({
    selectedLead,
    updateLeadAiConversationStatus: updateLeadAiStatusMutation.mutateAsync
  });

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

  const leadsComMensagens = leads.filter(lead =>
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.telefone?.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validarClinicaId = (clinicaId: string | null | undefined): clinicaId is string => {
    if (!clinicaId) {
      return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinicaId)) {
      return false;
    }
    return true;
  };

  /**
   * Nova função para fazer upload de mídia para MinIO via Edge Function
   * Esta função é chamada quando o usuário seleciona um arquivo no MessageInput
   */
  const handleFileUploadAndSend = async (file: File) => {
    console.log('📤 Iniciando upload de mídia:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      selectedConversation,
      clinicaId
    });

    // Validações iniciais
    if (!selectedConversation) {
      alert('Por favor, selecione uma conversa para enviar a mídia.');
      return;
    }
    
    if (!clinicaId) {
      alert('ID da clínica não está disponível. Não é possível fazer upload.');
      return;
    }

    setIsUploadingMedia(true);
    setUploadError(null);

    // Preparar FormData para a Edge Function
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clinicaId', clinicaId);
    formData.append('leadId', selectedConversation);

    try {
      console.log('🚀 Chamando Edge Function send-crm-media-to-minio...');
      
      // Chamar a Edge Function send-crm-media-to-minio
      const { data: uploadResponse, error: functionError } = await supabase.functions.invoke(
        'send-crm-media-to-minio',
        { body: formData }
      );

      if (functionError || !uploadResponse?.publicUrl) {
        console.error('❌ Erro na Edge Function ou URL não retornada:', functionError, uploadResponse);
        const errorMessage = functionError?.message || uploadResponse?.error || 'Falha ao obter URL da mídia do MinIO.';
        setUploadError(errorMessage);
        alert(`Erro no upload: ${errorMessage}`);
        return;
      }

      console.log('✅ Upload realizado com sucesso:', uploadResponse);

      const { publicUrl } = uploadResponse;
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('audio/') ? 'audio' : 'file';

      // Criar objeto de mensagem com dados da mídia
      const messageData: MessageData = {
        type: fileType,
        content: file.name, // Nome do arquivo como conteúdo inicial
        anexoUrl: publicUrl,
        aiEnabled: aiEnabled
      };

      console.log('💬 Enviando mensagem de mídia:', messageData);

      // Enviar mensagem com os dados da mídia
      await handleSendMessage(messageData);

    } catch (error: any) {
      console.error('❌ Erro durante o processo de upload:', error);
      setUploadError(error.message || 'Erro desconhecido durante o upload.');
      alert(`Erro no upload: ${error.message || 'Erro desconhecido durante o upload.'}`);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  /**
   * Função modificada para lidar com envio de mensagens (texto e mídia)
   * Agora recebe um objeto MessageData ao invés de apenas aiEnabledForMessage
   */
  const handleSendMessage = async (messageData: MessageData) => {
    // Validar se há conteúdo (texto) ou anexo (mídia)
    if ((!messageData.content.trim() && !messageData.anexoUrl) || !selectedConversation || sendingMessage || isUploadingMedia) {
      // Validação específica por tipo
      if (messageData.type === 'text' && !messageData.content.trim()) return;
      if ((messageData.type === 'image' || messageData.type === 'audio') && !messageData.anexoUrl) return;
      if (!selectedConversation || sendingMessage || isUploadingMedia) return;
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
        console.error('❌ [ChatPage] ERRO CRÍTICO: Não foi possível determinar um clinica_id válido para o webhook.');
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
      console.error('❌ [ChatPage] Erro no envio da mensagem:', error.message);
      alert(`Erro no envio: ${error.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastMessage = (lead: Lead) => {
    return lead.telefone || 'Clique para ver a conversa...';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Lista de conversas - Lateral esquerda */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header da lista */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Conversas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de conversas com rolagem própria */}
        <div className="flex-1 overflow-y-auto">
          {leadsComMensagens.length > 0 ? (
            leadsComMensagens.map((lead) => {
              const mensagensNaoLidasCount = mensagensNaoLidas[lead.id] || 0;
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedConversation(lead.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative ${
                    selectedConversation === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={lead.avatar_url || undefined} alt={`Avatar de ${lead.nome}`} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {lead.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {mensagensNaoLidasCount > 0 && (
                      <div className="absolute top-2 left-11 bg-green-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {mensagensNaoLidasCount > 99 ? '99+' : mensagensNaoLidasCount}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-medium truncate ${
                          mensagensNaoLidasCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-900'
                        }`}>
                          {lead.nome}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(lead.data_ultimo_contato || lead.updated_at)}
                        </span>
                      </div>
                      <p className={`text-sm truncate mt-1 ${
                        mensagensNaoLidasCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-600'
                      }`}>
                        {getLastMessage(lead)}
                      </p>
                    </div>
                  </div>
                  {mensagensNaoLidasCount > 0 && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <MessageSquare size={32} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de mensagens - Centro */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedLead ? (
          <>
            {/* Header da conversa */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedLead.avatar_url || undefined} alt={`Avatar de ${selectedLead.nome}`} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                    {selectedLead.nome.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {selectedLead.nome}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedLead.telefone}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Phone size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Video size={20} />
                </button>
              </div>
            </div>

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
                onFileSelect={handleFileUploadAndSend} // Passando a nova função de upload
                loading={sendingMessage || isUploadingMedia} // Considerando ambos os estados de loading
                respostasProntas={respostasProntas}
                aiEnabled={aiEnabled}
                onToggleAI={toggleAI}
                isAIInitializing={isInitializing || isUpdating}
                leadId={selectedConversation} // Passando o ID do lead para o MessageInput
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
                Escolha uma conversa para começar a mensagear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Painel de Informações do Lead - Lateral direita */}
      {selectedLead && (
        <LeadInfoSidebar
          lead={selectedLead}
          tags={tags.filter(tag => tag.id === selectedLead.tag_id)}
          historico={[]}
          onCallLead={() => console.log('Ligar para lead:', selectedLead.id)}
          onScheduleAppointment={() => console.log('Agendar para lead:', selectedLead.id)}
          onEditLead={() => console.log('Editar lead:', selectedLead.id)}
        />
      )}
    </div>
  );
};
