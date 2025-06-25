import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
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
  
  // 📊 ESTADO LOCAL PARA MENSAGENS (usuários normais)
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);

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

    messages.forEach((message) => {
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
      console.log(`📥 [ChatWindow] Mensagens carregadas:`, mensagens?.length || 0);
    } catch (error) {
      console.error('❌ [ChatWindow] Erro ao carregar mensagens:', error);
      setLocalMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [leadId, shouldUseAdminMode, normalChatData.buscarMensagensLead]);

  /**
   * 🔄 useEffect: Carregar Mensagens e Resetar Estado quando Lead Muda
   */
  useEffect(() => {
    if (leadId) {
      setHasInitialScrolled(false); // Reset flag quando lead muda
      if (!shouldUseAdminMode) {
        fetchNormalMessages();
      }
    } else {
      setLocalMessages([]);
      setHasInitialScrolled(false);
    }
  }, [leadId, shouldUseAdminMode, fetchNormalMessages]);

  /**
   * ✅ useEffect: Marcar Mensagens como Lidas
   */
  useEffect(() => {
    if (leadId && !shouldUseAdminMode) {
      normalChatData.marcarMensagensComoLidas(leadId);
    }
  }, [leadId, messages.length, shouldUseAdminMode, normalChatData.marcarMensagensComoLidas]);

  /**
   * ✅ CORREÇÃO 1: SCROLL INICIAL INVISÍVEL
   * 
   * useLayoutEffect é executado ANTES da renderização ser pintada na tela.
   * Isso garante que o usuário não veja a animação de rolagem e a conversa
   * já apareça no final desde o início.
   */
  useLayoutEffect(() => {
    if (!isLoading && messages.length > 0 && !hasInitialScrolled) {
      const container = messagesContainerRef.current;
      if (container) {
        // Define a posição de scroll diretamente para o final
        container.scrollTop = container.scrollHeight;
        setHasInitialScrolled(true);
        console.log('📜 [ChatWindow] Scroll inicial executado');
      }
    }
  }, [isLoading, messages.length, hasInitialScrolled]);

  /**
   * ✅ CORREÇÃO 2: SCROLL PARA NOVAS MENSAGENS (NÃO INTERROMPE O USUÁRIO)
   * 
   * Este useEffect é executado para novas mensagens APÓS o scroll inicial.
   * Ele só rola para baixo se o usuário já estiver perto do final.
   */
  useEffect(() => {
    // Só executa para novas mensagens (após o scroll inicial)
    if (!isLoading && messages.length > 0 && hasInitialScrolled) {
      const container = messagesContainerRef.current;
      if (container) {
        // Verifica se o usuário está perto do final da conversa
        const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
        
        if (isNearBottom) {
          // Scroll suave apenas se o usuário já estiver no final
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end' 
            });
          }, 100);
        }
      }
    }
  }, [messages.length, hasInitialScrolled, isLoading]);

  /**
   * 🕐 Formatar Horário das Mensagens
   */
  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: ptBR });
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
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {conteudo}
          </p>
        );
    }
  };

  // 🚫 ESTADO: Nenhum Lead Selecionado
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

  // ⏳ ESTADO: Carregando Mensagens
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

  // 📋 Preparar mensagens com separadores de data
  const messagesWithSeparators = getMessagesWithDateSeparators(messages);

  // 🎨 RENDERIZAÇÃO PRINCIPAL DO COMPONENTE
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      
      {/* 🛡️ Header Modo Admin */}
      {shouldUseAdminMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex-shrink-0">
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
        style={{
          scrollbarWidth: 'thin', // Firefox
          scrollbarColor: '#cbd5e1 #f1f5f9' // Firefox
        }}
      >
        {/* Estilos personalizados para a barra de rolagem no WebKit (Chrome, Safari) */}
        <style jsx>{`
          .flex-1::-webkit-scrollbar {
            width: 8px;
          }
          .flex-1::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .flex-1::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .flex-1::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>

        {messagesWithSeparators.length === 0 ? (
          // 📝 Estado Vazio
          <div className="text-center text-gray-500 py-12">
            <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Nenhuma mensagem ainda</p>
            <p className="text-sm">Comece a conversa enviando uma mensagem!</p>
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
                  className={`max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${
                    item.enviado_por === 'usuario'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {/* 📄 Conteúdo da Mensagem */}
                  {renderMessageContent(item)}
                  
                  {/* 🕐 Timestamp */}
                  <div
                    className={`text-xs mt-2 flex items-center gap-1 ${
                      item.enviado_por === 'usuario' ? 'text-blue-100 justify-end' : 'text-gray-500'
                    }`}
                  >
                    <span>{formatMessageTime(item.created_at)}</span>
                    {/* Indicador de mensagem lida/não lida */}
                    {item.enviado_por === 'usuario' && (
                      <span className="text-xs">
                        {item.lida ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* 📍 Referência para Scroll */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};