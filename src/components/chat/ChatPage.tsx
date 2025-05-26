
import { useState, useEffect } from 'react';
import { Search, Phone, Video, MessageSquare } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { ChatWindow } from './ChatWindow';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWebhook } from '@/hooks/useWebhook';

/**
 * Página de Chat - Interface similar ao WhatsApp Web com persistência
 * 
 * Funcionalidades:
 * - Lista de conversas na lateral esquerda
 * - Área de mensagens na direita com persistência no Supabase
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
    enviarMensagem,
    respostasProntas,
    tags,
    loading
  } = useSupabaseData();

  const { enviarWebhook } = useWebhook();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedLeadId || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Atualizar conversa selecionada quando selectedLeadId mudar
  useEffect(() => {
    if (selectedLeadId) {
      setSelectedConversation(selectedLeadId);
    }
  }, [selectedLeadId]);

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
      
      // Limpar input
      setMessageInput('');

      // Enviar webhook de forma assíncrona (não bloqueia a interface)
      const leadSelecionado = leads.find(l => l.id === selectedConversation);
      if (leadSelecionado?.clinica_id && novaMensagemRaw.enviado_por === 'usuario') {
        enviarWebhook(
          novaMensagemRaw.id,
          novaMensagemRaw.lead_id,
          leadSelecionado.clinica_id,
          novaMensagemRaw.conteudo,
          novaMensagemRaw.tipo || 'texto',
          novaMensagemRaw.created_at,
          aiEnabled || false
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
    return 'Clique para ver a conversa...';
  };

  const selectedLead = leads.find(l => l.id === selectedConversation);

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
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header da lista */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
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

        {/* Lista de conversas com rolagem própria */}
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(lead.updated_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {getLastMessage(lead.id)}
                    </p>
                    
                    {lead.telefone && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
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

      {/* Área de mensagens - Centro (agora ocupa todo o espaço restante) */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedLead ? (
          <>
            {/* Header da conversa */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">
                    {selectedLead.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {selectedLead.nome}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedLead.telefone}
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 flex-shrink-0">
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Phone size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Video size={20} />
                </button>
              </div>
            </div>

            {/* Área de mensagens com rolagem própria */}
            <div className="flex-1 bg-gray-50 overflow-hidden">
              <ChatWindow leadId={selectedConversation} />
            </div>

            {/* Input de nova mensagem fixo na parte inferior */}
            <div className="border-t border-gray-200 bg-white flex-shrink-0">
              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                loading={sendingMessage}
                respostasProntas={respostasProntas}
              />
            </div>
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
    </div>
  );
};
