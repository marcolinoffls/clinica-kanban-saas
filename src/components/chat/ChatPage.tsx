
import { useState } from 'react';
import { Search, Send, Phone, Video } from 'lucide-react';

/**
 * Página de Chat - Interface similar ao WhatsApp Web
 * 
 * Funcionalidades:
 * - Lista de conversas na lateral esquerda
 * - Área de mensagens na direita
 * - Envio de mensagens em tempo real
 * - Busca de conversas
 * - Histórico de mensagens
 * 
 * Em produção, deve integrar com WebSocket para tempo real
 * e Supabase para persistência das mensagens.
 */

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'sent' | 'received';
}

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  avatar: string;
}

export const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados de conversas
  const conversations: Conversation[] = [
    {
      id: '1',
      contactName: 'Maria Silva',
      contactPhone: '(11) 99999-9999',
      lastMessage: 'Oi, gostaria de saber sobre implantes',
      lastMessageTime: new Date('2024-01-15T14:30:00'),
      unreadCount: 2,
      avatar: 'MS'
    },
    {
      id: '2',
      contactName: 'João Santos',
      contactPhone: '(11) 88888-8888',
      lastMessage: 'Obrigado pelo atendimento!',
      lastMessageTime: new Date('2024-01-15T13:45:00'),
      unreadCount: 0,
      avatar: 'JS'
    },
    {
      id: '3',
      contactName: 'Ana Costa',
      contactPhone: '(11) 77777-7777',
      lastMessage: 'Preciso remarcar minha consulta',
      lastMessageTime: new Date('2024-01-15T12:20:00'),
      unreadCount: 1,
      avatar: 'AC'
    }
  ];

  // Dados mockados de mensagens para a conversa selecionada
  const messages: Message[] = [
    {
      id: '1',
      senderId: 'maria',
      content: 'Oi, gostaria de saber sobre implantes',
      timestamp: new Date('2024-01-15T14:25:00'),
      type: 'received'
    },
    {
      id: '2',
      senderId: 'clinic',
      content: 'Olá Maria! Claro, vou te explicar sobre nossos tratamentos de implante.',
      timestamp: new Date('2024-01-15T14:26:00'),
      type: 'sent'
    },
    {
      id: '3',
      senderId: 'maria',
      content: 'Qual seria o valor aproximado?',
      timestamp: new Date('2024-01-15T14:30:00'),
      type: 'received'
    }
  ];

  // Filtra conversas baseado na busca
  const filteredConversations = conversations.filter(conv =>
    conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contactPhone.includes(searchTerm)
  );

  // Função para enviar mensagem
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // Aqui seria feita a integração com WebSocket/Supabase
    console.log('Enviando mensagem:', messageInput);
    setMessageInput('');
  };

  // Função para formatar horário
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-full flex">
      {/* Lista de conversas - Lateral esquerda */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
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
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {conversation.avatar}
                  </span>
                </div>

                {/* Informações da conversa */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900 truncate">
                      {conversation.contactName}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {conversation.lastMessage}
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {conversation.contactPhone}
                  </p>
                </div>

                {/* Badge de mensagens não lidas */}
                {conversation.unreadCount > 0 && (
                  <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de mensagens - Direita */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header da conversa */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {selectedConv.avatar}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConv.contactName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConv.contactPhone}
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
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'sent'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.type === 'sent' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input de nova mensagem */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
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
