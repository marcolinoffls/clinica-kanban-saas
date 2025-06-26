import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { format, isToday, isYesterday, isSameWeek, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, FileText, Headphones, Shield, MessageSquare } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAdminChatMessages } from '@/hooks/useAdminChatMessages';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Badge } from '@/components/ui/badge';

/**
 * 💬 Componente de Janela de Chat
 * 
 * FUNCIONALIDADES:
 * - Exibe histórico de mensagens entre usuário e lead
 * - Suporta diferentes tipos de mídia (texto, imagem, áudio)
 * - Adapta-se automaticamente para modo admin
 * - Gerencia scroll inteligente para novas mensagens
 * - Exibe separadores de data para organizar conversas
 * 
 * FLUXO DE SCROLL:
 * - Carregamento direto no final (sem animação visível) usando useLayoutEffect
 * - Barra de rolagem sempre visível quando há conteúdo suficiente
 * - Liberdade total para scroll up/down sem interrupções
 * - Scroll suave apenas para novas mensagens se usuário estiver no final
 */

interface ChatWindowProps {
  leadId: string | null;
  adminMode?: boolean;
  targetClinicaId?: string;
}

export const ChatWindow = ({ leadId, adminMode, targetClinicaId }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Estado local para mensagens de usuários normais
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);

  // Hooks para dados
  const normalChatData = useSupabaseData();
  const { isAdmin } = useAdminCheck();

  // Hook admin para mensagens (apenas se for admin)
  const adminChatMessages = useAdminChatMessages(
    isAdmin ? leadId : null,
    isAdmin ? normalChatData.leads.find(l => l.id === leadId)?.clinica_id : null
  );

  // Determina se está em modo admin
  const shouldUseAdminMode = isAdmin && leadId;

  // Seleciona as mensagens corretas conforme o modo
  const messages = shouldUseAdminMode
    ? adminChatMessages.messages || []
    : localMessages || [];

  // Estado de loading
  const isLoading = shouldUseAdminMode
    ? adminChatMessages.loading
    : isLoadingMessages;

  // Busca mensagens para usuários normais
  useEffect(() => {
    if (!leadId || shouldUseAdminMode) {
      setLocalMessages([]);
      setHasInitialScrolled(false);
      return;
    }
    setIsLoadingMessages(true);
    setHasInitialScrolled(false);
    normalChatData.buscarMensagensLead(leadId)
      .then(mensagens => setLocalMessages(mensagens || []))
      .catch(() => setLocalMessages([]))
      .finally(() => setIsLoadingMessages(false));
  }, [leadId, shouldUseAdminMode]);

  // Marca mensagens como lidas
  useEffect(() => {
    if (leadId && !shouldUseAdminMode && messages.length > 0) {
      normalChatData.marcarMensagensComoLidas(leadId);
    }
  }, [leadId, shouldUseAdminMode, messages.length]);

  // Scroll direto para o final ao abrir o chat (sem animação)
  useLayoutEffect(() => {
    if (!isLoading && messages.length > 0 && !hasInitialScrolled) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        setHasInitialScrolled(true);
      }
    }
  }, [isLoading, messages.length, hasInitialScrolled]);

  // Scroll suave só para novas mensagens (se usuário já estava no final)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && hasInitialScrolled) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }
  }, [messages.length, hasInitialScrolled, isLoading]);

  // Função para gerar texto do separador de data
  const getDateSeparatorText = (date: Date): string => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    if (isSameWeek(date, new Date(), { weekStartsOn: 1 }) && date >= weekStart) {
      return format(date, 'EEEE', { locale: ptBR });
    }
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Função para inserir separadores de data nas mensagens
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

  // Formata o horário da mensagem
  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  // Renderiza o conteúdo da mensagem conforme o tipo
  const renderMessageContent = (mensagem: any) => {
    const { tipo, conteudo, anexo_url } = mensagem;
    switch (tipo) {
      case 'imagem':
        return (
          <div className="space-y-2">
            {anexo_url && (
              <div className="relative max-w-xs">
                <img
                  src={anexo_url}
                  alt={conteudo || 'Imagem enviada'}
                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(anexo_url, '_blank')}
                />
              </div>
            )}
            {conteudo && conteudo !== 'Imagem enviada' && (
              <p className="text-sm">{conteudo}</p>
            )}
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-2">
            {anexo_url && (
              <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg max-w-xs">
                <Headphones className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Áudio</p>
                  <audio controls className="w-full mt-1">
                    <source src={anexo_url} type="audio/mpeg" />
                    <source src={anexo_url} type="audio/wav" />
                    <source src={anexo_url} type="audio/ogg" />
                    Seu navegador não suporta reprodução de áudio.
                  </audio>
                </div>
              </div>
            )}
            {conteudo && conteudo !== 'Áudio enviado' && (
              <p className="text-sm">{conteudo}</p>
            )}
          </div>
        );
      case 'arquivo':
        return (
          <div className="space-y-2">
            {anexo_url && (
              <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg max-w-xs cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => window.open(anexo_url, '_blank')}>
                <FileText className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Arquivo</p>
                  <p className="text-xs text-gray-600">{conteudo || 'Clique para visualizar'}</p>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {conteudo}
          </p>
        );
    }
  };

  // Estado: Nenhum lead selecionado
  if (!leadId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Selecione uma conversa</p>
          <p className="text-sm">Escolha um lead para visualizar as mensagens</p>
        </div>
      </div>
    );
  }

  // Estado: Carregando mensagens
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Carregando mensagens...</p>
          {shouldUseAdminMode && (
            <Badge variant="outline" className="mt-2">
              <Shield className="w-3 h-3 mr-1" />
              Modo Admin
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Prepara mensagens com separadores de data
  const messagesWithSeparators = getMessagesWithDateSeparators(messages);

  // Renderização principal do componente
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header modo admin */}
      {shouldUseAdminMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Shield className="w-4 h-4" />
            <span>Visualizando conversa como administrador</span>
          </div>
        </div>
      )}
      {/* Área de mensagens com rolagem */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ minHeight: 0, maxHeight: '100%' }}
      >
{messagesWithSeparators.map((item) => {
  if (item.type === 'date-separator') {
    return (
      <div key={item.id} className="flex justify-center my-6">
        <div className="bg-white border border-gray-200 rounded-full px-4 py-2 text-xs text-gray-600 font-medium shadow-sm">
          {item.dateText}
        </div>
      </div>
    );
  }
  return (
    <div
      key={item.id}
      className={`flex ${item.enviado_por === 'usuario' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${
          item.enviado_por === 'usuario'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        {renderMessageContent(item)}
        <div
          className={`text-xs mt-2 flex items-center gap-1 ${
            item.enviado_por === 'usuario' ? 'text-blue-100 justify-end' : 'text-gray-500'
          }`}
        >
          <span>{formatMessageTime(item.created_at)}</span>
          {item.enviado_por === 'usuario' && (
            <span className="text-xs">
              {item.lida ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
})}