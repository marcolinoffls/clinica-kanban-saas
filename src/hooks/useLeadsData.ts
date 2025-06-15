import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  origem_lead?: string;
  servico_interesse?: string;
  anotacoes?: string;
  etapa_id: string;
  clinica_id: string;
  created_at: string;
  updated_at: string;
  data_ultimo_contato?: string;
  convertido: boolean;
  anuncio?: string;
  ad_name?: string; // Campo adicionado para suportar o nome específico do anúncio
}

interface UseLeadsDataProps {
  etapaId?: string;
  searchTerm?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useLeadsData = ({ etapaId, searchTerm, sortOrder }: UseLeadsDataProps = {}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: sortOrder === 'asc' });

    if (etapaId) {
      query = query.eq('etapa_id', etapaId);
    }

    if (searchTerm) {
      query = query.ilike('nome', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      setError(error.message);
      return [];
    }

    return data || [];
  };

  const {
    data: fetchedLeads,
    isLoading,
    isError,
    refetch,
  } = useQuery(['leads', etapaId, searchTerm, sortOrder], fetchLeads, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (fetchedLeads) {
      setLeads(fetchedLeads);
    }
  }, [fetchedLeads]);

  return {
    leads,
    loading: loading || isLoading,
    error,
    refetch,
  };
};
