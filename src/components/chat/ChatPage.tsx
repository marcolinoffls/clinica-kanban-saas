
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatWindow } from './ChatWindow';
import { ConversationFilter } from './ConversationFilter';
import { useConversations } from '@/hooks/useConversations';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAdminChatData } from '@/hooks/useAdminChatData';

/**
 * Página principal do chat
 * 
 * O que faz:
 * - Lista conversas ativas de leads
 * - Permite alternar entre conversas
 * - Integra filtros por clínica (para admins)
 * - Mostra window de chat ativa
 * 
 * Onde é usado:
 * - Menu principal do sistema
 * - Dashboard de atendimento
 * 
 * Como se conecta:
 * - Hook useConversations para dados gerais
 * - Hook useAdminChatData para dados de admin
 * - Componente ChatWindow para exibir mensagens
 */

interface Conversation {
  lead_id: string;
  nome_lead: string;
  telefone_lead: string;
  clinica_id: string;
  nome_clinica: string;
  unread_count: number;
  last_message_time: string;
  last_message_content: string;
}

export const ChatPage = () => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedClinicaFilter, setSelectedClinicaFilter] = useState<string>('');
  const { isAdmin } = useAdminCheck();

  // Hook para dados de chat (usuário regular)
  const {
    conversations,
    loading: chatLoading,
    error: chatError,
    markAsRead,
    refreshConversations
  } = useConversations();

  // Hook para dados de admin (quando aplicável)
  const adminData = useAdminChatData(selectedClinicaFilter);

  // Determina qual conjunto de dados usar baseado no tipo de usuário
  const currentConversations = isAdmin ? adminData.leads.map(lead => ({
    lead_id: lead.id,
    nome_lead: lead.nome || 'Lead sem nome',
    telefone_lead: lead.telefone || '',
    clinica_id: lead.clinica_id,
    nome_clinica: lead.nome_clinica || '',
    unread_count: adminData.mensagensNaoLidas[lead.id] || 0,
    last_message_time: lead.data_ultimo_contato || lead.updated_at,
    last_message_content: `Tel: ${lead.telefone || ''}`
  })) : conversations;
  
  const currentLoading = isAdmin ? adminData.loading : chatLoading;
  const currentError = isAdmin ? adminData.error : chatError;

  // Aplica filtro de clínica se selecionado (apenas para admins)
  const filteredConversations = React.useMemo(() => {
    if (!selectedClinicaFilter || !isAdmin) {
      return currentConversations;
    }
    return currentConversations.filter(
      conv => conv.clinica_id === selectedClinicaFilter
    );
  }, [currentConversations, selectedClinicaFilter, isAdmin]);

  // Atualiza dados quando necessário
  const handleRefresh = () => {
    if (isAdmin) {
      // Para admin, recarregar será implementado quando necessário
      console.log('Refresh admin data');
    } else {
      refreshConversations();
    }
  };

  // Seleciona conversa e marca como lida
  const handleSelectConversation = async (leadId: string) => {
    setSelectedLeadId(leadId);
    
    // Marca mensagens como lidas
    try {
      if (isAdmin) {
        await adminData.marcarMensagensComoLidasAdmin(leadId);
      } else {
        await markAsRead(leadId);
      }
      handleRefresh(); // Atualiza contadores
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Volta para lista de conversas (mobile)
  const handleBackToList = () => {
    setSelectedLeadId(null);
  };

  // Carrega dados iniciais
  useEffect(() => {
    handleRefresh();
  }, [isAdmin]);

  // Estados de loading e erro
  if (currentLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <MessageSquare className="w-12 h-12 mx-auto mb-4" />
          <p className="font-medium mb-2">Erro ao carregar conversas</p>
          <p className="text-sm text-gray-600 mb-4">{currentError}</p>
          <Button onClick={handleRefresh} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Lista de Conversas */}
      <div className={`
        ${selectedLeadId ? 'hidden lg:block' : 'block'} 
        w-full lg:w-80 border-r border-gray-200 bg-white
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Conversas Ativas
            </h2>
            <Badge variant="secondary" className="ml-2">
              {filteredConversations.length}
            </Badge>
          </div>

          {/* Filtro por clínica (apenas para admins) */}
          {isAdmin && (
            <ConversationFilter
              selectedClinicaId={selectedClinicaFilter}
              onClinicaChange={setSelectedClinicaFilter}
            />
          )}
        </div>

        {/* Lista de conversas */}
        <div className="overflow-y-auto h-full">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium mb-2">Nenhuma conversa ativa</p>
              <p className="text-sm">
                As conversas com leads aparecerão aqui quando chegarem mensagens.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.lead_id}
                  className={`
                    p-4 cursor-pointer hover:bg-gray-50 transition-colors
                    ${selectedLeadId === conversation.lead_id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
                  `}
                  onClick={() => handleSelectConversation(conversation.lead_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.nome_lead || 'Lead sem nome'}
                        </h3>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <p className="text-xs text-blue-600 mb-1">
                          {conversation.nome_clinica}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mb-1">
                        {conversation.telefone_lead}
                      </p>
                      
                      {conversation.last_message_content && (
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.last_message_content}
                        </p>
                      )}
                    </div>
                    
                    {conversation.last_message_time && (
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {new Date(conversation.last_message_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Área do Chat */}
      <div className={`
        ${selectedLeadId ? 'block' : 'hidden lg:block'} 
        flex-1 bg-gray-50
      `}>
        {selectedLeadId ? (
          <div className="h-full flex flex-col">
            {/* Header do chat (mobile) */}
            <div className="lg:hidden p-4 bg-white border-b border-gray-200 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="mr-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-medium">
                {filteredConversations.find(c => c.lead_id === selectedLeadId)?.nome_lead || 'Chat'}
              </h3>
            </div>
            
            {/* Componente do chat */}
            <ChatWindow 
              leadId={selectedLeadId}
            />
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm">
                Escolha uma conversa da lista para começar a atender o lead.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
