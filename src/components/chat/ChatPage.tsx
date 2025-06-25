// src/components/chat/ChatPage.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Phone, Video, MessageSquare, Instagram, Shield, Bot, User, Clock, Calendar, PlusCircle, Paperclip } from 'lucide-react';

// Hooks personalizados
import { useClinicaData } from '@/hooks/useClinicaData';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAdminChatData } from '@/hooks/useAdminChatData';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWebhook } from '@/hooks/useWebhook';
import { useUpdateLeadAiConversationStatus } from '@/hooks/useUpdateLeadAiConversationStatus';
import { useCreateLead } from '@/hooks/useCreateLead';
import { useAIConversationControl } from '@/hooks/useAIConversationControl';

// Componentes da UI
import { MessageInput } from './MessageInput';
import { ChatWindow } from './ChatWindow';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { AgendamentoModal } from './AgendamentoModal';
import { HistoricoModal } from './HistoricoModal';
import { AddContactModal } from './AddContactModal';

// Tipos e componentes UI reutilizáveis
import { Lead } from '@/types/supabase';
import { Clinica } from '@/types/clinica';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ChatPageProps {
  selectedLeadId?: string;
}

export const ChatPage = ({ selectedLeadId: propSelectedLeadId }: ChatPageProps) => {
  const { clinicaId } = useClinicaData();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  const [adminClinicaSelecionada, setAdminClinicaSelecionada] = useState<Clinica | null>(null);

  // Hooks de dados principais
  const normalChatData = useSupabaseData();
  const adminChatData = useAdminChatData(adminClinicaSelecionada?.id || null);

  // Determina o contexto de dados a ser usado (admin ou usuário normal)
  const currentChatData = isAdmin ? adminChatData : normalChatData;
  const { leads, conversas, respostasProntas, clinicas, buscarMensagensLead, marcarMensagensComoLidas, buscarUltimaMensagem, uploadMedia } = currentChatData;

  const { enviarWebhook } = useWebhook();
  const updateLeadAiStatusMutation = useUpdateLeadAiConversationStatus();
  const createLeadMutation = useCreateLead();

  // Estados da UI e da lógica de chat
  const [selectedConversation, setSelectedConversation] = useState<string | null>(propSelectedLeadId || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ultimasMensagens, setUltimasMensagens] = useState<Record<string, string>>({});

  // Estados de controle dos modais
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  const selectedLead = useMemo(() => leads.find(l => l.id === selectedConversation) || null, [leads, selectedConversation]);

  const { aiEnabled, toggleAI, isInitializing, isUpdating } = useAIConversationControl({
    selectedLead,
    updateLeadAiConversationStatus: async (params) => {
      return await updateLeadAiStatusMutation.mutateAsync({ leadId: params.leadId, enabled: params.aiEnabled });
    },
  });

  // Efeito para selecionar a primeira clínica no modo admin
  useEffect(() => {
    if (isAdmin && !adminClinicaSelecionada && clinicas.length > 0) {
      setAdminClinicaSelecionada(clinicas[0]);
    }
  }, [isAdmin, adminClinicaSelecionada, clinicas]);

  // Efeito para buscar a última mensagem de cada conversa na lista
  useEffect(() => {
    const fetchLastMessages = async () => {
      const lastMessagesMap: Record<string, string> = {};
      for (const lead of leads) {
        const lastMsg = await buscarUltimaMensagem(lead.id);
        if (lastMsg) {
          if (lastMsg.tipo === 'text') {
            lastMessagesMap[lead.id] = lastMsg.conteudo ?? '...';
          } else {
            lastMessagesMap[lead.id] = `Mídia (${lastMsg.tipo})`;
          }
        } else {
          lastMessagesMap[lead.id] = 'Nenhuma mensagem ainda.';
        }
      }
      setUltimasMensagens(lastMessagesMap);
    };

    if (leads.length > 0) {
      fetchLastMessages();
    }
  }, [leads, buscarUltimaMensagem, conversas]); // Depende das conversas para re-executar

  // Função para lidar com upload de arquivo e envio da mensagem
  const handleFileUploadAndSend = async (file: File) => {
    if (!selectedConversation) return;

    setIsUploadingMedia(true);
    setUploadError(null);

    try {
      const mediaUrl = await uploadMedia(file);
      if (mediaUrl) {
        const fileType = file.type.split('/')[0]; // "image", "audio", "video"
        let messageType = 'documento';
        if (fileType === 'image') messageType = 'imagem';
        if (fileType === 'audio') messageType = 'audio';

        await handleSendMessage({
          type: messageType,
          content: file.name, // ou algum outro texto relevante
          mediaUrl: mediaUrl,
          aiEnabled: aiEnabled
        });
      }
    } catch (error: any) {
      console.error("Erro no upload do arquivo:", error);
      setUploadError(error.message || "Falha no upload do arquivo.");
      toast.error("Erro no upload", { description: error.message });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Função para enviar a mensagem
  const handleSendMessage = useCallback(async ({ type, content, mediaUrl, aiEnabled: currentAiStatus }: { type: string; content: string; mediaUrl?: string, aiEnabled: boolean }) => {
    if (!selectedLead || (!content.trim() && !mediaUrl)) return;

    setSendingMessage(true);
    const tempMessageId = `temp-${Date.now()}`;
    const targetClinicaId = isAdmin && adminClinicaSelecionada ? adminClinicaSelecionada.id : clinicaId;
    
    if (!targetClinicaId) {
        toast.error("Erro: ID da clínica não encontrado.");
        setSendingMessage(false);
        return;
    }

    const messageData = {
      lead_id: selectedLead.id,
      clinica_id: targetClinicaId,
      enviado_por: 'usuario',
      tipo: type,
      conteudo: content,
      anexo_url: mediaUrl,
      created_at: new Date().toISOString(),
      id: tempMessageId,
      lido: true,
    };
    
    // Otimisticamente adiciona a mensagem à UI
    // Esta parte será gerenciada pelo hook useAdminChatMessages ou pela lógica do useSupabaseData

    try {
      await enviarWebhook({
        lead: selectedLead,
        mensagem: content,
        tipo: type,
        mediaUrl: mediaUrl,
        remetente: 'user',
        clinicaId: targetClinicaId,
        ai_enabled: currentAiStatus
      });
      setMessageInput('');
      setUploadError(null);
    } catch (error) {
      toast.error('Falha ao enviar mensagem.');
      console.error('Erro ao enviar mensagem:', error);
      // Aqui você poderia adicionar uma lógica para remover a mensagem otimista em caso de falha
    } finally {
      setSendingMessage(false);
    }
  }, [selectedLead, clinicaId, isAdmin, adminClinicaSelecionada, enviarWebhook]);

  // Filtra as conversas com base no termo de pesquisa
  const filteredConversations = useMemo(() => {
    return leads.filter(lead =>
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm)
    );
  }, [leads, searchTerm]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Coluna da Esquerda: Lista de Conversas */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Conversas</h2>
          {isAdmin && (
            <Select onValueChange={(value) => setAdminClinicaSelecionada(clinicas.find(c => c.id === value) || null)} value={adminClinicaSelecionada?.id}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Selecione uma clínica" />
              </SelectTrigger>
              <SelectContent>
                {clinicas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input placeholder="Pesquisar..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(lead => (
            <div
              key={lead.id}
              className={`p-4 flex items-center cursor-pointer border-l-4 ${selectedConversation === lead.id ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:bg-gray-50'}`}
              onClick={() => setSelectedConversation(lead.id)}
            >
              <Avatar>
                <AvatarImage src={lead.avatar_url} />
                <AvatarFallback>{lead.nome?.charAt(0) || 'L'}</AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold truncate">{lead.nome}</h3>
                  {lead.nao_lido > 0 && <Badge className="bg-blue-500 text-white">{lead.nao_lido}</Badge>}
                </div>
                <p className="text-sm text-gray-500 truncate">{ultimasMensagens[lead.id]}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setIsAddContactModalOpen(true)}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Adicionar Contato
          </Button>
        </div>
      </div>

      {/* Área Central: Janela de Chat e Input */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedLead ? (
          <>
            {/* Header da Conversa */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src={selectedLead.avatar_url} />
                  <AvatarFallback>{selectedLead.nome?.charAt(0) || 'L'}</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h3 className="font-bold">{selectedLead.nome}</h3>
                  <p className="text-sm text-gray-500">{formatPhoneNumber(selectedLead.telefone)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsAgendamentoModalOpen(true)}>
                                <Calendar className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Agendar Consulta</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={() => setIsHistoricoModalOpen(true)}>
                                <Clock className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver Histórico</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/*
             * =================================================================
             * ✨ CORREÇÃO DE LAYOUT APLICADA AQUI ✨
             * =================================================================
             * Este contêiner agora usa flexbox em coluna ('flex', 'flex-col') e 
             * 'overflow-hidden' para garantir que os filhos controlem sua própria rolagem.
             */
            }
            <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
              {/* A ChatWindow agora tem 'flex-1' e 'overflow-y-auto' internamente,
                permitindo que ela cresça e tenha sua própria barra de rolagem.
              */}
              <ChatWindow leadId={selectedConversation} />
              
              {/* O Input de Mensagem fica fixo na parte inferior, pois não tem 'flex-1'.
                A propriedade 'flex-shrink-0' garante que ele não encolha.
              */}
              <div className="border-t border-gray-200 bg-white flex-shrink-0">
                {uploadError && (
                  <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-center">
                    <p className="text-sm text-red-600">Erro no upload: {uploadError}</p>
                  </div>
                )}
                <MessageInput
                  value={messageInput}
                  onChange={setMessageInput}
                  onSend={() => handleSendMessage({ type: 'text', content: messageInput, aiEnabled: aiEnabled })}
                  onFileSelect={handleFileUploadAndSend}
                  loading={sendingMessage || isUploadingMedia}
                  respostasProntas={respostasProntas}
                  aiEnabled={aiEnabled}
                  onToggleAI={toggleAI}
                  isAIInitializing={isInitializing || isUpdating}
                  leadId={selectedConversation}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Selecione uma conversa</h3>
              <p className="mt-1 text-sm text-gray-500">Escolha uma conversa na lista para começar a conversar.</p>
            </div>
          </div>
        )}
      </div>

      {/* Coluna da Direita: Informações do Lead (Sidebar) */}
      {selectedLead && (
        <LeadInfoSidebar lead={selectedLead} onClose={() => setSelectedConversation(null)} />
      )}

      {/* Modais da aplicação */}
      {isAgendamentoModalOpen && selectedLead && (
        <AgendamentoModal lead={selectedLead} onClose={() => setIsAgendamentoModalOpen(false)} />
      )}
      {isHistoricoModalOpen && selectedLead && (
        <HistoricoModal leadId={selectedLead.id} onClose={() => setIsHistoricoModalOpen(false)} />
      )}
      {isAddContactModalOpen && (
        <AddContactModal 
            onClose={() => setIsAddContactModalOpen(false)} 
            onContactAdd={(newLead) => {
              const targetClinicaId = isAdmin && adminClinicaSelecionada ? adminClinicaSelecionada.id : clinicaId;
              if (!targetClinicaId) {
                  toast.error("Selecione uma clínica para adicionar o contato.");
                  return;
              }
              createLeadMutation.mutate({...newLead, clinica_id: targetClinicaId}, {
                onSuccess: (data) => {
                  toast.success("Contato adicionado com sucesso!");
                  setSelectedConversation(data.id);
                  setIsAddContactModalOpen(false);
                },
                onError: (error) => {
                  toast.error(`Erro ao adicionar contato: ${error.message}`);
                }
              });
            }}
        />
      )}
    </div>
  );
};

// Funções utilitárias que estavam no seu arquivo original
const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'Telefone desconhecido';
  // Formata para (XX) XXXXX-XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

const getOrigemIcon = (origem: string | null | undefined) => {
  if (!origem) return <MessageSquare className="w-4 h-4 text-gray-500" />;
  const lowerOrigem = origem.toLowerCase();
  if (lowerOrigem.includes('instagram')) {
    return <Instagram className="w-4 h-4 text-pink-500" />;
  }
  // Adicione outros ícones conforme necessário
  return <MessageSquare className="w-4 h-4 text-gray-500" />;
};