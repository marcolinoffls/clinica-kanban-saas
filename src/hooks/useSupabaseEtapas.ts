
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar etapas do kanban no Supabase
 * 
 * Funcionalidades:
 * - Buscar, criar, editar e excluir etapas
 * - Validação antes de operações
 */

// ID da clínica de demonstração (em produção viria do contexto do usuário)
const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

export const useSupabaseEtapas = () => {
  const [etapas, setEtapas] = useState<any[]>([]);

  // Função para criar nova etapa
  const criarEtapa = async (nome: string) => {
    try {
      const proximaOrdem = Math.max(...etapas.map(e => e.ordem), 0) + 1;
      
      const { data, error } = await supabase
        .from('etapas_kanban')
        .insert({
          nome,
          ordem: proximaOrdem,
          clinica_id: DEMO_CLINIC_ID
        })
        .select()
        .single();

      if (error) throw error;

      setEtapas(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
      throw error;
    }
  };

  // Função para editar nome da etapa
  const editarEtapa = async (etapaId: string, novoNome: string) => {
    try {
      const { error } = await supabase
        .from('etapas_kanban')
        .update({ nome: novoNome })
        .eq('id', etapaId);

      if (error) throw error;

      setEtapas(prev => prev.map(etapa => 
        etapa.id === etapaId 
          ? { ...etapa, nome: novoNome }
          : etapa
      ));
    } catch (error) {
      console.error('Erro ao editar etapa:', error);
      throw error;
    }
  };

  // Função para excluir etapa
  const excluirEtapa = async (etapaId: string, leads: any[]) => {
    try {
      // Verificar se há leads nesta etapa
      const leadsNaEtapa = leads.filter(lead => lead.etapa_kanban_id === etapaId);
      
      if (leadsNaEtapa.length > 0) {
        throw new Error('Não é possível excluir uma etapa que contém leads. Mova os leads para outra etapa primeiro.');
      }

      const { error } = await supabase
        .from('etapas_kanban')
        .delete()
        .eq('id', etapaId);

      if (error) throw error;

      setEtapas(prev => prev.filter(etapa => etapa.id !== etapaId));
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
      throw error;
    }
  };

  // Função para buscar etapas
  const buscarEtapas = async () => {
    try {
      const { data: etapasData, error: etapasError } = await supabase
        .from('etapas_kanban')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID)
        .order('ordem');

      if (etapasError) throw etapasError;
      setEtapas(etapasData || []);
      return etapasData || [];
    } catch (error) {
      console.error('Erro ao buscar etapas:', error);
      return [];
    }
  };

  return {
    etapas,
    setEtapas,
    criarEtapa,
    editarEtapa,
    excluirEtapa,
    buscarEtapas
  };
};
