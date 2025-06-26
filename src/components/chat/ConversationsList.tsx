
import { useState } from 'react';
import { Search, MessageSquare, Shield } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminClinicSelector } from '@/components/admin/AdminClinicSelector';
import { Lead } from '@/hooks/useLeadsData';
import { formatPhoneNumber } from './utils/phoneFormatter';
import { getOrigemIcon } from './utils/originIcons';

/**
 * Lista de conversas do chat
 * 
 * O que faz:
 * - Exibe lista de leads/conversas
 * - Permite busca por nome, telefone ou email
 * - Mostra contadores de mensagens não lidas
 * - Suporta modo admin com seletor de clínica
 * 
 * Onde é usado:
 * - ChatPage como sidebar esquerda
 */

interface ConversationsListProps {
  leads: Lead[];
  mensagensNaoLidas: Record<string, number>;
  ultimasMensagens: Record<string, string>;
  selectedConversation: string | null;
  onSelectConversation: (leadId: string) => void;
  isAdmin: boolean;
  adminClinicaSelecionada: any | null;
  onAdminClinicaSelected: (clinica: any) => void;
}

export const ConversationsList = ({
  leads,
  mensagensNaoLidas,
  ultimasMensagens,
  selectedConversation,
  onSelectConversation,
  isAdmin,
  adminClinicaSelecionada,
  onAdminClinicaSelected
}: ConversationsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastMessage = (lead: Lead) => {
    return formatPhoneNumber(lead.telefone) || 'Clique para ver a conversa...';
  };

  // Filtrar e ordenar leads
  const filteredLeads = leads
    .filter(lead =>
      (lead.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dataA = ultimasMensagens[a.id] || a.data_ultimo_contato || a.updated_at;
      const dataB = ultimasMensagens[b.id] || b.data_ultimo_contato || b.updated_at;
      
      return new Date(dataB).getTime() - new Date(dataA).getTime();
    });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Header da lista */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Conversas</h2>
          {isAdmin && (
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>

        {/* Seletor de clínica para administradores */}
        {isAdmin && (
          <div className="mb-3">
            <AdminClinicSelector
              clinicaSelecionada={adminClinicaSelecionada}
              onClinicaSelected={onAdminClinicaSelected}
              showStats={false}
            />
          </div>
        )}

        {/* Alert informativo para admin */}
        {isAdmin && !adminClinicaSelecionada && (
          <Alert className="mb-3">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Selecione uma clínica para visualizar suas conversas
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto">
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => {
            const mensagensNaoLidasCount = mensagensNaoLidas[lead.id] || 0;
            const ultimaMensagemData = ultimasMensagens[lead.id] || lead.data_ultimo_contato || lead.updated_at;
            
            return (
              <div
                key={lead.id}
                onClick={() => onSelectConversation(lead.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative ${
                  selectedConversation === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={lead.avatar_url || undefined} alt={`Avatar de ${lead.nome || 'Lead'}`} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {lead.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    {getOrigemIcon(lead.origem_lead)}
                  </div>

                  {mensagensNaoLidasCount > 0 && (
                    <div className="absolute top-2 left-11 bg-green-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                      {mensagensNaoLidasCount > 99 ? '99+' : mensagensNaoLidasCount}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className={`font-medium truncate ${
                          mensagensNaoLidasCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-900'
                        }`}>
                          {lead.nome || 'Lead sem nome'}
                        </h4>
                        {/* Exibir nome da clínica para admin */}
                        {isAdmin && lead.nome_clinica && (
                          <div className="text-xs text-blue-600 truncate">
                            {lead.nome_clinica}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(ultimaMensagemData)}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-1 ${
                      mensagensNaoLidasCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-600'
                    }`}>
                      {getLastMessage(lead)}
                    </p>
                  </div>
                </div>
                {mensagensNaoLidasCount > 0 && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <MessageSquare size={32} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {isAdmin && !adminClinicaSelecionada 
                ? 'Selecione uma clínica para visualizar conversas'
                : 'Nenhuma conversa encontrada'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
