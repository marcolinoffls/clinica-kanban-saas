
import { useState, useEffect } from 'react';
import { Search, Phone, Video, MessageSquare, Instagram } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { ChatWindow } from './ChatWindow';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { FollowupButton } from '@/components/followup/FollowupButton';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWebhook } from '@/hooks/useWebhook';
import { useClinicaData } from '@/hooks/useClinicaData';
import { useAIConversationControl } from '@/hooks/useAIConversationControl';
import { useUpdateLeadAiConversationStatus, useCreateLead } from '@/hooks/useLeadsData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Lead } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';
import { HistoricoConsultasModal } from './HistoricoConsultasModal';
import { LeadModal } from '@/components/kanban/LeadModal';
import { toast } from 'sonner';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useAllClinicas } from '@/hooks/useAllClinicas';
import { ClinicSelector } from './ClinicSelector';

/**
 * Página principal do chat com funcionalidades de mídia
 * 
 * NOVA FUNCIONALIDADE - Seleção de clínicas para Admin:
 * - Admin pode visualizar conversas de qualquer clínica
 * - Usuários normais veem apenas sua própria clínica
 * - Filtro dinâmico de leads baseado na clínica selecionada
 * - Interface condicional baseada no tipo de usuário
 * 
 * Funcionalidades existentes:
 * - Chat de texto tradicional
 * - Upload e envio de imagens e áudios via MinIO
 * - Integração com IA
 * - Webhook para notificações
 * - Estados de carregamento para uploads
 * - Botão de follow-up manual integrado
 * - Ordenação de contatos por última mensagem
 * - Ícones de origem do lead (WhatsApp/Instagram)
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

/**
 * Função para formatar números de telefone no padrão brasileiro
 * Converte números como "84987759827" para "(84) 98775-9827"
 */
const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'Telefone não informado';
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (celular com 9 na frente)
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }
  
  // Se tem 10 dígitos (telefone fixo)
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }
  
  // Se não está no padrão esperado, retorna como está
  return phone;
};

/**
 * Função para determinar o ícone da origem do lead
 */
const getOrigemIcon = (origem: string | null | undefined) => {
  if (!origem) return null;
  
  const origemLower = origem.toLowerCase();
  if (origemLower.includes('whatsapp')) {
    return (
      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
        <MessageSquare size={10} className="text-white" />
      </div>
    );
  }
  
  if (origemLower.includes('instagram')) {
    return (
      <div className="absolute bottom-1 right-1 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Instagram size={10} className="text-white" />
      </div>
    );
  }
  
  return null;
};

export const ChatPage = ({ selectedLeadId }: ChatPageProps) => {
  // NOVO: Hooks para controle de Admin e seleção de clínicas
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

  console.log('[ChatPage] Controle de clínica:', {
    isAdmin: isAdmin(),
    selectedClinicaId,
    clinicaId,
    effectiveClinicaId
  });

  // MODIFICADO: useSupabaseData agora recebe clinica_id filtrado
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
  } = useAIConversationControl(selectedLeadId || '');

  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedLeadId || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Estados para upload de mídia
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Estado para armazenar última mensagem de cada lead
  const [ultimasMensagens, setUltimasMensagens] = useState<Record<string, string>>({});

  // Novos estados para os modais
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [leadSourceForModal, setLeadSourceForModal] = useState<Lead | null>(null);

  // Lead selecionado baseado na conversa atual
  const selectedLead = leads.find(lead => lead.id === selectedConversation);

  // NOVO: Recarregar dados quando clínica selecionada muda
  useEffect(() => {
    if (isAdmin()) {
      console.log(`[ChatPage] Admin mudou seleção de clínica para: ${selectedClinicaId}`);
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

  // Filtrar e ordenar leads por última mensagem (ATUALIZADO)
  const leadsComMensagens = leads
    .filter(lead =>
      (lead.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Ordenar por data da última mensagem, mais recente primeiro
      const dataA = ultimasMensagens[a.id] || a.data_ultimo_contato || a.updated_at;
      const dataB = ultimasMensagens[b.id] || b.data_ultimo_contato || b.updated_at;
      
      return new Date(dataB).getTime() - new Date(dataA).getTime();
    });

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
    if (!selectedConversation) {
      alert('Por favor, sel
ecione uma conversa antes de enviar uma mídia.');
      console.error('[ChatPage] Tentativa de upload sem conversa selecionada.');
      return;
    }
  
    if (!clinicaId) {
      alert('ID da clínica não está disponível. Não é possível fazer upload.');
      console.error('[ChatPage] clinicaId não disponível para upload.');
      return;
    }
  
    setIsUploadingMedia(true);
    setUploadError(null);
    console.log(`[ChatPage] Iniciando upload do CRM para: leadId=${selectedConversation}, clinicaId=${clinicaId}, arquivo=${file.name}`);
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clinicaId', clinicaId);
    formData.append('leadId', selectedConversation);
  
    try {
      // Chama a Edge Function que faz o upload para o MinIO
      const { data: uploadResponse, error: functionError } = await supabase.functions.invoke(
        'send-crm-media-to-minio', // Nome EXATO da sua Edge Function
        { body: formData }
      );
  
      if (functionError || !uploadResponse?.publicUrl) {
        const errorMessage = functionError?.message || uploadResponse?.error || 'Falha ao obter URL da mídia do MinIO.';
        console.error('[ChatPage] Erro ao invocar send-crm-media-to-minio ou URL não retornada:', functionError, uploadResponse);
        setUploadError(errorMessage);
        alert(`Erro no upload: ${errorMessage}`);
        setIsUploadingMedia(false);
        return;
      }
  
      const { publicUrl } = uploadResponse;
  
      // Determina o tipo de arquivo baseado no mimetype para enviar para o Supabase
      // e corresponder à constraint do banco de dados.
      let determinedFileType: 'imagem' | 'audio' | 'arquivo' = 'arquivo'; // Valor padrão
      if (file.type.startsWith('image/')) {
        determinedFileType = 'imagem';
      } else if (file.type.startsWith('audio/')) {
        determinedFileType = 'audio';
      }
  
      console.log(`[ChatPage] Upload do CRM para MinIO bem-sucedido. URL: ${publicUrl}. Tipo: ${determinedFileType}. Chamando handleSendMessage.`);
      
      // Agora, chame handleSendMessage com os dados da mídia
      await handleSendMessage({
        type: determinedFileType,
        content: file.name,
        anexoUrl: publicUrl,
        aiEnabled: aiEnabled
      });
  
    } catch (e: any) {
      console.error("[ChatPage] Erro durante o processo de upload da mídia pelo CRM:", e);
      setUploadError(e.message || 'Erro desconhecido durante o upload.');
      alert(`Erro no upload: ${e.message || 'Erro desconhecido'}`);
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
    return formatPhoneNumber(lead.telefone) || 'Clique para ver a conversa...';
  };

  /**
   * NOVO: Abre o modal para adicionar um novo contato a partir de um lead do Instagram.
   * @param sourceLead O lead do Instagram que servirá de base.
   */
  const handleAddContact = (sourceLead: Lead) => {
    setLeadSourceForModal(sourceLead);
    setIsAddContactModalOpen(true);
  };

  /**
   * NOVO: Salva o novo contato criado no modal.
   * É chamado pelo onSave do LeadModal.
   * @param newLeadData Dados do formulário do novo lead.
   */
  const handleSaveContact = (newLeadData: Partial<Lead>) => {
    // Usa o clinicaId do hook, que é mais confiável.
    if (!clinicaId) {
      toast.error("ID da clínica não encontrado. Não é possível criar o lead.");
      console.error("Tentativa de criar lead sem clinica_id");
      return;
    }

    // Combina os dados do formulário com o clinica_id e anotações de rastreabilidade.
    const finalLeadData = {
      ...newLeadData,
      clinica_id: clinicaId,
      anotacoes: `Contato criado a partir de um lead do Instagram (${leadSourceForModal?.nome}).\n${newLeadData.anotacoes || ''}`.trim()
    };
    
    createLeadMutation.mutate(finalLeadData, {
      onSuccess: (createdLead) => {
        toast.success(`Contato "${createdLead.nome}" criado com sucesso!`);
        setIsAddContactModalOpen(false);
        setLeadSourceForModal(null);
      },
      onError: (error) => {
        // O hook useCreateLead já pode mostrar um toast, mas um extra aqui pode ser mais específico.
        toast.error(`Erro ao criar contato: ${error.message}`);
      }
    });
  };

  /**
   * NOVO: Fecha o modal de adicionar contato e limpa o estado.
   */
  const handleCloseContactModal = () => {
    setIsAddContactModalOpen(false);
    setLeadSourceForModal(null);
  };

  if (loading || (isAdmin() && loadingClinicas)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">
            {isAdmin() ? 'Carregando sistema admin...' : 'Carregando conversas...'}
          </p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            {isAdmin() ? 'Conversas - Admin' : 'Conversas'}
          </h2>
          
          {/* NOVO: Seletor de clínicas para Admin */}
          {isAdmin() && (
            <ClinicSelector
              selectedClinicaId={selectedClinicaId}
              onClinicaChange={setSelectedClinicaId}
              clinicas={clinicas}
              loading={loadingClinicas}
            />
          )}
          
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
          {/* MODIFICADO: Adicionar indicador quando Admin está visualizando "todas" */}
          {isAdmin() && selectedClinicaId === 'all' && leads.length > 0 && (
            <div className="p-2 bg-blue-50 border-b border-blue-100">
              <p className="text-xs text-blue-600 text-center">
                📊 Visualizando todas as clínicas ({leads.length} conversas)
              </p>
            </div>
          )}
          
          {/* Lista de leads com conversas */}
          {leadsComMensagens.length > 0 ? (
            leadsComMensagens.map((lead) => {
              const mensagensNaoLidasCount = mensagensNaoLidas[lead.id] || 0;
              const ultimaMensagemData = ultimasMensagens[lead.id] || lead.data_ultimo_contato || lead.updated_at;
              
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedConversation(lead.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative ${
                    selectedConversation === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={lead.avatar_url || undefined} alt={`Avatar de ${lead.nome || 'Lead'}`} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {lead.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      {getOrigemIcon(lead.origem_lead)}
                    </div>

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
                          {lead.nome || 'Lead sem nome'}
                          {/* NOVO: Mostrar nome da clínica para Admin visualizando "todas" */}
                          {isAdmin() && selectedClinicaId === 'all' && lead.nome_clinica && (
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                              ({lead.nome_clinica})
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(ultimaMensagemData)}
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
              <p className="text-gray-500">
                {isAdmin() && selectedClinicaId === 'all' 
                  ? 'Nenhuma conversa encontrada em todas as clínicas'
                  : 'Nenhuma conversa encontrada'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Área de mensagens - Centro */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedLead ? (
          <>
            {/* Header da conversa com botão de follow-up */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedLead.avatar_url || undefined} alt={`Avatar de ${selectedLead.nome || 'Lead'}`} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {selectedLead.nome ? selectedLead.nome.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                  {getOrigemIcon(selectedLead.origem_lead)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {selectedLead.nome || 'Lead sem nome'}
                    {/* NOVO: Mostrar clínica no header para Admin */}
                    {isAdmin() && selectedLead.nome_clinica && (
                      <span className="ml-2 text-sm text-gray-500 font-normal">
                        - {selectedLead.nome_clinica}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {formatPhoneNumber(selectedLead.telefone)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {/* Botão de Follow-up integrado */}
                <FollowupButton
                  leadId={selectedLead.id}
                  leadNome={selectedLead.nome}
                  leadTelefone={selectedLead.telefone}
                  variant="outline"
                  size="sm"
                  showLabel={true}
                  className="mr-2"
                />
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
                {isAdmin() 
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

      {/* NOVO: Modal para adicionar contato */}
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
            }}
            etapas={etapas}
            onSave={handleSaveContact}
        />
      )}
    </div>
  );
};
