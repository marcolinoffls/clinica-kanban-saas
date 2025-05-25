
import { useState, useEffect } from 'react';
import { Search, Phone, Video, MessageSquare } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWebhook } from '@/hooks/useWebhook';

/**
 * Página de Chat - Interface similar ao WhatsApp Web com persistência
 * 
 * Funcionalidades:
 * - Lista de conversas na lateral esquerda
 * - Área de mensagens na direita com persistência no Supabase
 * - Barra lateral com informações detalhadas do lead
 * - Entrada de mensagem avançada com respostas prontas
 * - Busca de conversas
 * - Histórico de mensagens persistente
 * - Webhook automático para cada mensagem enviada (com estado da IA)
 * 
 * Integração com Supabase:
 * - Busca mensagens da tabela chat_mensagens
 * - Salva novas mensagens automaticamente
 * - Carrega respostas prontas da tabela respostas_prontas
 * - Sincroniza com dados dos leads
 * - Envia webhook para integração externa com informações da IA
 */

interface Message {
  id: string;
  lead_id: string;
  conteudo: string;
  created_at: string;
  enviado_por: 'lead' | 'usuario';
  tipo: 'texto' | 'imagem' | 'arquivo' | 'audio';
  lida: boolean;
}

interface ChatPageProps {
  selectedLeadId?: string;
}

export const ChatPage = ({ selectedLeadId }: ChatPageProps) => {
  const {
    leads,
    buscarMensagensLead,
    enviarMensagem,
    respostasProntas,
    tags,
    loading
  } = useSupabaseData();

  const { enviarWebhook } = useWebhook();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedLeadId || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showLeadInfo, setShowLeadInfo] = useState(true);

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (selectedConversation) {
      carregarMensagens(selectedConversation);
    }
  }, [selectedConversation]);

  // Função para carregar mensagens do banco
  const carregarMensagens = async (leadId: string) => {
    try {
      setLoadingMessages(true);
      const mensagensRaw = await buscarMensagensLead(leadId);
      
      // Converter e validar dados do banco para interface Message
      const mensagensFormatadas: Message[] = (mensagensRaw || []).map(msg => ({
        id: msg.id,
        lead_id: msg.lead_id,
        conteudo: msg.conteudo,
        created_at: msg.created_at,
        enviado_por: (msg.enviado_por === 'usuario' || msg.enviado_por === 'lead') 
          ? msg.enviado_por 
          : 'usuario', // fallback seguro
        tipo: (['texto', 'imagem', 'arquivo', 'audio'].includes(msg.tipo)) 
          ? msg.tipo as 'texto' | 'imagem' | 'arquivo' | 'audio'
          : 'texto', // fallback seguro
        lida: Boolean(msg.lida)
      }));
      
      setMessages(mensagensFormatadas);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]); // fallback para array vazio
    } finally {
      setLoadingMessages(false);
    }
  };

  // Filtrar leads baseado na busca
  const leadsComMensagens = leads.filter(lead =>
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.telefone?.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para enviar mensagem com webhook (incluindo estado da IA)
  const handleSendMessage = async (aiEnabled?: boolean) => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      const novaMensagemRaw = await enviarMensagem(selectedConversation, messageInput);
      
      // Converter resposta do banco para interface Message
      const novaMensagem: Message = {
        id: novaMensagemRaw.id,
        lead_id: novaMensagemRaw.lead_id,
        conteudo: novaMensagemRaw.conteudo,
        created_at: novaMensagemRaw.created_at,
        enviado_por: (novaMensagemRaw.enviado_por === 'usuario' || novaMensagemRaw.enviado_por === 'lead') 
          ? novaMensagemRaw.enviado_por 
          : 'usuario',
        tipo: (['texto', 'imagem', 'arquivo', 'audio'].includes(novaMensagemRaw.tipo)) 
          ? novaMensagemRaw.tipo as 'texto' | 'imagem' | 'arquivo' | 'audio'
          : 'texto',
        lida: Boolean(novaMensagemRaw.lida)
      };
      
      // Adicionar mensagem ao estado local
      setMessages(prev => [...prev, novaMensagem]);
      setMessageInput('');

      // Enviar webhook de forma assíncrona (não bloqueia a interface)
      // Incluindo o estado do botão IA no payload
      const leadSelecionado = leads.find(l => l.id === selectedConversation);
      if (leadSelecionado?.clinica_id && novaMensagemRaw.enviado_por === 'usuario') {
        enviarWebhook(
          novaMensagemRaw.id,
          novaMensagemRaw.lead_id,
          leadSelecionado.clinica_id,
          novaMensagemRaw.conteudo,
          novaMensagemRaw.tipo || 'texto',
          novaMensagemRaw.created_at,
          aiEnabled || false // Adicionar estado da IA ao webhook
        );
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Função para formatar horário
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getLastMessage = (leadId: string) => {
    return 'Clique para iniciar a conversa...';
  };

  const selectedLead = leads.find(l => l.id === selectedConversation);
  const leadTags = selectedLead ? tags.filter(tag => tag.id === selectedLead.tag_id) : [];

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
    <div className="h-full flex">
      {/* Lista de conversas - Lateral esquerda */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header da lista */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Conversas</h2>
          
          {/* Barra de busca */}
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

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {leadsComMensagens.length > 0 ? (
            leadsComMensagens.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedConversation(lead.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {lead.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Informações da conversa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900 truncate">
                        {lead.nome}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(lead.updated_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {getLastMessage(lead.id)}
                    </p>
                    
                    {lead.telefone && (
                      <p className="text-xs text-gray-500 mt-1">
                        {lead.telefone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare size={32} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de mensagens - Centro */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedLead ? (
          <>
            {/* Header da conversa */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {selectedLead.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedLead.nome}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedLead.telefone}
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Phone size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Video size={20} />
                </button>
                <button
                  onClick={() => setShowLeadInfo(!showLeadInfo)}
                  className={`p-2 rounded-lg ${
                    showLeadInfo
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-500">Carregando mensagens...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.enviado_por === 'usuario' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.enviado_por === 'usuario'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.conteudo}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.enviado_por === 'usuario' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare size={32} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma mensagem ainda. Inicie a conversa!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input de nova mensagem com estado da IA */}
            <MessageInput
              value={messageInput}
              onChange={setMessageInput}
              onSend={handleSendMessage} // Agora recebe o estado da IA
              loading={sendingMessage}
              respostasProntas={respostasProntas}
            />
          </>
        ) : (
          /* Estado vazio - nenhuma conversa selecionada */
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

      {/* Barra lateral com informações do lead - Tags integradas aqui */}
      {selectedLead && showLeadInfo && (
        <LeadInfoSidebar
          lead={selectedLead}
          tags={leadTags}
          historico={[]}
          onCallLead={() => console.log('Ligar para:', selectedLead.telefone)}
          onScheduleAppointment={() => console.log('Agendar consulta para:', selectedLead.nome)}
          onEditLead={() => console.log('Editar lead:', selectedLead.id)}
        />
      )}
    </div>
  );
};
