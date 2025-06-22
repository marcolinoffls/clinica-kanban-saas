
import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, FileText, Headphones, Image as ImageIcon, Shield } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAdminChatMessages } from '@/hooks/useAdminChatMessages';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/**
 * Componente de janela de chat que exibe mensagens
 * 
 * O que faz:
 * - Exibe histórico de mensagens entre usuário e lead
 * - Suporta diferentes tipos de mídia (texto, imagem, áudio)
 * - Adapta-se automaticamente para modo admin
 * - Gerencia scroll automático para novas mensagens
 * 
 * Onde é usado:
 * - ChatPage para exibir conversas selecionadas
 * 
 * Como se conecta:
 * - useSupabaseData para usuários normais
 * - useAdminChatMessages para administradores
 * - Detecta automaticamente se é admin e usa dados apropriados
 */

interface ChatWindowProps {
  leadId: string | null;
  adminMode?: boolean;
  targetClinicaId?: string | null;
}

export const ChatWindow = ({ leadId, adminMode = false, targetClinicaId }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Verificar se usuário é admin
  const { isAdmin } = useAdminCheck();
  
  // Hooks de dados - usar admin ou normal dependendo do contexto
  const normalChatData = useSupabaseData();
  const adminChatMessages = useAdminChatMessages(
    leadId, 
    (isAdmin && adminMode) ? targetClinicaId : null
  );

  // Determinar quais dados usar
  const shouldUseAdminMode = isAdmin && adminMode && targetClinicaId;
  const messages = shouldUseAdminMode ? adminChatMessages.messages : [];
  const isLoading = shouldUseAdminMode ? adminChatMessages.loading : false;

  // Buscar mensagens para usuários normais
  const fetchNormalMessages = useCallback(async () => {
    if (!leadId || shouldUseAdminMode) return;
    
    setIsLoadingMessages(true);
    try {
      const mensagens = await normalChatData.buscarMensagensLead(leadId);
      // As mensagens são gerenciadas pelo hook useSupabaseData
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [leadId, shouldUseAdminMode, normalChatData.buscarMensagensLead]);

  // Carregar mensagens para usuários normais
  useEffect(() => {
    if (!shouldUseAdminMode) {
      fetchNormalMessages();
    }
  }, [fetchNormalMessages]);

  // Marcar mensagens como lidas quando componente é montado
  useEffect(() => {
    if (leadId && !shouldUseAdminMode) {
      normalChatData.marcarMensagensComoLidas(leadId);
    }
  }, [leadId, shouldUseAdminMode, normalChatData.marcarMensagensComoLidas]);

  // Scroll automático para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para formatar data/hora das mensagens
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

  // Função para renderizar conteúdo baseado no tipo
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

  if (!leadId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p>Selecione uma conversa para visualizar as mensagens</p>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingMessages) {
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

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header indicando modo admin */}
      {shouldUseAdminMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Shield className="w-4 h-4" />
            <span>Visualizando conversa como administrador</span>
          </div>
        </div>
      )}

      {/* Área de mensagens com scroll próprio */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm mt-1">Comece a conversa enviando uma mensagem!</p>
          </div>
        ) : (
          messages.map((mensagem) => (
            <div
              key={mensagem.id}
              className={`flex ${mensagem.enviado_por === 'usuario' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  mensagem.enviado_por === 'usuario'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {renderMessageContent(mensagem)}
                <div
                  className={`text-xs mt-1 ${
                    mensagem.enviado_por === 'usuario' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatMessageTime(mensagem.created_at)}
                  {!mensagem.lida && mensagem.enviado_por === 'usuario' && (
                    <span className="ml-2">✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
