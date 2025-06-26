
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
  
  // 📊 ESTADO LOCAL PARA MENSAGENS (usuários normais)
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // 🔗 HOOKS PARA DADOS
  const normalChatData = useSupabaseData();
  const { isAdmin } = useAdminCheck();
  
  // Hook admin para mensagens (apenas se for admin)
  const adminChatMessages = useAdminChatMessages(
    isAdmin ? leadId : null,
    isAdmin ? normalChatData.leads.find(l => l.id === leadId)?.clinica_id : null
  );

  // 🎯 DETERMINAR MODO DE OPERAÇÃO
  const shouldUseAdminMode = isAdmin && leadId;
  
  // 📨 SELECIONAR MENSAGENS BASEADO NO MODO
  const messages = shouldUseAdminMode 
    ? adminChatMessages.messages || []
    : localMessages || [];

  // ⏳ LOADING STATE
  const isLoading = shouldUseAdminMode 
    ? adminChatMessages.loading 
    : isLoadingMessages;

  /**
   * 📅 Gerar separador de data baseado na data da mensagem
   */
  const getDateSeparatorText = (date: Date): string => {
    if (isToday(date)) {
      return 'Hoje';
    }
    
    if (isYesterday(date)) {
      return 'Ontem';
    }
    
    // Verifica se é da semana atual
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Segunda-feira como início
    if (isSameWeek(date, new Date(), { weekStartsOn: 1 }) && date >= weekStart) {
      return format(date, 'EEEE', { locale: ptBR }); // Nome do dia da semana
    }
    
    // Data completa para mensagens antigas
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  /**
   * 📋 Agrupar mensagens com separadores de data
   */
  const getMessagesWithDateSeparators = (messages: any[]) => {
    if (!messages || messages.length === 0) return [];

    const messagesWithSeparators: any[] = [];
    let lastDate: string | null = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at);
      const currentDateString = format(messageDate, 'yyyy-MM-dd');

      // Adicionar separador se a data mudou
      if (lastDate !== currentDateString) {
        messagesWithSeparators.push({
          type: 'date-separator',
          id: `separator-${currentDateString}`,
          dateText: getDateSeparatorText(messageDate),
          date: currentDateString
        });
        lastDate = currentDateString;
      }

      // Adicionar a mensagem
      messagesWithSeparators.push({
        ...message,
        type: 'message'
      });
    });

    return messagesWithSeparators;
  };

  /**
   * 📥 Buscar Mensagens para Usuários Normais
   */
  const fetchNormalMessages = useCallback(async () => {
    if (!leadId || shouldUseAdminMode) return;
    
    setIsLoadingMessages(true);
    try {
      const mensagens = await normalChatData.buscarMensagensLead(leadId);
      setLocalMessages(mensagens || []);
      
      console.log(`📥 [ChatWindow] Mensagens carregadas para usuário normal:`, mensagens?.length || 0);
    } catch (error) {
      console.error('❌ [ChatWindow] Erro ao carregar mensagens:', error);
      setLocalMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [leadId, shouldUseAdminMode, normalChatData.buscarMensagensLead]);

  /**
   * 🔄 useEffect: Carregar Mensagens Quando Lead Muda
   */
  useEffect(() => {
    if (!shouldUseAdminMode && leadId) {
      setHasScrolledToBottom(false); // Reset flag quando lead muda
      fetchNormalMessages();
    } else if (!leadId) {
      setLocalMessages([]);
      setHasScrolledToBottom(false);
    }
  }, [fetchNormalMessages, leadId]);

  /**
   * ✅ useEffect: Marcar Mensagens como Lidas
   */
  useEffect(() => {
    if (leadId && !shouldUseAdminMode) {
      normalChatData.marcarMensagensComoLidas(leadId);
    }
  }, [leadId, shouldUseAdminMode, normalChatData.marcarMensagensComoLidas]);

  /**
   * 📜 CORREÇÃO: Scroll Inteligente e Controlado
   * 
   * - Primeira carga: scroll instantâneo e invisível ao usuário
   * - Novas mensagens: scroll suave
   * - Liberdade total para o usuário navegar
   */
  const scrollToBottom = useCallback((instant = false) => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      if (instant) {
        // SCROLL INSTANTÂNEO: Define diretamente a posição sem animação
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      } else {
        // SCROLL SUAVE: Para novas mensagens
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, []);

  /**
   * 🔄 useEffect: Controle de Scroll Inteligente
   */
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      if (!hasScrolledToBottom) {
        // PRIMEIRA CARGA: Scroll instantâneo após renderização
        setTimeout(() => {
          scrollToBottom(true); // Scroll instantâneo
          setHasScrolledToBottom(true);
        }, 50); // Delay mínimo para garantir renderização
      } else {
        // NOVAS MENSAGENS: Verificar se usuário está próximo ao final antes de fazer scroll suave
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
          
          if (isNearBottom) {
            setTimeout(() => scrollToBottom(false), 100); // Scroll suave para novas mensagens
          }
        }
      }
    }
  }, [messages.length, isLoading, hasScrolledToBottom, scrollToBottom]);

  /**
   * 🔄 useEffect: Reset quando Lead muda
   */
  useEffect(() => {
    if (leadId) {
      setHasScrolledToBottom(false);
    }
  }, [leadId]);

  /**
   * 🕐 Formatar Horário das Mensagens
   */
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm', { locale: ptBR });
    } else if (diffInHours < 24 * 7) {
      return format(date, 'EEE HH:mm', { locale: ptBR });
    } else {
      return format(date, 'dd/MM HH:mm', { locale: ptBR });
    }
  };

  /**
   * 🎨 Renderizar Conteúdo da Mensagem por Tipo
   */
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
        return <p className="text-sm">{conteudo}</p>;
    }
  };

  // 🚫 ESTADO: Nenhum Lead Selecionado
  if (!leadId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p>Selecione uma conversa para visualizar as mensagens</p>
        </div>
      </div>
    );
  }

  // ⏳ ESTADO: Carregando Mensagens
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
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

  // 📋 Preparar mensagens com separadores de data
  const messagesWithSeparators = getMessagesWithDateSeparators(messages);

  // 🎨 RENDERIZAÇÃO PRINCIPAL DO COMPONENTE
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      
      {/* 🛡️ Header Modo Admin */}
      {shouldUseAdminMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Shield className="w-4 h-4" />
            <span>Visualizando conversa como administrador</span>
          </div>
        </div>
      )}

      {/* 📋 Área de Mensagens - SCROLL LIVRE E CONTROLADO */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollBehavior: 'auto' }} // Remover scroll behavior automático
      >
        {messagesWithSeparators.length === 0 ? (
          // 📝 Estado Vazio
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm mt-1">Comece a conversa enviando uma mensagem!</p>
          </div>
        ) : (
          // 💬 Lista de Mensagens com Separadores
          messagesWithSeparators.map((item) => {
            // 📅 SEPARADOR DE DATA
            if (item.type === 'date-separator') {
              return (
                <div key={item.id} className="flex justify-center my-6">
                  <div className="bg-white border border-gray-200 rounded-full px-4 py-2 text-xs text-gray-600 font-medium shadow-sm">
                    {item.dateText}
                  </div>
                </div>
              );
            }

            // 💬 MENSAGEM NORMAL
            return (
              <div
                key={item.id}
                className={`flex ${item.enviado_por === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    item.enviado_por === 'usuario'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {/* 📄 Conteúdo da Mensagem */}
                  {renderMessageContent(item)}
                  
                  {/* 🕐 Timestamp */}
                  <div
                    className={`text-xs mt-1 ${
                      item.enviado_por === 'usuario' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageTime(item.created_at)}
                    {!item.lida && item.enviado_por === 'usuario' && (
                      <span className="ml-2">✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* 📍 Referência para Scroll - MANTIDA */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
