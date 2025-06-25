import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { format, isToday, isYesterday, isSameWeek, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, FileText, Headphones, Image as ImageIcon, Shield } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAdminChatMessages } from '@/hooks/useAdminChatMessages';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Badge } from '@/components/ui/badge';

/**
 * 💬 Componente de Janela de Chat
 * 
 * 🔄 CORREÇÃO DE LOOP INFINITO:
 * - Otimizado o uso de hooks (useEffect, useCallback) para depender de funções
 *   específicas e valores primitivos, em vez de objetos inteiros. Isso elimina
 *   o loop de re-renderização que causava o travamento e o excesso de logs.
 * 
 * 🔄 FLUXO DE SCROLL CORRIGIDO:
 * - Carregamento direto no final (sem animação visível) usando useLayoutEffect.
 * - Liberdade total para o usuário rolar para cima e ler o histórico.
 * - Scroll suave para novas mensagens apenas se o usuário já estiver no final.
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

  // ✅ CORREÇÃO: Desestruturar apenas as funções e dados necessários para evitar o loop.
  const { leads, buscarMensagensLead, marcarMensagensComoLidas } = useSupabaseData();
  const { isAdmin } = useAdminCheck();
  
  const adminChatMessages = useAdminChatMessages(
    isAdmin ? leadId : null,
    isAdmin ? leads.find(l => l.id === leadId)?.clinica_id : null
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

  // ✅ CORREÇÃO: O useCallback agora depende da função `buscarMensagensLead` estável.
  const fetchNormalMessages = useCallback(async () => {
    if (!leadId || shouldUseAdminMode) return;
    setIsLoadingMessages(true);
    try {
      const mensagens = await buscarMensagensLead(leadId);
      setLocalMessages(mensagens || []);
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [leadId, shouldUseAdminMode, buscarMensagensLead]);

  // Efeito para buscar mensagens ou limpar o estado quando o leadId muda
  useEffect(() => {
    if (leadId) {
      setHasScrolledInitially(false);
      if (!shouldUseAdminMode) {
        fetchNormalMessages();
      }
    } else {
      setLocalMessages([]);
    }
  }, [leadId, shouldUseAdminMode, fetchNormalMessages]);

  // ✅ CORREÇÃO: O useEffect agora depende da função `marcarMensagensComoLidas` estável.
  useEffect(() => {
    if (leadId && !shouldUseAdminMode) {
      marcarMensagensComoLidas(leadId);
    }
  }, [leadId, messages.length, shouldUseAdminMode, marcarMensagensComoLidas]);

  // Rolagem inicial invisível para o final da conversa.
  useLayoutEffect(() => {
    if (!isLoading && messages.length > 0 && !hasScrolledInitially) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        setHasScrolledInitially(true);
      }
    }
  }, [isLoading, messages.length, hasScrolledInitially]);

  // Rolagem suave para novas mensagens, sem interromper o usuário.
  useEffect(() => {
    if (!isLoading && messages.length > 0 && hasScrolledInitially) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }
  }, [messages.length, hasScrolledInitially]);

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  const renderMessageContent = (mensagem: any) => {
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
    return <div className="flex-1 flex items-center justify-center bg-gray-50"><p>Selecione uma conversa para começar</p></div>;
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  const messagesWithSeparators = getMessagesWithDateSeparators(messages);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {shouldUseAdminMode && (
        <div className="bg-blue-50 border-b p-2 text-center text-sm text-blue-700 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" /> Visualizando como administrador
        </div>
      )}
      <div ref={messagesContainerRef} className="flex-