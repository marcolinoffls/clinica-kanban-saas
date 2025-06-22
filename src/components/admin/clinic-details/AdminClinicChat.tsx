
import { useState, useEffect } from 'react';
import { MessageSquare, Users, Search } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Componente de Chat Administrativo para Clínicas
 * 
 * O que faz:
 * Exibe uma réplica do sistema de chat da clínica específica,
 * permitindo visualizar conversas e leads.
 * 
 * Onde é usado:
 * Dentro do modal de visualização rápida no painel administrativo.
 * 
 * Como se conecta:
 * - Recebe o ID da clínica como prop
 * - Usa o hook useSupabaseData com contexto da clínica específica
 * - Filtra dados apenas da clínica selecionada
 */

interface AdminClinicChatProps {
  clinicaId: string;
}

export const AdminClinicChat = ({ clinicaId }: AdminClinicChatProps) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hook do Supabase adaptado para uma clínica específica
  const {
    leads,
    mensagensNaoLidas,
    loading
  } = useSupabaseData();

  // Filtrar leads apenas da clínica específica
  const leadsFiltered = leads.filter(lead => lead.clinica_id === clinicaId);

  // Filtrar leads por termo de busca
  const leadsComMensagens = leadsFiltered.filter(lead =>
    (lead.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.telefone?.includes(searchTerm) ||
    (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastMessage = (lead: any) => {
    return lead.telefone || 'Clique para ver a conversa...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[600px] flex overflow-hidden bg-gray-50 rounded-lg">
      {/* Lista de conversas - Lateral esquerda */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header da lista */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Conversas ({leadsFiltered.length})
            </h3>
          </div>
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
          {leadsComMensagens.length > 0 ? (
            leadsComMensagens.map((lead) => {
              const mensagensNaoLidasCount = mensagensNaoLidas[lead.id] || 0;
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedConversation(lead.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative ${
                    selectedConversation === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={lead.avatar_url || undefined} alt={`Avatar de ${lead.nome || 'Lead'}`} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {lead.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>

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
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(lead.data_ultimo_contato || lead.updated_at)}
                        </span>
                      </div>
                      <p className={`text-sm truncate mt-1 ${
                        mensagensNaoLidasCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-600'
                      }`}>
                        {getLastMessage(lead)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <MessageSquare size={32} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de mensagens - Centro */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <div className="flex-1 bg-gray-50 overflow-hidden">
            <ChatWindow leadId={selectedConversation} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa para visualizar as mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
