import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  created_at: string;
  nome: string;
  telefone: string;
  email: string;
  origem_lead: string;
  servico_interesse: string;
  anotacoes: string;
  tag_id: string | null;
  // Outras propriedades do contato
}

interface UseClientsPageResult {
  data: Contact[] | null;
  loading: boolean;
  error: Error | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTagId: string | null;
  setSelectedTagId: (tagId: string | null) => void;
  filteredContacts: Contact[];
}

export const useClientsPage = (): UseClientsPageResult => {
  const [data, setData] = useState<Contact[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: contacts, error: fetchError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError(fetchError);
        } else {
          setData(contacts);
        }
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar leads/contatos baseado no termo de busca
  const filteredContacts = useMemo(() => {
    if (!data) return [];
    
    return data.filter((contact) => {
      const matchesSearch = !searchTerm || 
        contact.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.telefone?.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.origem_lead?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.servico_interesse?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag = !selectedTagId || contact.tag_id === selectedTagId;
      
      return matchesSearch && matchesTag;
    });
  }, [data, searchTerm, selectedTagId]);

  return {
    data,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedTagId,
    setSelectedTagId,
    filteredContacts,
  };
};
