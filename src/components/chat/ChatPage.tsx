import { useState, useEffect } from 'react';
import { Search, Phone, Video, MessageSquare, Instagram, Shield } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { ChatWindow } from './ChatWindow';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { FollowupButton } from '@/components/followup/FollowupButton';
import { AdminClinicSelector } from '@/components/admin/AdminClinicSelector';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAdminChatData } from '@/hooks/useAdminChatData';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useWebhook } from '@/hooks/useWebhook';
import { useClinicaData } from '@/hooks/useClinicaData';
import { useAIConversationControl } from '@/hooks/useAIConversationControl';
import { useUpdateLeadAiConversationStatus, useCreateLead } from '@/hooks/useLeadsData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lead } from '@/hooks/useLeadsData';
import { supabase } from '@/integrations/supabase/client';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';
import { HistoricoConsultasModal } from './HistoricoConsultasModal';
import { LeadModal } from '@/components/kanban/LeadModal';
import { toast } from 'sonner';

/**
 * Página principal do chat com funcionalidades de mídia
 * 
 * Funcionalidades:
 * - Chat de texto tradicional
 * - Upload e envio de imagens e áudios via MinIO
 * - Integração com IA
 * - Webhook para notificações
 * - Estados de carregamento para uploads
 * - Botão de follow-up manual integrado
 * - Ordenação de contatos por última mensagem (NOVO)
 * - Ícones de origem do lead (WhatsApp/Instagram) (NOVO)
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
  const { clinicaId } = useClinicaData();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  // Estado para controle administrativo
  const [adminClinicaSelecionada, setAdminClinicaSelecionada] = useState<any | null>(null);

  // Hooks de dados - usar admin ou normal dependendo do tipo de usuário
  const normalChatData = useSupabaseData();
  const adminChatData = useAdminChatData(adminClinicaSelecionada?.id || null);

  // Determinar quais dados usar baseado no tipo de usuário
  const currentChatData = isAdmin 
    ? {
        leads: adminChatData.leads,
        mensagensNaoLidas: adminChatData.mensagensNaoLidas,
        loading: adminChatData.loading,
        etapas: normalChatData.etapas, // Etapas são sempre as mesmas
        tags: normalChatData.tags, // Tags são sempre as mesmas
        respostasProntas: normalChatData.respostasProntas,
        enviarMensagem: normalChatData.enviarMensagem,
        marcarMensagensComoLidas: adminChatData.marcarMensagensComoLidasAdmin
      }
    : normalChatData;

  const { enviarWebhook } = useWebhook();
  const updateLeadAiStatusMutation = useUpdateLeadAiConversationStatus();
  const createLeadMutation = useCreateLead();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedLeadId || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Estados para upload de mídia
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Estado para armazenar última mensagem de cada lead (NOVO)
  const [ultimasMensagens, setUltimasMensagens] = useState<Record<string, string>>({});

  // Novos estados para os modais
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [leadSourceForModal, setLeadSourceForModal] = useState<Lead | null>(null);

  const selectedLead = currentChatData.leads.find(l => l.id === selectedConversation) || null;

  const { aiEnabled, toggleAI, isInitializing, isUpdating } = useAIConversationControl({
    selectedLead,
    updateLeadAiConversationStatus: async (params: { leadId: string; aiEnabled: boolean }) => {
      // Converter parâmetros para o formato esperado pelo hook
      return await updateLeadAiStatusMutation.mutateAsync({
        leadId: params.leadId,
        enabled: params.aiEnabled
      });
    }
  });

  // Função para buscar última mensagem de cada lead (NOVO)
  const buscarUltimasMensagens = async () => {
    if (!clinicaId) return;

    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('lead_id, created_at')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar últimas mensagens:', error);
        return;
      }

      // Criar um mapa com a data da última mensagem de cada lead
      const ultimasMap: Record<string, string> = {};
      data?.forEach((msg) => {
        if (!ultimasMap[msg.lead_id]) {
          ultimasMap[msg.lead_id] = msg.created_at;
        }
      });

      setUltimasMensagens(ultimasMap);
    } catch (error) {
      console.error('Erro ao buscar últimas mensagens:', error);
    }
  };

  // Configurar subscription para atualizações em tempo real das mensagens (NOVO)
  useEffect(() => {
    if (!clinicaId) return;

    buscarUltimasMensagens();

    const channel = supabase
      .channel('chat-messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensagens',
          filter: `clinica_id=eq.${clinicaId}`
        },
        (payload) => {
          const novaMensagem = payload.new as any;
          setUltimasMensagens(prev => ({
            ...prev,
            [novaMensagem.lead_id]: novaMensagem.created_at
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicaId]);

  useEffect(() => {
    if (selectedLeadId) {
      setSelectedConversation(selectedLeadId);
    }
  }, [selectedLeadId]);

  useEffect(() => {
    if (selectedConversation && currentChatData.mensagensNaoLidas[selectedConversation] > 0) {
      currentChatData.marcarMensagensComoLidas(selectedConversation);
    }
  }, [selectedConversation, currentChatData.mensagensNaoLidas, currentChatData.marcarMensagensComoLidas]);

  // Filtrar e ordenar leads - adaptar para modo admin
  const leadsComMensagens = currentChatData.leads
    .filter(lead =>
      (lead.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
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
      alert('Por favor, selecione uma conversa antes de enviar uma mídia.');
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

      const leadSelecionado = currentChatData.leads.find(l => l.id === selectedConversation);

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
      const novaMensagemRaw = await currentChatData.enviarMensagem(
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

  if (adminLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (currentChatData.loading) {
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
        {/* Header da lista com seletor de clínica para admin */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-semibold text-gray-900">Conversas</h2>
            {isAdmin && (
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>

          {/* Seletor de clínica para administradores */}
          {isAdmin && (
            <div className="mb-3">
              <AdminClinicSelector
                clinicaSelecionada={adminClinicaSelecionada}
                onClinicaSelected={setAdminClinicaSelecionada}
                showStats={false}
              />
            </div>
          )}

          {/* Alert informativo para admin */}
          {isAdmin && !adminClinicaSelecionada && (
            <Alert className="mb-3">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Selecione uma clínica para visualizar suas conversas
              </AlertDescription>
            </Alert>
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
          {leadsComMensagens.length > 0 ? (
            leadsComMensagens.map((lead) => {
              const mensagensNaoLidasCount = currentChatData.mensagensNaoLidas[lead.id] || 0;
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
                        <div className="min-w-0">
                          <h4 className={`font-medium truncate ${
                            mensagensNaoLidasCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-900'
                          }`}>
                            {lead.nome || 'Lead sem nome'}
                          </h4>
                          {/* Exibir nome da clínica para admin */}
                          {isAdmin && lead.nome_clinica && (
                            <div className="text-xs text-blue-600 truncate">
                              {lead.nome_clinica}
                            </div>
                          )}
                        </div>
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
                {isAdmin && !adminClinicaSelecionada 
                  ? 'Selecione uma clínica para visualizar conversas'
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
            {/* Header da conversa com informações da clínica para admin */}
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
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 truncate">
                      {formatPhoneNumber(selectedLead.telefone)}
                    </p>
                    {/* Mostrar clínica para admin */}
                    {isAdmin && selectedLead.nome_clinica && (
                      <Badge variant="outline" className="text-xs">
                        {selectedLead.nome_clinica}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
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
              <ChatWindow 
                leadId={selectedConversation} 
                targetClinicaId={adminClinicaSelecionada?.id}
              />
            </div>

            <div className="border-t border-gray-200 bg-white flex-shrink-0">
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
                respostasProntas={currentChatData.respostasProntas}
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
                {isAdmin && !adminClinicaSelecionada
                  ? 'Primeiro selecione uma clínica, depois escolha uma conversa'
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
            etapas={normalChatData.etapas}
            onSave={handleSaveContact}
        />
      )}
    </div>
  );
};
