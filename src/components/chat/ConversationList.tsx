
/**
 * Componente da lista de conversas no chat
 * 
 * Responsável por:
 * - Exibir lista de conversas/leads
 * - Filtros de busca
 * - Seleção de conversa
 * - Indicadores de mensagens não lidas
 * - Suporte a Admin para múltiplas clínicas
 */

import { Search, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ClinicSelector } from './ClinicSelector';
import { Lead, ClinicaBasica } from '@/types';
import { formatPhoneNumber, getOrigemIcon, formatTime } from './utils/chatUtils';

interface ConversationListProps {
  // Estados de dados
  leads: Lead[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  mensagensNaoLidas: Record<string, number>;
  ultimasMensagens: Record<string, string>;
  
  // Seleção de conversa
  selectedConversation: string | null;
  onConversationSelect: (leadId: string) => void;
  
  // Admin e controle de clínicas
  isAdmin: boolean;
  selectedClinicaId: string;
  onClinicaChange: (clinicaId: string) => void;
  clinicas: ClinicaBasica[];
  loadingClinicas: boolean;
}

export const ConversationList = ({
  leads,
  searchTerm,
  onSearchTermChange,
  mensagensNaoLidas,
  ultimasMensagens,
  selectedConversation,
  onConversationSelect,
  isAdmin,
  selectedClinicaId,
  onClinicaChange,
  clinicas,
  loadingClinicas
}: ConversationListProps) => {
  // Filtrar e ordenar leads por última mensagem
  const leadsComMensagens = leads
    .filter(lead =>
      (lead.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Ordenar por data da última mensagem, mais recente primeiro
      const dataA = ultimasMensagens[a.id] || a.data_ultimo_contato || a.updated_at;
      const dataB = ultimasMensagens[b.id] || b.data_ultimo_contato || b.updated_at;
      
      return new Date(dataB).getTime() - new Date(dataA).getTime();
    });

  const getLastMessage = (lead: Lead) => {
    return formatPhoneNumber(lead.telefone) || 'Clique para ver a conversa...';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Header da lista */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isAdmin ? 'Conversas - Admin' : 'Conversas'}
        </h2>
        
        {/* Seletor de clínicas para Admin */}
        {isAdmin && (
          <ClinicSelector
            selectedClinicaId={selectedClinicaId}
            onClinicaChange={onClinicaChange}
            clinicas={clinicas}
            loading={loadingClinicas}
          />
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de conversas com rolagem própria */}
      <div className="flex-1 overflow-y-auto">
        {/* Indicador quando Admin está visualizando "todas" */}
        {isAdmin && selectedClinicaId === 'all' && leads.length > 0 && (
          <div className="p-2 bg-blue-50 border-b border-blue-100">
            <p className="text-xs text-blue-600 text-center">
              📊 Visualizando todas as clínicas ({leads.length} conversas)
            </p>
          </div>
        )}
        
        {/* Lista de leads com conversas */}
        {leadsComMensagens.length > 0 ? (
          leadsComMensagens.map((lead) => {
            const mensagensNaoLidasCount = mensagensNaoLidas[lead.id] || 0;
            const ultimaMensagemData = ultimasMensagens[lead.id] || lead.data_ultimo_contato || lead.updated_at;
            
            return (
              <div
                key={lead.id}
                onClick={() => onConversationSelect(lead.id)}
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
                      <h4 className={`font-medium truncate ${
                        mensagensNaoLidasCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-900'
                      }`}>
                        {lead.nome || 'Lead sem nome'}
                        {/* Mostrar nome da clínica para Admin visualizando "todas" */}
                        {isAdmin && selectedClinicaId === 'all' && lead.nome_clinica && (
                          <span className="ml-2 text-xs text-gray-500 font-normal">
                            ({lead.nome_clinica})
                          </span>
                        )}
                      </h4>
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
              {isAdmin && selectedClinicaId === 'all' 
                ? 'Nenhuma conversa encontrada em todas as clínicas'
                : 'Nenhuma conversa encontrada'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
