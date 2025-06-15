
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar dados de Follow-up
 * 
 * O que faz:
 * - Gerencia campanhas, templates e execuções de follow-up
 * - Permite criar campanhas automáticas e manuais
 * - Controla templates sequenciais de mensagens
 * - Monitora execuções e status de envio
 * 
 * Onde é usado:
 * - Página de configuração de follow-up
 * - Interface de follow-up manual nos cards e chat
 * - Dashboard de métricas de follow-up
 * 
 * Como se conecta:
 * - Usa as tabelas follow_up_campaigns, follow_up_templates, follow_up_execucoes
 * - Integra com RLS baseado na clínica do usuário
 * - Conecta com sistema de leads para controle de follow-up
 */

// Tipos das entidades de follow-up
export interface FollowupCampaign {
  id: string;
  clinica_id: string;
  nome: string;
  descricao?: string;
  tipo: 'automatico' | 'manual';
  ativo: boolean;
  dias_inatividade: number;
  horario_envio?: string;
  apenas_dias_uteis?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FollowupTemplate {
  id: string;
  campaign_id: string;
  sequencia: number;
  titulo: string;
  conteudo: string;
  tipo_mensagem?: 'text' | 'image' | 'audio';
  intervalo_dias: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FollowupExecution {
  id: string;
  lead_id: string;
  campaign_id: string;
  template_id: string;
  tipo_execucao: 'automatico' | 'manual';
  status: 'pendente' | 'enviado' | 'erro' | 'cancelado';
  data_agendada: string;
  data_enviado?: string;
  mensagem_id?: string;
  erro_detalhes?: string;
  user_id_manual?: string;
  created_at?: string;
  updated_at?: string;
}

// Hook para buscar campanhas de follow-up
export const useFollowupCampaigns = () => {
  return useQuery({
    queryKey: ['followup-campaigns'],
    queryFn: async (): Promise<FollowupCampaign[]> => {
      console.log('🔄 Buscando campanhas de follow-up...');

      const { data, error } = await supabase
        .from('follow_up_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar campanhas:', error);
        throw new Error(`Erro ao buscar campanhas: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} campanhas encontradas`);
      
      // Type assertion para garantir que os tipos do Supabase sejam tratados corretamente
      return (data || []).map(campaign => ({
        ...campaign,
        tipo: campaign.tipo as 'automatico' | 'manual'
      }));
    },
    staleTime: 30000, // Cache por 30 segundos
  });
};

// Hook para buscar templates de uma campanha específica
export const useFollowupTemplates = (campaignId: string | null) => {
  return useQuery({
    queryKey: ['followup-templates', campaignId],
    queryFn: async (): Promise<FollowupTemplate[]> => {
      if (!campaignId) return [];

      console.log('🔄 Buscando templates da campanha:', campaignId);

      const { data, error } = await supabase
        .from('follow_up_templates')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sequencia', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar templates:', error);
        throw new Error(`Erro ao buscar templates: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} templates encontrados`);
      
      // Type assertion para garantir que os tipos do Supabase sejam tratados corretamente
      return (data || []).map(template => ({
        ...template,
        tipo_mensagem: template.tipo_mensagem as 'text' | 'image' | 'audio'
      }));
    },
    enabled: !!campaignId,
    staleTime: 30000,
  });
};

// Hook para criar nova campanha
export const useCreateFollowupCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignData: Omit<FollowupCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<FollowupCampaign> => {
      console.log('🔄 Criando nova campanha de follow-up:', campaignData);

      const { data, error } = await supabase
        .from('follow_up_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar campanha:', error);
        throw new Error(`Erro ao criar campanha: ${error.message}`);
      }

      console.log('✅ Campanha criada com sucesso:', data);
      
      // Type assertion para garantir que o tipo seja tratado corretamente
      return {
        ...data,
        tipo: data.tipo as 'automatico' | 'manual'
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followup-campaigns'] });
      toast.success('Campanha de follow-up criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na criação da campanha:', error);
      toast.error(`Erro ao criar campanha: ${error.message}`);
    },
  });
};

// Hook para criar template
export const useCreateFollowupTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: Omit<FollowupTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<FollowupTemplate> => {
      console.log('🔄 Criando novo template:', templateData);

      const { data, error } = await supabase
        .from('follow_up_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar template:', error);
        throw new Error(`Erro ao criar template: ${error.message}`);
      }

      console.log('✅ Template criado com sucesso:', data);
      
      // Type assertion para garantir que o tipo seja tratado corretamente
      return {
        ...data,
        tipo_mensagem: data.tipo_mensagem as 'text' | 'image' | 'audio'
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['followup-templates', data.campaign_id] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na criação do template:', error);
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });
};

// Hook para criar execução manual de follow-up
export const useCreateFollowupExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (executionData: {
      lead_id: string;
      campaign_id: string;
      template_id: string;
      tipo_execucao: 'automatico' | 'manual';
      data_agendada: string;
      user_id_manual?: string;
    }): Promise<FollowupExecution> => {
      console.log('🔄 Criando execução de follow-up:', executionData);

      const { data, error } = await supabase
        .from('follow_up_execucoes')
        .insert([executionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar execução:', error);
        throw new Error(`Erro ao criar execução: ${error.message}`);
      }

      console.log('✅ Execução criada com sucesso:', data);
      
      // Type assertion para garantir que o tipo seja tratado corretamente
      return {
        ...data,
        tipo_execucao: data.tipo_execucao as 'automatico' | 'manual',
        status: data.status as 'pendente' | 'enviado' | 'erro' | 'cancelado'
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followup-executions'] });
      toast.success('Follow-up agendado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na criação da execução:', error);
      toast.error(`Erro ao agendar follow-up: ${error.message}`);
    },
  });
};

// Hook para buscar execuções pendentes de um lead
export const useLeadFollowupExecutions = (leadId: string | null) => {
  return useQuery({
    queryKey: ['followup-executions', leadId],
    queryFn: async (): Promise<FollowupExecution[]> => {
      if (!leadId) return [];

      console.log('🔄 Buscando execuções do lead:', leadId);

      const { data, error } = await supabase
        .from('follow_up_execucoes')
        .select(`
          *,
          campaign:follow_up_campaigns(nome),
          template:follow_up_templates(titulo, conteudo)
        `)
        .eq('lead_id', leadId)
        .order('data_agendada', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar execuções:', error);
        throw new Error(`Erro ao buscar execuções: ${error.message}`);
      }

      // Type assertion para garantir que os tipos sejam tratados corretamente
      return (data || []).map(execution => ({
        ...execution,
        tipo_execucao: execution.tipo_execucao as 'automatico' | 'manual',
        status: execution.status as 'pendente' | 'enviado' | 'erro' | 'cancelado'
      }));
    },
    enabled: !!leadId,
    staleTime: 30000,
  });
};

// Hook para atualizar status de execução
export const useUpdateFollowupExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      data_enviado, 
      mensagem_id, 
      erro_detalhes 
    }: {
      id: string;
      status: 'pendente' | 'enviado' | 'erro' | 'cancelado';
      data_enviado?: string;
      mensagem_id?: string;
      erro_detalhes?: string;
    }): Promise<FollowupExecution> => {
      console.log('🔄 Atualizando execução:', id, status);

      const updateData: any = { status };
      if (data_enviado) updateData.data_enviado = data_enviado;
      if (mensagem_id) updateData.mensagem_id = mensagem_id;
      if (erro_detalhes) updateData.erro_detalhes = erro_detalhes;

      const { data, error } = await supabase
        .from('follow_up_execucoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar execução:', error);
        throw new Error(`Erro ao atualizar execução: ${error.message}`);
      }

      console.log('✅ Execução atualizada:', data);
      
      // Type assertion para garantir que o tipo seja tratado corretamente
      return {
        ...data,
        tipo_execucao: data.tipo_execucao as 'automatico' | 'manual',
        status: data.status as 'pendente' | 'enviado' | 'erro' | 'cancelado'
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followup-executions'] });
    },
    onError: (error: Error) => {
      console.error('❌ Erro na atualização da execução:', error);
      toast.error(`Erro ao atualizar execução: ${error.message}`);
    },
  });
};

// Hook para pausar/despausar follow-up de um lead
export const useToggleLeadFollowup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      leadId, 
      pausado 
    }: { 
      leadId: string; 
      pausado: boolean; 
    }): Promise<void> => {
      console.log('🔄 Alterando status de follow-up do lead:', leadId, pausado);

      const { error } = await supabase
        .from('leads')
        .update({ 
          follow_up_pausado: pausado,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) {
        console.error('❌ Erro ao alterar follow-up:', error);
        throw new Error(`Erro ao alterar follow-up: ${error.message}`);
      }

      console.log('✅ Follow-up do lead alterado com sucesso');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(
        variables.pausado 
          ? 'Follow-up pausado para este lead' 
          : 'Follow-up reativado para este lead'
      );
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao alterar follow-up:', error);
      toast.error(`Erro ao alterar follow-up: ${error.message}`);
    },
  });
};
