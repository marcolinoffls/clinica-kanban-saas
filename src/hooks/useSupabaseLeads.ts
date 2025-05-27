
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar leads no Supabase
 * 
 * Funcionalidades:
 * - Buscar, criar, atualizar e excluir leads
 * - Mover leads entre etapas do kanban
 * - Buscar consultas de um lead específico
 * - Validação de dados antes de enviar ao banco
 */

// ID da clínica de demonstração (em produção viria do contexto do usuário)
const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

export const useSupabaseLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);

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
      throw error;
    }
  };

  // Função para salvar lead com validação
  const salvarLead = async (leadData: any) => {
    try {
      // Validação local antes de enviar
      if (!leadData.nome?.trim()) {
        throw new Error('Nome do lead é obrigatório');
      }
      if (!leadData.telefone?.trim()) {
        throw new Error('Telefone do lead é obrigatório');
      }

      console.log('💾 Salvando lead com dados:', leadData);

      // Verificar corretamente se é edição (deve ter ID no leadData)
      if (leadData.id) {
        // Atualizar lead existente
        console.log('📝 Atualizando lead existente com ID:', leadData.id);
        
        const updateData = {
          nome: leadData.nome.trim(),
          telefone: leadData.telefone.trim(),
          email: leadData.email?.trim() || null,
          anotacoes: leadData.anotacoes?.trim() || null,
          tag_id: leadData.tag_id || null,
          origem_lead: leadData.origem_lead || null,
          servico_interesse: leadData.servico_interesse || null,
          updated_at: new Date().toISOString()
        };

        console.log('📝 Dados para atualização:', updateData);

        const { error } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', leadData.id)
          .eq('clinica_id', DEMO_CLINIC_ID);

        if (error) {
          console.error('❌ Erro na atualização:', error);
          throw error;
        }

        console.log('✅ Lead atualizado com sucesso');

        // Atualizar estado local mantendo a ordenação
        setLeads(prev => {
          const leadsAtualizados = prev.map(lead => 
            lead.id === leadData.id ? { ...lead, ...updateData } : lead
          );
          
          // Re-ordenar por data_ultimo_contato após atualização
          return leadsAtualizados.sort((a, b) => {
            const dataA = a.data_ultimo_contato ? new Date(a.data_ultimo_contato).getTime() : 0;
            const dataB = b.data_ultimo_contato ? new Date(b.data_ultimo_contato).getTime() : 0;
            return dataB - dataA; // Mais recente primeiro
          });
        });
      } else {
        // Criar novo lead
        console.log('➕ Criando novo lead');
        
        const insertData = {
          nome: leadData.nome.trim(),
          telefone: leadData.telefone.trim(),
          email: leadData.email?.trim() || null,
          anotacoes: leadData.anotacoes?.trim() || null,
          tag_id: leadData.tag_id || null,
          origem_lead: leadData.origem_lead || null,
          servico_interesse: leadData.servico_interesse || null,
          clinica_id: DEMO_CLINIC_ID,
          etapa_kanban_id: null // Será definido no hook principal
        };

        console.log('➕ Dados para inserção:', insertData);

        const { data, error } = await supabase
          .from('leads')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('❌ Erro na inserção:', error);
          throw error;
        }

        console.log('✅ Novo lead criado com sucesso:', data);

        // Adicionar ao estado local
        setLeads(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar lead:', error);
      throw error;
    }
  };

  // Função para excluir lead
  const excluirLead = async (leadId: string) => {
    try {
      console.log('🗑️ Excluindo lead:', leadId);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('clinica_id', DEMO_CLINIC_ID);

      if (error) throw error;

      // Atualizar estado local removendo o lead da lista
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      
      console.log('✅ Lead excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      throw error;
    }
  };

  // Função para buscar consultas de um lead específico
  const buscarConsultasLead = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('cliente_id', leadId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      return [];
    }
  };

  // Função para buscar leads
  const buscarLeads = async () => {
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID)
        .order('data_ultimo_contato', { ascending: false })
        .order('updated_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);
      return leadsData || [];
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      return [];
    }
  };

  return {
    leads,
    setLeads,
    moverLead,
    salvarLead,
    excluirLead,
    buscarConsultasLead,
    buscarLeads
  };
};
