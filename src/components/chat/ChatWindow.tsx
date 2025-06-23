
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useSupabaseChat } from '@/hooks/useSupabaseChat';

interface ChatWindowProps {
  leadId: string;
  targetClinicaId?: string;
}

/**
 * 💬 Janela de Chat Individual
 * 
 * O que faz:
 * - Exibe mensagens entre lead e atendente
 * - Interface para envio de mensagens
 * - Scroll automático para novas mensagens
 * - Indicador de mensagens não lidas
 * - Suporte a anexos (futuro)
 * 
 * Onde é usado:
 * - ChatPage.tsx - janela principal de chat
 * 
 * Como se conecta:
 * - useSupabaseChat: hook para operações de chat
 * - Supabase Realtime: atualizações em tempo real
 * - Tabela chat_mensagens: armazena mensagens
 */
export const ChatWindow = ({ leadId, targetClinicaId }: ChatWindowProps) => {
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    mensagens,
    buscarMensagensLead,
    enviarMensagem,
    marcarMensagensComoLidas,
  } = useSupabaseChat();

  // Buscar mensagens do lead ao montar o componente
  useEffect(() => {
    if (leadId) {
      console.log(`💬 [ChatWindow] Carregando mensagens para lead: ${leadId}`);
      buscarMensagensLead(leadId);
      marcarMensagensComoLidas(leadId);
    }
  }, [leadId, buscarMensagensLead, marcarMensagensComoLidas]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens]);

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!messageText.trim() || loading) return;
    
    try {
      setLoading(true);
      console.log(`📤 [ChatWindow] Enviando mensagem para lead: ${leadId}`);
      
      await enviarMensagem({
        leadId,
        conteudo: messageText.trim(),
        tipo: 'texto',
        clinicaId: targetClinicaId
      });
      
      setMessageText('');
      console.log('✅ [ChatWindow] Mensagem enviada com sucesso');
    } catch (error) {
      console.error('❌ [ChatWindow] Erro ao enviar mensagem:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enter para enviar mensagem
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const leadMessages = mensagens[leadId] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Área de Mensagens */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {leadMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Inicie uma conversa!</p>
            </div>
          ) : (
            leadMessages.map((mensagem) => (
              <div
                key={mensagem.id}
                className={`flex ${mensagem.enviado_por === 'atendente' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-xs lg:max-w-md p-3 ${
                  mensagem.enviado_por === 'atendente'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{mensagem.conteudo}</p>
                  <p className={`text-xs mt-1 ${
                    mensagem.enviado_por === 'atendente' 
                      ? 'text-blue-100' 
                      : 'text-gray-500'
                  }`}>
                    {new Date(mensagem.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </Card>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Campo de Envio */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !messageText.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
