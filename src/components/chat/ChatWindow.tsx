
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
 * 
 * 📋 FUNCIONALIDADES:
 * - Exibe histórico de mensagens entre usuário e lead
 * - Suporta diferentes tipos de mídia (texto, imagem, áudio)
 * - Adapta-se automaticamente para modo admin
 * - Gerencia scroll inteligente para novas mensagens
 * - Exibe separadores de data para organizar conversas
 * 
 * 🔄 FLUXO DE SCROLL CORRIGIDO:
 * - Carregamento direto no final (sem animação visível)
 * - Liberdade total para scroll up/down
 * - Scroll suave apenas para novas mensagens
 */

interface ChatWindowProps {
  leadId: string | null;
}

export const ChatWindow = ({ leadId }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasScrolledInitially, setHasScrolledInitially] = useState(false);

  const normalChatData = useSupabaseData();
  const { isAdmin } = useAdminCheck();
  
  const adminChatMessages = useAdminChatMessages(
    isAdmin ? leadId : null,
    isAdmin ? normalChatData.leads.find(l => l.id === leadId)?.clinica_id : null
  );

  const shouldUseAdminMode = isAdmin && leadId;
  const messages = shouldUseAdminMode ? adminChatMessages.messages || [] : localMessages || [];
  const isLoading = shouldUseAdminMode ? adminChatMessages.loading : isLoadingMessages;

  const getDateSeparatorText = (date: Date): string => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    if (isSameWeek(date, new Date(), { weekStartsOn: 1 }) && date >= weekStart) {
      return format(date, 'EEEE', { locale: ptBR });
    }
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

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

  const fetchNormalMessages = useCallback(async () => {
    if (!leadId || shouldUseAdminMode) return;
    setIsLoadingMessages(true);
    try {
      const mensagens = await normalChatData.buscarMensagensLead(leadId);
      setLocalMessages(mensagens || []);
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [leadId, shouldUseAdminMode, normalChatData]);

  useEffect(() => {
    if (leadId) {
      setHasScrolledInitially(false); // Resetar a flag de scroll ao mudar de lead
      if (!shouldUseAdminMode) {
        fetchNormalMessages();
      }
    } else {
      setLocalMessages([]);
    }
  }, [leadId, shouldUseAdminMode, fetchNormalMessages]);

  useEffect(() => {
    if (leadId && !shouldUseAdminMode) {
      normalChatData.marcarMensagensComoLidas(leadId);
    }
  }, [leadId, messages.length, shouldUseAdminMode, normalChatData]);

  // ✅ CORREÇÃO 1: ROLAGEM INICIAL INVISÍVEL
  // useLayoutEffect é executado antes da tela ser pintada,
  // garantindo que o usuário não veja a animação de rolagem.
  useLayoutEffect(() => {
    if (!isLoading && messages.length > 0 && !hasScrolledInitially) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        setHasScrolledInitially(true);
      }
    }
  }, [isLoading, messages.length, hasScrolledInitially]);

  // ✅ CORREÇÃO 2: ROLAGEM PARA NOVAS MENSAGENS (NÃO INTERROMPE O USUÁRIO)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && hasScrolledInitially) {
      const container = messagesContainerRef.current;
      if (container) {
        // Rola para baixo apenas se o usuário já estiver no final da conversa.
        const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }
  }, [messages.length]); // Depende apenas do tamanho das mensagens para novas mensagens

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  const renderMessageContent = (mensagem: any) => {
    // ... (código de renderização de mensagem permanece o mesmo)
    const { tipo, conteudo, anexo_url } = mensagem;
    switch (tipo) {
      case 'imagem':
        return (
          <div className="space-y-2">
            {anexo_url && (
              <a href={anexo_url} target="_blank" rel="noopener noreferrer">
                <img src={anexo_url} alt={conteudo || 'Imagem enviada'} className="rounded-lg max-w-xs cursor-pointer" />
              </a>
            )}
            {conteudo && conteudo !== 'Imagem enviada' && <p className="text-sm">{conteudo}</p>}
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-2">
            {anexo_url && (
              <audio controls className="w-full max-w-xs"><source src={anexo_url} /></audio>
            )}
            {conteudo && conteudo !== 'Áudio enviado' && <p className="text-sm">{conteudo}</p>}
          </div>
        );
      case 'arquivo':
        return (
          <a href={anexo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg max-w-xs cursor-pointer hover:bg-gray-200">
            <FileText className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium">{conteudo || 'Arquivo'}</p>
          </a>
        );
      default:
        return <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{conteudo}</p>;
    }
  };

  if (!leadId) {
    return <div className="flex-1 flex items-center justify-center bg-gray-50"><p>Selecione uma conversa</p></div>;
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const messagesWithSeparators = getMessagesWithDateSeparators(messages);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {shouldUseAdminMode && (
        <div className="bg-blue-50 border-b p-2 text-center text-sm text-blue-700 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" /> Visualizando como administrador
        </div>
      )}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-2">
        {messagesWithSeparators.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Nenhuma mensagem.</div>
        ) : (
          messagesWithSeparators.map((item) => {
            if (item.type === 'date-separator') {
              return (
                <div key={item.id} className="flex justify-center my-4">
                  <div className="bg-white border rounded-full px-3 py-1 text-xs text-gray-600">{item.dateText}</div>
                </div>
              );
            }
            return (
              <div key={item.id} className={`flex items-end gap-3 ${item.enviado_por === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-lg ${item.enviado_por === 'usuario' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>
                  {renderMessageContent(item)}
                  <div className={`text-xs mt-1 text-right ${item.enviado_por === 'usuario' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatMessageTime(item.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );