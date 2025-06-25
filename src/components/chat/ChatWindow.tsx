// src/components/chat/ChatWindow.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday, isSameWeek, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, FileText, Headphones, Image as ImageIcon, Shield } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAdminChatMessages } from '@/hooks/useAdminChatMessages';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/**
 * 💬 Componente de Janela de Chat
 * * 📋 FUNCIONALIDADES:
 * - Exibe histórico de mensagens entre usuário e lead
 * - Suporta diferentes tipos de mídia (texto, imagem, áudio)
 * - Adapta-se automaticamente para modo admin
 * - Gerencia scroll inteligente para novas mensagens
 * * 🔄 FLUXO DE SCROLL CORRIGIDO:
 * - Carregamento direto no final (sem animação visível)
 * - Liberdade total para scroll up/down
 * - Scroll suave apenas para novas mensagens
 */

interface ChatWindowProps {
  leadId: string | null;
}

export const ChatWindow = ({ leadId }: ChatWindowProps) => {
  // Referências para os elementos do DOM para controlar o scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Estados para gerenciar as mensagens e o comportamento do scroll
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Hooks para buscar dados do Supabase
  const normalChatData = useSupabaseData();
  const { isAdmin } = useAdminCheck();
  
  const adminChatMessages = useAdminChatMessages(
    isAdmin ? leadId : null,
    isAdmin ? normalChatData.leads.find(l => l.id === leadId)?.clinica_id : null
  );

  // Determina quais dados usar (admin ou normal)
  const shouldUseAdminMode = isAdmin && leadId;
  const messages = shouldUseAdminMode ? adminChatMessages.messages || [] : localMessages || [];
  const isLoading = shouldUseAdminMode ? adminChatMessages.loading : isLoadingMessages;

  /**
   * Formata a data para ser exibida como um separador na conversa.
   * Ex: "Hoje", "Ontem", "Terça-feira", "25/06/2024"
   */
  const getDateSeparatorText = (date: Date): string => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    if (isSameWeek(date, new Date(), { weekStartsOn: 1 }) && date >= weekStart) {
      return format(date, 'EEEE', { locale: ptBR });
    }
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  /**
   * Agrupa as mensagens por dia e insere separadores de data.
   */
  const getMessagesWithDateSeparators = (messages: any[]) => {
    if (!messages || messages.length === 0) return [];

    const messagesWithSeparators: any[] = [];
    let lastDate: string | null = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at);
      const currentDateString = format(messageDate, 'yyyy-MM-dd');

      if (lastDate !== currentDateString) {
        messagesWithSeparators.push({
          type: 'date-separator',
          id: `separator-${currentDateString}`,
          dateText: getDateSeparatorText(messageDate),
        });
        lastDate = currentDateString;
      }

      messagesWithSeparators.push({ ...message, type: 'message' });
    });

    return messagesWithSeparators;
  };

  /**
   * Busca as mensagens de um lead para usuários normais.
   */
  const fetchNormalMessages = useCallback(async () => {
    if (!leadId || shouldUseAdminMode) return;
    
    setIsLoadingMessages(true);
    try {
      const mensagens = await normalChatData.buscarMensagensLead(leadId);
      setLocalMessages(mensagens || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setLocalMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [leadId, shouldUseAdminMode, normalChatData.buscarMensagensLead]);

  // Carrega as mensagens quando o lead selecionado muda.
  useEffect(() => {
    if (!shouldUseAdminMode && leadId) {
      setHasScrolledToBottom(false);
      fetchNormalMessages();
    } else if (!leadId) {
      setLocalMessages([]);
      setHasScrolledToBottom(false);
    }
  }, [fetchNormalMessages, leadId]);

  // Marca as mensagens como lidas quando a conversa é aberta.
  useEffect(() => {
    if (leadId && !shouldUseAdminMode) {
      normalChatData.marcarMensagensComoLidas(leadId);
    }
  }, [leadId, normalChatData, shouldUseAdminMode]);

  /**
   * Função para rolar a janela de chat para o final.
   * @param instant - Se true, rola instantaneamente, senão, rola suavemente.
   */
  const scrollToBottom = useCallback((instant = false) => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      if (instant) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, []);

  /**
   * Efeito para gerenciar a rolagem automática.
   * Rola para o final na primeira carga e para novas mensagens.
   */
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      if (!hasScrolledToBottom) {
        // Na primeira carga, rola instantaneamente para o final.
        setTimeout(() => {
          scrollToBottom(true);
          setHasScrolledToBottom(true);
        }, 50);
      } else if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
        // Para novas mensagens, só rola se o usuário já estiver perto do final.
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(false), 100);
        }
      }
    }
  }, [messages.length, isLoading, hasScrolledToBottom, scrollToBottom]);

  // Reseta o estado do scroll quando o lead muda.
  useEffect(() => {
    if (leadId) {
      setHasScrolledToBottom(false);
    }
  }, [leadId]);

  /**
   * Formata a hora da mensagem para exibição.
   */
  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  /**
   * Renderiza o conteúdo da mensagem (texto, imagem, áudio, etc.).
   */
  const renderMessageContent = (mensagem: any) => {
    const { tipo, conteudo, anexo_url } = mensagem;
    // ... (código de renderização de mídia, sem alterações)
  };

  if (!leadId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Selecione uma conversa para começar.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const messagesWithSeparators = getMessagesWithDateSeparators(messages);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {shouldUseAdminMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Visualizando como administrador
        </div>
      )}
      
      {/* Container das mensagens com a barra de rolagem */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesWithSeparators.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma mensagem ainda.</p>
          </div>
        ) : (
          messagesWithSeparators.map((item) => 
            item.type === 'date-separator' ? (
              <div key={item.id} className="flex justify-center my-6">
                <span className="bg-white border rounded-full px-3 py-1 text-xs text-gray-600">
                  {item.dateText}
                </span>
              </div>
            ) : (
              <div
                key={item.id}
                className={`flex ${item.enviado_por === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    item.enviado_por === 'usuario' ? 'bg-blue-600 text-white' : 'bg-white border'
                  }`}
                >
                  {renderMessageContent(item)}
                  <div className={`text-xs mt-1 ${item.enviado_por === 'usuario' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatMessageTime(item.created_at)}
                  </div>
                </div>
              </div>
            )
          )
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};