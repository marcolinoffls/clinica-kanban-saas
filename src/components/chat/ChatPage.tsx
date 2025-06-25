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

// Interface para representar uma conversa
interface Conversation {
  id: string;
  created_at: string;
  lead_id: string;
  clinica_id: string;
  // Adicione outros campos conforme necessário
}

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar conversas do lead
  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: ['conversations', searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .ilike('lead_id', `%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar conversas:', error);
        throw new Error('Erro ao buscar conversas');
      }

      return data as Conversation[];
    },
  });

  // Efeito para selecionar a conversa do lead da URL
  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId) {
      const conversation = conversations.find(c => c.lead_id === leadId);
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
            placeholder="Buscar por Lead ID..."
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
                  <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${conversation.lead_id}`} />
                  <AvatarFallback>LID</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Lead ID: {conversation.lead_id}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Chat Window */}
      {selectedConversation && (
        <ChatWindow
          leadId={selectedConversation.lead_id}
          targetClinicaId={selectedConversation.clinica_id}
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
