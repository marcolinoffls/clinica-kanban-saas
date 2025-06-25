
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

// Interface para representar uma conversa baseada em leads
interface Conversation {
  id: string;
  created_at: string;
  nome: string;
  telefone: string;
  clinica_id: string;
  origem_lead?: string;
  // Outros campos do lead conforme necessário
}

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar leads que têm mensagens (representam conversas ativas)
  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: ['chat-conversations', searchQuery],
    queryFn: async () => {
      console.log('🔍 [ChatPage] Buscando conversas ativas...');
      
      // Buscar leads que têm mensagens de chat
      const { data: leadsWithMessages, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          nome,
          telefone,
          clinica_id,
          origem_lead,
          created_at,
          chat_mensagens!inner(id)
        `)
        .ilike('nome', `%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('❌ [ChatPage] Erro ao buscar conversas:', leadsError);
        throw new Error('Erro ao buscar conversas');
      }

      // Remover duplicatas e mapear para o formato esperado
      const uniqueLeads = leadsWithMessages.reduce((acc: any[], lead) => {
        if (!acc.find(existing => existing.id === lead.id)) {
          acc.push({
            id: lead.id,
            created_at: lead.created_at,
            nome: lead.nome || 'Sem nome',
            telefone: lead.telefone || 'Sem telefone',
            clinica_id: lead.clinica_id,
            origem_lead: lead.origem_lead
          });
        }
        return acc;
      }, []);

      console.log('✅ [ChatPage] Conversas carregadas:', uniqueLeads.length);
      return uniqueLeads as Conversation[];
    },
  });

  // Efeito para selecionar a conversa do lead da URL
  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === leadId);
      setSelectedConversation(conversation || null);
    }
  }, [searchParams, conversations]);

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

        {/* Lista de Conversas */}
        {isLoading ? (
          <p>Carregando conversas...</p>
        ) : error ? (
          <p>Erro ao carregar conversas.</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`flex items-center space-x-3 w-full p-2 rounded-md hover:bg-gray-100 ${selectedConversation?.id === conversation.id ? 'bg-gray-100' : ''}`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${conversation.nome}`} />
                  <AvatarFallback>
                    {conversation.nome ? conversation.nome.charAt(0).toUpperCase() : 'L'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">{conversation.nome}</p>
                  <p className="text-xs text-gray-500">
                    {conversation.telefone}
                  </p>
                  {conversation.origem_lead && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {conversation.origem_lead}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Chat Window */}
      {selectedConversation && (
        <ChatWindow
          leadId={selectedConversation.id}
          clinicaId={selectedConversation.clinica_id}
        />
      )}
      
      {/* Mensagem de Seleção */}
      {!selectedConversation && !isLoading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Selecione uma conversa para visualizar.</p>
        </div>
      )}
    </div>
  );
}
