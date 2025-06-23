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
 * 💬 Componente de Janela de Chat
 * 
 * 📋 FUNCIONALIDADES:
 * - Exibe histórico de mensagens entre usuário e lead
 * - Suporta diferentes tipos de mídia (texto, imagem, áudio)
 * - Adapta-se automaticamente para modo admin
 * - Gerencia scroll automático para novas mensagens
 * - CORREÇÃO: Carregamento adequado para usuários normais
 * 
 * 🔄 FLUXO CORRIGIDO:
 * - Usuários normais: usa buscarMensagensLead + estado local
 * - Administradores: usa useAdminChatMessages
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
  const [isFirstLoad, setIsFirstLoad] = useState(true); // NOVO: Flag para primeira carga

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
   * 📥 Buscar Mensagens para Usuários Normais
   * 
   * CORREÇÃO PRINCIPAL: Agora atualiza estado local adequadamente
   */
  const fetchNormalMessages = useCallback(async () => {
    if (!leadId || shouldUseAdminMode) return;
    
    setIsLoadingMessages(true);
    try {
      // 📊 BUSCAR MENSAGENS E ATUALIZAR ESTADO LOCAL
      const mensagens = await normalChatData.buscarMensagensLead(leadId);
      setLocalMessages(mensagens || []);
      
      console.log(`📥 [ChatWindow] Mensagens carregadas para usuário normal:`, mensagens?.length || 0);
    } catch (error) {
      console.error('❌ [ChatWindow] Erro ao carregar mensagens:', error);
      setLocalMessages([]); // Limpar em caso de erro
    } finally {
      setIsLoadingMessages(false);
    }
  }, [leadId, shouldUseAdminMode, normalChatData.buscarMensagensLead]);

  /**
   * 🔄 useEffect: Carregar Mensagens Quando Lead Muda
   */
  useEffect(() => {
    if (!shouldUseAdminMode && leadId) {
      setIsFirstLoad(true); // NOVO: Marcar como primeira carga
      fetchNormalMessages();
    } else if (!leadId) {
      // Limpar mensagens quando não há lead selecionado
      setLocalMessages([]);
      setIsFirstLoad(true); // NOVO: Reset flag
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
   * 📜 CORREÇÃO: Scroll Inteligente
   * 
   * - Na primeira carga: scroll instantâneo para o final (sem animação)
   * - Em novas mensagens: scroll suave
   */
  const scrollToBottom = useCallback((instant = false) => {
    if (messagesEndRef.current) {
      if (instant) {
        // SCROLL INSTANTÂNEO para primeira carga
        messagesEndRef.current.scrollIntoView({ block: 'end' });
      } else {
        // SCROLL SUAVE para novas mensagens
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, []);

  /**
   * 🔄 useEffect: Controle de Scroll Inteligente
   * 
   * CORREÇÃO PRINCIPAL: Diferencia primeira carga de novas mensagens
   */
  useEffect(() => {
    if (messages.length > 0) {
      if (isFirstLoad) {
        // PRIMEIRA CARGA: Scroll instantâneo após um pequeno delay para garantir renderização
        setTimeout(() => {
          scrollToBottom(true); // Scroll instantâneo
          setIsFirstLoad(false); // Marcar que primeira carga foi concluída
        }, 100);
      } else {
        // NOVAS MENSAGENS: Scroll suave
        scrollToBottom(false);
      }
    }
  }, [messages.length, isFirstLoad, scrollToBottom]);

  /**
   * 🔄 useEffect: Reset da Flag quando Lead Muda
   */
  useEffect(() => {
    if (leadId) {
      setIsFirstLoad(true);
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

      {/* 📋 Área de Mensagens - CORREÇÃO: Ref adicionada ao container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          // 📝 Estado Vazio
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm mt-1">Comece a conversa enviando uma mensagem!</p>
          </div>
        ) : (
          // 💬 Lista de Mensagens
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
                {/* 📄 Conteúdo da Mensagem */}
                {renderMessageContent(mensagem)}
                
                {/* 🕐 Timestamp */}
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
        
        {/* 📍 Referência para Scroll - MANTIDA */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};