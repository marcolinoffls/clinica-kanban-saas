
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import { toast } from 'sonner';

/**
 * Hook para gerenciar relatórios de análise de IA
 * 
 * O que faz:
 * - Controla a visibilidade do modal de criação de relatórios
 * - Gerencia o período selecionado pelo usuário
 * - Orquestra a chamada para a Edge Function de geração de relatórios
 * - Acompanha o status dos relatórios em andamento
 * 
 * Onde é usado:
 * - No DashboardPage para permitir a criação de relatórios
 * - No componente AIReportModal para gerenciar o estado
 * 
 * Como se conecta:
 * - Usa o contexto ClinicaContext para obter o ID da clínica
 * - Conecta-se à tabela ai_reports no Supabase
 * - Chama a Edge Function generate-ai-report
 */

interface AIReport {
  id: string;
  clinica_id: string;
  start_date: string;
  end_date: string;
  delivery_method: 'system' | 'whatsapp';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  report_content?: string;
  report_pdf_url?: string;
  phone_number?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface CreateReportData {
  start_date: Date;
  end_date: Date;
  delivery_method: 'system' | 'whatsapp';
  phone_number?: string;
}

export const useAIReport = () => {
  const { clinicaId } = useClinica();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<{
    start: Date | null;
    end: Date | null;
    filterName: string;
  }>({
    start: null,
    end: null,
    filterName: 'Últimos 30 dias'
  });

  // Query para buscar relatórios existentes da clínica
  const { data: reports = [], isLoading: isLoadingReports, refetch: refetchReports } = useQuery({
    queryKey: ['ai-reports', clinicaId],
    queryFn: async () => {
      if (!clinicaId) return [];
      
      const { data, error } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar relatórios:', error);
        throw error;
      }

      return data as AIReport[];
    },
    enabled: !!clinicaId,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Mutation para criar um novo relatório
  const createReportMutation = useMutation({
    mutationFn: async (reportData: CreateReportData) => {
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      console.log('📊 Criando novo relatório:', reportData);

      // 1. Criar registro na tabela ai_reports
      const { data: reportRecord, error: createError } = await supabase
        .from('ai_reports')
        .insert({
          clinica_id: clinicaId,
          start_date: reportData.start_date.toISOString(),
          end_date: reportData.end_date.toISOString(),
          delivery_method: reportData.delivery_method,
          phone_number: reportData.phone_number,
          status: 'pending'
        })
        .select()
        .single();

      if (createError || !reportRecord) {
        console.error('Erro ao criar registro do relatório:', createError);
        throw createError;
      }

      console.log('✅ Registro do relatório criado:', reportRecord.id);

      // 2. Chamar a Edge Function para processar o relatório
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('generate-ai-report', {
        body: {
          clinica_id: clinicaId,
          start_date: reportData.start_date.toISOString(),
          end_date: reportData.end_date.toISOString(),
          delivery_method: reportData.delivery_method,
          phone_number: reportData.phone_number,
          report_request_id: reportRecord.id
        }
      });

      if (functionError) {
        console.error('Erro na Edge Function:', functionError);
        
        // Atualizar status para falha
        await supabase
          .from('ai_reports')
          .update({ 
            status: 'failed', 
            error_message: functionError.message 
          })
          .eq('id', reportRecord.id);
        
        throw functionError;
      }

      console.log('✅ Edge Function executada com sucesso:', functionResponse);
      return reportRecord;
    },
    onSuccess: (data) => {
      toast.success('Relatório solicitado com sucesso! Aguarde o processamento.');
      refetchReports();
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error('❌ Erro ao criar relatório:', error);
      toast.error('Erro ao solicitar relatório. Tente novamente.');
    }
  });

  // Funções para controlar o modal
  const openModal = () => {
    console.log('📊 Abrindo modal de relatório');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Função para atualizar o período selecionado
  const updatePeriod = (start: Date | null, end: Date | null, filterName: string) => {
    setSelectedPeriod({ start, end, filterName });
  };

  // Função para criar um novo relatório
  const createReport = (reportData: CreateReportData) => {
    createReportMutation.mutate(reportData);
  };

  // Buscar relatórios em andamento
  const pendingReports = reports.filter(report => 
    report.status === 'pending' || report.status === 'processing'
  );

  const completedReports = reports.filter(report => 
    report.status === 'completed'
  );

  const failedReports = reports.filter(report => 
    report.status === 'failed'
  );

  return {
    // Estados do modal
    isModalOpen,
    openModal,
    closeModal,

    // Estados do período
    selectedPeriod,
    updatePeriod,

    // Estados dos relatórios
    reports,
    pendingReports,
    completedReports,
    failedReports,
    isLoa

Reports,

    // Ações
    createReport,
    isCreatingReport: createReportMutation.isPending,
    refetchReports,

    // Dados da clínica
    clinicaId
  };
};
