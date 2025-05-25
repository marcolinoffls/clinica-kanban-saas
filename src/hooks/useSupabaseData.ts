
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook personalizado para gerenciar dados do Supabase
 * 
 * Funcionalidades:
 * - Conecta com as tabelas do Supabase
 * - Gerencia estado dos dados
 * - Fornece funções para CRUD
 * - Simula clínica atual (em produção seria baseada no usuário logado)
 */

// ID da clínica de demonstração (em produção viria do contexto do usuário)
const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

export const useSupabaseData = () => {
  const [etapas, setEtapas] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configura a clínica atual para as políticas RLS
  useEffect(() => {
    const setClinicContext = async () => {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_clinic_id',
        setting_value: DEMO_CLINIC_ID,
        is_local: false
      });
    };
    setClinicContext();
  }, []);

  // Buscar dados iniciais do Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar etapas ordenadas
      const { data: etapasData, error: etapasError } = await supabase
        .from('etapas_kanban')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID)
        .order('ordem');

      if (etapasError) throw etapasError;

      // Buscar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID);

      if (leadsError) throw leadsError;

      // Buscar tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID);

      if (tagsError) throw tagsError;

      // Buscar consultas
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID);

      if (consultasError) throw consultasError;

      setEtapas(etapasData || []);
      setLeads(leadsData || []);
      setTags(tagsData || []);
      setConsultas(consultasData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Função para mover lead entre etapas
  const moverLead = async (leadId: string, novaEtapaId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          etapa_kanban_id: novaEtapaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Atualizar estado local
      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, etapa_kanban_id: novaEtapaId }
          : lead
      ));
    } catch (error) {
      console.error('Erro ao mover lead:', error);
    }
  };

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

  // Função para salvar lead
  const salvarLead = async (leadData: any) => {
    try {
      if (leadData.id) {
        // Atualizar lead existente
        const { error } = await supabase
          .from('leads')
          .update({
            ...leadData,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadData.id);

        if (error) throw error;

        setLeads(prev => prev.map(lead => 
          lead.id === leadData.id ? { ...lead, ...leadData } : lead
        ));
      } else {
        // Criar novo lead
        const { data, error } = await supabase
          .from('leads')
          .insert({
            ...leadData,
            clinica_id: DEMO_CLINIC_ID,
            etapa_kanban_id: etapas[0]?.id // Primeira etapa por padrão
          })
          .select()
          .single();

        if (error) throw error;

        setLeads(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      throw error;
    }
  };

  // Função para buscar consultas de um lead específico
  const buscarConsultasLead = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('consultas')
        .select('*')
        .eq('lead_id', leadId)
        .order('data_consulta', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      return [];
    }
  };

  return {
    etapas,
    leads,
    tags,
    consultas,
    loading,
    moverLead,
    criarEtapa,
    editarEtapa,
    salvarLead,
    buscarConsultasLead,
    refetch: fetchData
  };
};
