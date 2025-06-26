
import { useState, useEffect } from 'react';
import { useClinica } from '@/contexts/ClinicaContext';
import { Lead } from '@/hooks/useLeadsData';

/**
 * Hook para controlar a ativação da IA por conversa
 * 
 * Este hook gerencia:
 * - Estado local da ativação da IA para uma conversa específica
 * - Lógica de inicialização baseada nas configurações globais da clínica
 * - Persistência do estado no banco de dados
 * - Aplicação das regras de ativação automática
 * 
 * Regras de ativação:
 * 1. Se o lead já tem ai_conversation_enabled definido, usar esse valor
 * 2. Se NULL, aplicar configurações globais:
 *    - ai_active_for_all_new_leads = true -> ativar
 *    - ai_active_for_ad_leads_only = true E origem é de anúncio -> ativar
 *    - Caso contrário -> desativar
 */

interface UseAIConversationControlProps {
  selectedLead: Lead | null;
  updateLeadAiConversationStatus: (params: { leadId: string; aiEnabled: boolean }) => Promise<any>; // Mudança: aceitar qualquer tipo de retorno
}

export const useAIConversationControl = ({
  selectedLead,
  updateLeadAiConversationStatus
}: UseAIConversationControlProps) => {
  const { clinicaAtiva } = useClinica();
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Função para determinar se um lead é de origem de anúncio
  const isLeadFromAd = (lead: Lead): boolean => {
    const origemLead = lead.origem_lead?.toLowerCase() || '';
    
    // Lista de termos que indicam origem de anúncio
    const adOrigins = [
      'facebook',
      'google ads',
      'instagram',
      'anuncio',
      'anúncio',
      'ads',
      'publicidade',
      'campanha',
      'meta',
      'tiktok',
      'youtube'
    ];
    
    return adOrigins.some(origin => origemLead.includes(origin));
  };

  // Função para determinar o estado inicial da IA baseado nas configurações globais
  const determineInitialAIState = (lead: Lead): boolean => {
    if (!clinicaAtiva) {
      console.warn('⚠️ [useAIConversationControl] Clínica não carregada, desativando IA por segurança');
      return false;
    }

    console.log('🤖 [useAIConversationControl] Determinando estado inicial da IA para lead:', lead.nome);
    console.log('- Configurações da clínica:', {
      ai_active_for_all_new_leads: clinicaAtiva.ai_active_for_all_new_leads,
      ai_active_for_ad_leads_only: clinicaAtiva.ai_active_for_ad_leads_only,
      origem_lead: lead.origem_lead
    });

    // Regra 1: IA ativa para todos os novos leads
    if (clinicaAtiva.ai_active_for_all_new_leads === true) {
      console.log('✅ IA ativada: configuração global para todos os leads');
      return true;
    }

    // Regra 2: IA ativa apenas para leads de anúncio
    if (clinicaAtiva.ai_active_for_ad_leads_only === true && isLeadFromAd(lead)) {
      console.log('✅ IA ativada: lead de anúncio detectado');
      return true;
    }

    console.log('❌ IA desativada: não atende às configurações globais');
    return false;
  };

  // Efeito para inicializar o estado da IA quando o lead selecionado mudar
  useEffect(() => {
    if (!selectedLead) {
      setAiEnabled(false);
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);

    console.log('🔄 [useAIConversationControl] Inicializando estado da IA para lead:', {
      leadId: selectedLead.id,
      nome: selectedLead.nome,
      ai_conversation_enabled: selectedLead.ai_conversation_enabled
    });

    // Se o lead já tem um valor definido para ai_conversation_enabled, usar esse valor
    if (selectedLead.ai_conversation_enabled !== null && selectedLead.ai_conversation_enabled !== undefined) {
      console.log('📋 Usando estado persistido da IA:', selectedLead.ai_conversation_enabled);
      setAiEnabled(selectedLead.ai_conversation_enabled);
      setIsInitializing(false);
      return;
    }

    // Se não tem valor definido, aplicar configurações globais
    const initialState = determineInitialAIState(selectedLead);
    setAiEnabled(initialState);

    // Persistir o estado inicial determinado pelas configurações globais
    console.log('💾 Persistindo estado inicial da IA:', initialState);
    
    // Usar timeout para evitar conflitos com outros useEffects
    const timer = setTimeout(async () => {
      try {
        await updateLeadAiConversationStatus({
          leadId: selectedLead.id,
          aiEnabled: initialState
        });
        console.log('✅ Estado inicial da IA persistido com sucesso');
      } catch (error) {
        console.error('❌ Erro ao persistir estado inicial da IA:', error);
      } finally {
        setIsInitializing(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedLead?.id, clinicaAtiva?.ai_active_for_all_new_leads, clinicaAtiva?.ai_active_for_ad_leads_only]);

  // Função para alternar o estado da IA
  const toggleAI = async () => {
    if (!selectedLead || isInitializing || isUpdating) {
      console.warn('⚠️ [useAIConversationControl] Não é possível alternar IA:', {
        selectedLead: !!selectedLead,
        isInitializing,
        isUpdating
      });
      return;
    }

    const newState = !aiEnabled;
    console.log('🔄 [useAIConversationControl] Alternando IA:', {
      leadId: selectedLead.id,
      leadNome: selectedLead.nome,
      estadoAtual: aiEnabled,
      novoEstado: newState
    });

    setIsUpdating(true);

    try {
      // Atualizar estado local imediatamente para responsividade
      setAiEnabled(newState);

      // Persistir no banco de dados
      await updateLeadAiConversationStatus({
        leadId: selectedLead.id,
        aiEnabled: newState
      });

      console.log('✅ Estado da IA alternado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao alternar estado da IA:', error);
      // Reverter estado local em caso de erro
      setAiEnabled(aiEnabled);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    aiEnabled,
    toggleAI,
    isInitializing,
    isUpdating
  };
};
