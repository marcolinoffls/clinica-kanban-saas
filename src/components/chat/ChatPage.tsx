import { useState, useEffect } from 'react';
import { Search, Phone, Video, MessageSquare } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { ChatWindow } from './ChatWindow';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWebhook } from '@/hooks/useWebhook';
import { useClinicaData } from '@/hooks/useClinicaData';
import { useAIConversationControl } from '@/hooks/useAIConversationControl';
import { useUpdateLeadAiConversationStatus } from '@/hooks/useUpdateLeadAiConversationStatus';
// Importar componentes de Avatar do shadcn/ui
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead } from '@/hooks/useLeadsData'; // Importar a interface Lead

// Interface Message (se ainda não estiver em um arquivo de tipos compartilhado)
// interface Message {
//   id: string;
//   lead_id: string;
//   conteudo: string;
//   created_at: string;
//   enviado_por: 'lead' | 'usuario';
//   tipo: 'texto' | 'imagem' | 'arquivo' | 'audio';
//   lida: boolean;
// }

interface ChatPageProps {
  selectedLeadId?: string;
}

export const ChatPage = ({ selectedLeadId }: ChatPageProps) => {
  const { clinicaId: clinicaIdDireto, clinica: clinicaCompleta } = useClinicaData();

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
      // console.log('📖 Marcando mensagens como lidas para conversa selecionada:', selectedConversation);
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
      // console.error('❌ [ChatPage] clinica_id é nulo ou indefinido para validação');
      return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinicaId)) {
      // console.error('❌ [ChatPage] clinica_id não tem formato UUID válido:', clinicaId);
      return false;
    }
    return true;
  };

  const handleSendMessage = async (aiEnabledForMessage?: boolean) => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      // console.log(`💬 [ChatPage] Preparando envio de mensagem para lead ID: ${selectedConversation}`);

      const leadSelecionado = leads.find(l => l.id === selectedConversation);

      let clinicaIdParaWebhook: string | null = null;

      if (leadSelecionado?.clinica_id && validarClinicaId(leadSelecionado.clinica_id)) {
        clinicaIdParaWebhook = leadSelecionado.clinica_id;
      } else if (clinicaIdDireto && validarClinicaId(clinicaIdDireto)) {
        clinicaIdParaWebhook = clinicaIdDireto;
      } else if (clinicaCompleta?.id && validarClinicaId(clinicaCompleta.id)) {
        clinicaIdParaWebhook = clinicaCompleta.id;
      }

      if (!clinicaIdParaWebhook) {
        console.error('❌ [ChatPage] ERRO CRÍTICO: Não foi possível determinar um clinica_id válido para o webhook.');
        // Considerar lançar um erro ou mostrar um toast para o usuário aqui.
        // throw new Error('Não foi possível determinar a clínica para envio do webhook');
        setSendingMessage(false);
        return;
      }
      
      // console.log(`🚀 [ChatPage] clinica_id para webhook: ${clinicaIdParaWebhook}, IA ativa para msg: ${aiEnabledForMessage || false}`);

      const novaMensagemRaw = await enviarMensagem(selectedConversation, messageInput);
      // console.log(`✅ [ChatPage] Mensagem salva no Supabase: ${novaMensagemRaw.id}`);
      setMessageInput('');

      if (novaMensagemRaw.enviado_por === 'usuario') {
        // console.log(`🚀 [ChatPage] Enviando webhook para mensagem ID: ${novaMensagemRaw.id}`);
        await enviarWebhook(
          novaMensagemRaw.id,
          novaMensagemRaw.lead_id,
          clinicaIdParaWebhook,
          novaMensagemRaw.conteudo,
          novaMensagemRaw.tipo || 'texto',
          novaMensagemRaw.created_at,
          aiEnabledForMessage || false
        );
      } else {
        // console.log('ℹ️ [ChatPage] Webhook não enviado (mensagem não é do usuário)');
      }

    } catch (error: any) {
      console.error('❌ [ChatPage] Erro no envio da mensagem:', error.message);
      // Não logar error.stack em produção, apenas error.message.
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return ''; // Adicionar verificação para evitar erro com undefined/null
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Simples placeholder, idealmente buscaria a última mensagem real.
  const getLastMessage = (lead: Lead) => {
    // Se precisar exibir a última mensagem real, você precisaria buscar as mensagens
    // ou ter essa informação agregada no objeto `lead`.
    // Por enquanto, uma mensagem genérica.
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
                    {/* Avatar na lista de conversas */}
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
                          {/* Usar updated_at do lead se data_ultimo_contato não existir */}
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
                {/* Avatar no header da conversa */}
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
              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={() => handleSendMessage(aiEnabled)} // Passa o estado atual da IA para a mensagem
                loading={sendingMessage}
                respostasProntas={respostasProntas}
                aiEnabled={aiEnabled}
                onToggleAI={toggleAI}
                isAIInitializing={isInitializing || isUpdating}
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
          // A prop `lead` em LeadInfoSidebar já espera um objeto Lead, que agora inclui avatar_url
          lead={selectedLead}
          tags={tags.filter(tag => tag.id === selectedLead.tag_id)}
          historico={[]} // Placeholder, idealmente buscaria o histórico
          onCallLead={() => console.log('Ligar para lead:', selectedLead.id)}
          onScheduleAppointment={() => console.log('Agendar para lead:', selectedLead.id)}
          onEditLead={() => console.log('Editar lead:', selectedLead.id)}
        />
      )}
    </div>
  );
};