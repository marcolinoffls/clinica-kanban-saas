
import { useState, useMemo } from 'react';
import { Search, MessageSquare, Users, Clock, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatWindow } from './ChatWindow';
import { MessageInput } from './MessageInput';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { ConversationFilter } from './ConversationFilter';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAdminChatData } from '@/hooks/useAdminChatData';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * 💬 Página Principal do Chat
 * 
 * 📋 FUNCIONALIDADES:
 * - Lista de conversas com leads
 * - Pesquisa e filtros de conversas
 * - Janela de chat integrada
 * - Sidebar com informações do lead
 * - Campo para envio de mensagens
 * - Suporte a modo administrador
 * 
 * 🔄 FLUXO DE DADOS:
 * - Usuários normais: usa useSupabaseData
 * - Administradores: usa useAdminChatData para visualizar qualquer clínica
 * 
 * 🎨 INTERFACE:
 * - Layout responsivo com 3 colunas
 * - Lista de conversas à esquerda
 * - Chat central
 * - Informações do lead à direita
 */

export const ChatPage = () => {
  // 🎯 ESTADO LOCAL
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'recent'>('all');

  // 🔗 HOOKS PARA DADOS
  const { isAdmin } = useAdminCheck();
  const normalChatData = useSupabaseData();
  const adminChatData = useAdminChatData();

  // 📊 DADOS BASEADOS NO MODO
  const leads = isAdmin ? adminChatData.leads : normalChatData.leads;
  const mensagens = isAdmin ? adminChatData.mensagens : normalChatData.mensagens;
  const isLoading = isAdmin ? adminChatData.loading : normalChatData.loading;

  // 🔍 BUSCAR LEAD SELECIONADO
  const selectedLead = useMemo(() => {
    return leads.find(lead => lead.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  // 📨 PROCESSAR CONVERSAS COM ÚLTIMA MENSAGEM E CONTADORES
  const conversationsWithLastMessage = useMemo(() => {
    return leads.map(lead => {
      // Buscar mensagens do lead
      const leadMessages = mensagens.filter(msg => msg.lead_id === lead.id);
      
      // Última mensagem
      const lastMessage = leadMessages.length > 0 
        ? leadMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;

      // Contar mensagens não lidas
      const unreadCount = leadMessages.filter(msg => !msg.lida && msg.enviado_por === 'lead').length;

      return {
        ...lead,
        lastMessage,
        unreadCount,
        lastMessageTime: lastMessage ? new Date(lastMessage.created_at) : null
      };
    });
  }, [leads, mensagens]);

  // 🔍 FILTRAR CONVERSAS
  const filteredConversations = useMemo(() => {
    let filtered = conversationsWithLastMessage;

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.nome?.toLowerCase().includes(term) ||
        conv.telefone?.includes(term) ||
        conv.lastMessage?.conteudo?.toLowerCase().includes(term)
      );
    }

    // Filtro por tipo
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'recent':
        filtered = filtered.filter(conv => {
          if (!conv.lastMessageTime) return false;
          const daysDiff = (Date.now() - conv.lastMessageTime.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7; // Últimos 7 dias
        });
        break;
      default:
        // 'all' - não filtrar
        break;
    }

    // Ordenar por última mensagem (mais recente primeiro)
    return filtered.sort((a, b) => {
      const timeA = a.lastMessageTime?.getTime() || 0;
      const timeB = b.lastMessageTime?.getTime() || 0;
      return timeB - timeA;
    });
  }, [conversationsWithLastMessage, searchTerm, filterType]);

  // 🕒 FORMATAR TEMPO DA MENSAGEM
  const formatMessageTime = (date: Date | null) => {
    if (!date) return '';

    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM', { locale: ptBR });
    }
  };

  // 📱 RESPONSIVIDADE - Para mobile, esconder sidebar se há lead selecionado
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showSidebar = !isMobile || !selectedLeadId;
  const showChat = !isMobile || selectedLeadId;

  // ⏳ ESTADO DE CARREGAMENTO
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  // 🎨 RENDERIZAÇÃO PRINCIPAL
  return (
    <div className="flex h-full bg-gray-50">
      
      {/* 📋 SIDEBAR ESQUERDA - Lista de Conversas */}
      {showSidebar && (
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
          
          {/* 🔍 Header com Pesquisa */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Conversas</h2>
              {isAdmin && (
                <Badge variant="outline" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>
            
            {/* Campo de Pesquisa */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <ConversationFilter
              filterType={filterType}
              onFilterChange={setFilterType}
              totalCount={conversationsWithLastMessage.length}
              unreadCount={conversationsWithLastMessage.filter(c => c.unreadCount > 0).length}
              recentCount={conversationsWithLastMessage.filter(c => {
                if (!c.lastMessageTime) return false;
                const daysDiff = (Date.now() - c.lastMessageTime.getTime()) / (1000 * 60 * 60 * 24);
                return daysDiff <= 7;
              }).length}
            />
          </div>

          {/* 📜 Lista de Conversas */}
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              // 📝 Estado Vazio
              <div className="p-6 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium mb-1">
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </p>
                <p className="text-sm">
                  {searchTerm 
                    ? 'Tente ajustar os filtros ou termo de busca'
                    : 'As conversas aparecerão aqui quando você receber mensagens'
                  }
                </p>
              </div>
            ) : (
              // 💬 Lista de Conversas
              <div className="p-2">
                {filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedLeadId === conversation.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedLeadId(conversation.id)}
                  >
                    <CardContent className="p-4">
                      {/* Header da Conversa */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conversation.nome || 'Lead sem nome'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.telefone}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-2">
                          {/* Badge de mensagens não lidas */}
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </Badge>
                          )}
                          
                          {/* Horário da última mensagem */}
                          <span className="text-xs text-gray-400">
                            {formatMessageTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                      </div>

                      {/* Prévia da Última Mensagem */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          {conversation.lastMessage ? (
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.enviado_por === 'usuario' && (
                                <span className="text-blue-600 mr-1">Você:</span>
                              )}
                              {conversation.lastMessage.tipo === 'texto' 
                                ? conversation.lastMessage.conteudo
                                : `${conversation.lastMessage.tipo} enviado`
                              }
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              Nenhuma mensagem ainda
                            </p>
                          )}
                        </div>
                        
                        {/* Indicadores de Status */}
                        <div className="flex items-center gap-1">
                          {conversation.origem_lead && (
                            <Badge variant="outline" className="text-xs">
                              {conversation.origem_lead}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* 💬 ÁREA CENTRAL - Chat */}
      {showChat && (
        <div className="flex-1 flex flex-col">
          
          {/* Header do Chat */}
          {selectedLead && (
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Botão Voltar (mobile) */}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLeadId(null)}
                    >
                      ←
                    </Button>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedLead.nome || 'Lead sem nome'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedLead.telefone}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedLead.origem_lead && (
                    <Badge variant="outline">
                      {selectedLead.origem_lead}
                    </Badge>
                  )}
                  
                  {isAdmin && (
                    <Badge variant="secondary" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Janela de Chat */}
          <ChatWindow leadId={selectedLeadId} />

          {/* Input de Mensagem */}
          {selectedLeadId && (
            <MessageInput leadId={selectedLeadId} />
          )}
        </div>
      )}

      {/* 📊 SIDEBAR DIREITA - Informações do Lead (apenas desktop) */}
      {!isMobile && selectedLead && (
        <div className="w-80 bg-white border-l border-gray-200">
          <LeadInfoSidebar lead={selectedLead} />
        </div>
      )}
    </div>
  );
};
