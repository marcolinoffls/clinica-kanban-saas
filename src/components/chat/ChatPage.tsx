
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from 'lucide-react';
import { ChatWindow } from './ChatWindow';

// Interface para representar um lead com mensagens
interface LeadWithMessages {
  id: string;
  nome: string;
  telefone: string;
  clinica_id: string;
  created_at: string;
  // Adicione outros campos conforme necessário
}

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const [selectedLead, setSelectedLead] = useState<LeadWithMessages | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar leads que têm mensagens
  const { data: leadsWithMessages = [], isLoading, error } = useQuery({
    queryKey: ['leads-with-messages', searchQuery],
    queryFn: async () => {
      // Buscar leads que têm mensagens no chat
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          nome,
          telefone,
          clinica_id,
          created_at,
          chat_mensagens!inner(id)
        `)
        .ilike('nome', `%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar leads com mensagens:', error);
        throw new Error('Erro ao buscar conversas');
      }

      // Filtrar apenas leads únicos (pois pode haver múltiplas mensagens por lead)
      const uniqueLeads = data.reduce((acc: LeadWithMessages[], lead: any) => {
        if (!acc.find(l => l.id === lead.id)) {
          acc.push({
            id: lead.id,
            nome: lead.nome || 'Lead sem nome',
            telefone: lead.telefone || '',
            clinica_id: lead.clinica_id,
            created_at: lead.created_at
          });
        }
        return acc;
      }, []);

      return uniqueLeads;
    },
  });

  // Efeito para selecionar o lead da URL
  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId) {
      const lead = leadsWithMessages.find(l => l.id === leadId);
      setSelectedLead(lead || null);
    }
  }, [searchParams, leadsWithMessages]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Conversas</h2>

        {/* Search Bar */}
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Buscar por nome do lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Lista de Leads com Mensagens */}
        {isLoading ? (
          <p>Carregando conversas...</p>
        ) : error ? (
          <p>Erro ao carregar conversas.</p>
        ) : (
          <div className="space-y-2">
            {leadsWithMessages.map((lead) => (
              <button
                key={lead.id}
                className={`flex items-center space-x-3 w-full p-2 rounded-md hover:bg-gray-100 ${selectedLead?.id === lead.id ? 'bg-gray-100' : ''}`}
                onClick={() => setSelectedLead(lead)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${lead.id}`} />
                  <AvatarFallback>{lead.nome.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">{lead.nome}</p>
                  <p className="text-xs text-gray-500">
                    {lead.telefone || 'Sem telefone'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Chat Window */}
      {selectedLead && (
        <ChatWindow
          leadId={selectedLead.id}
        />
      )}
      
      {/* Mensagem de Seleção */}
      {!selectedLead && !isLoading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Selecione uma conversa para visualizar.</p>
        </div>
      )}
    </div>
  );
}
