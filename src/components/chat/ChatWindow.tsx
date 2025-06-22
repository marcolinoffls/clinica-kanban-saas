
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Phone, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseChat } from '@/hooks/useSupabaseChat';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { formatDistanceToNow, format, isToday, isYesterday, isSameWeek, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Componente da janela de chat
 * 
 * Exibe a conversa com um lead específico, permitindo:
 * - Visualizar histórico de mensagens com indicadores de data
 * - Enviar novas mensagens
 * - Fazer upload de arquivos
 * - Agendar consultas
 * - Fazer ligações
 * 
 * Funcionalidades:
 * - Indicadores de data estilo WhatsApp (Hoje, Ontem, dia da semana, data completa)
 * - Scroll automático para novas mensagens
 * - Interface responsiva
 */

interface ChatWindowProps {
  leadId: string | null;
  onScheduleConsult?: (leadId: string) => void;
  onMakeCall?: (leadId: string) => void;
}

// Função para formatar a data das mensagens estilo WhatsApp
const formatMessageDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Hoje';
  } else if (isYesterday(date)) {
    return 'Ontem';
  } else if (isSameWeek(date, new Date(), { weekStartsOn: 1 })) {
    // Se for na mesma semana, mostrar dia da semana
    return format(date, 'EEEE', { locale: ptBR });
  } else {
    // Para datas anteriores, mostrar data completa
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  }
};

// Função para verificar se deve mostrar o separador de data
const shouldShowDateSeparator = (currentMessage: any, previousMessage: any): boolean => {
  if (!previousMessage) return true;
  
  const currentDate = new Date(currentMessage.created_at);
  const previousDate = new Date(previousMessage.created_at);
  
  // Mostrar separador se as mensagens forem de dias diferentes
  return !isToday(currentDate) || 
         currentDate.getDate() !== previousDate.getDate() ||
         currentDate.getMonth() !== previousDate.getMonth() ||
         currentDate.getFullYear() !== previousDate.getFullYear();
};

const ChatWindow = ({ leadId, onScheduleConsult, onMakeCall }: ChatWindowProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [lead, setLead] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks do Supabase
  const chatHook = useSupabaseChat();
  const { leads } = useSupabaseData();

  // Buscar lead específico
  useEffect(() => {
    if (leadId && leads.length > 0) {
      const foundLead = leads.find(l => l.id === leadId);
      setLead(foundLead || null);
    }
  }, [leadId, leads]);

  // Buscar mensagens do lead
  useEffect(() => {
    const fetchMessages = async () => {
      if (leadId && chatHook.buscarMensagensLead) {
        try {
          const leadMessages = await chatHook.buscarMensagensLead(leadId);
          setMessages(leadMessages || []);
        } catch (error) {
          console.error('Erro ao buscar mensagens:', error);
          setMessages([]);
        }
      }
    };

    fetchMessages();
  }, [leadId, chatHook.buscarMensagensLead]);

  // Scroll para o final quando novas mensagens chegarem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Marcar mensagens como lidas quando o chat for aberto
  useEffect(() => {
    if (leadId && messages.length > 0 && chatHook.marcarMensagensComoLidas) {
      chatHook.marcarMensagensComoLidas(leadId);
    }
  }, [leadId, messages.length, chatHook.marcarMensagensComoLidas]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !leadId || !chatHook.enviarMensagem) return;

    try {
      await chatHook.enviarMensagem(leadId, inputMessage.trim(), 'texto');
      setInputMessage('');
      
      // Recarregar mensagens após envio
      const updatedMessages = await chatHook.buscarMensagensLead(leadId);
      setMessages(updatedMessages || []);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !leadId || !chatHook.enviarMensagem) return;

    setIsUploading(true);
    try {
      // Por enquanto, apenas enviar o nome do arquivo como mensagem
      await chatHook.enviarMensagem(leadId, `Arquivo: ${file.name}`, 'arquivo');
      
      // Recarregar mensagens após envio
      const updatedMessages = await chatHook.buscarMensagensLead(leadId);
      setMessages(updatedMessages || []);
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatMessageTime = (date: string) => {
    return format(new Date(date), 'HH:mm');
  };

  const getMessageAlignment = (sender: string) => {
    return sender === 'usuario' ? 'flex-row-reverse' : 'flex-row';
  };

  const getMessageBubbleStyle = (sender: string) => {
    return sender === 'usuario'
      ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
      : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg';
  };

  if (!leadId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecione um contato
          </h3>
          <p className="text-gray-500">
            Escolha um contato da lista para iniciar uma conversa
          </p>
        </div>
      </div>
    );
  }

  if (!chatHook.isChatDataReady) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header do Chat */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {lead?.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {lead?.nome || 'Lead sem nome'}
            </h3>
            <p className="text-sm text-gray-500">
              {lead?.telefone || 'Sem telefone'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onMakeCall && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMakeCall(leadId)}
              className="text-green-600 hover:text-green-700"
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}
          {onScheduleConsult && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onScheduleConsult(leadId)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Calendar className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => {
          const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);
          
          return (
            <div key={message.id}>
              {/* Separador de data */}
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                    {formatMessageDate(new Date(message.created_at))}
                  </div>
                </div>
              )}
              
              {/* Mensagem */}
              <div className={`flex ${getMessageAlignment(message.enviado_por)} mb-2`}>
                <div className={`max-w-xs px-4 py-2 ${getMessageBubbleStyle(message.enviado_por)}`}>
                  <p className="text-sm">{message.conteudo}</p>
                  <div className="flex items-center justify-end mt-1 space-x-1">
                    <Clock className="w-3 h-3 opacity-50" />
                    <span className="text-xs opacity-75">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Indicador de status de conexão */}
        {!chatHook.isChatDataReady && (
          <div className="flex justify-center">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs">
              Reconectando...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={isUploading}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isUploading}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isUploading && (
          <div className="mt-2 text-sm text-gray-500">
            Enviando arquivo...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
