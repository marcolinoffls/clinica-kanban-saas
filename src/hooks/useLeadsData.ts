
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar operações CRUD de leads
 * 
 * Funcionalidades:
 * - Criar novos leads
 * - Atualizar leads existentes  
 * - Deletar leads
 * - Gerenciar estado de loading
 */

export const useLeadsData = () => {
  const [loading, setLoading] = useState(false);

  // Função para criar novo lead
  const createLead = async (leadData: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead criado com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar lead
  const updateLead = async (leadId: string, leadData: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead atualizado com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar lead
  const deleteLead = async (leadId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      toast.error('Erro ao deletar lead');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createLead,
    updateLead,
    deleteLead
  };
};
