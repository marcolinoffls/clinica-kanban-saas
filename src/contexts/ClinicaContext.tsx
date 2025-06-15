
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useClinicaData } from '@/hooks/useClinicaData';

/**
 * Contexto da Clínica Ativa
 * 
 * Este contexto gerencia:
 * - A clínica do usuário autenticado (dados reais do Supabase)
 * - Integração com autenticação para obter o clinica_id do userProfile
 * - Estados de carregamento e erro
 * - Fornece dados da clínica para toda a aplicação
 * - Permite recarregamento dos dados quando necessário
 */

interface Clinica {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  // Novos campos adicionados para refletir a estrutura atual da tabela 'clinicas'.
  complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  horario_funcionamento?: any; // JSONB é mapeado para 'any' para flexibilidade.
  endereco_completo?: string;
  cnpj?: string;
  razao_social?: string;
  status?: string;
  plano_contratado?: string;
  evolution_instance_name?: string;
  // Campos de configuração da IA
  ai_active_for_all_new_leads?: boolean;
  ai_active_for_ad_leads_only?: boolean;
  ai_chat_suggestions_active?: boolean;
  ai_business_hours_start_weekday?: string;
  ai_business_hours_end_weekday?: string;
  ai_active_saturday?: boolean;
  ai_saturday_hours_start?: string;
  ai_saturday_hours_end?: string;
  ai_active_sunday?: boolean;
  ai_sunday_hours_start?: string;
  ai_sunday_hours_end?: string;
  ai_operating_mode?: string;
  ai_name?: string;
  ai_clinica_prompt?: string;
  ai_restricted_topics_prompt?: string;
  admin_prompt?: string;
}

interface ClinicaContextType {
  clinicaAtiva: Clinica | null;
  clinicaId: string | null;
  isLoading: boolean;
  error: Error | null;
  hasClinica: boolean;
  // Função para forçar recarregamento dos dados da clínica
  recarregarClinica: () => void;
}

const ClinicaContext = createContext<ClinicaContextType | undefined>(undefined);

interface ClinicaProviderProps {
  children: ReactNode;
}

export const ClinicaProvider = ({ children }: ClinicaProviderProps) => {
  // Hook para obter dados do usuário autenticado (inclui userProfile com clinica_id)
  const { userProfile, loading: authLoading, isAuthenticated } = useAuthUser();
  
  // Hook para buscar dados completos da clínica baseado no clinica_id do userProfile
  const { 
    clinica, 
    loading: clinicaLoading, 
    error: clinicaError, 
    hasClinica 
  } = useClinicaData();

  // Estados combinados para controle centralizado
  const isLoading = authLoading || clinicaLoading;
  const error = clinicaError;

  // Log para debug - mostrar o estado atual da autenticação e clínica
  useEffect(() => {
    console.log('[ClinicaContext] Estado atual:', {
      isAuthenticated,
      userProfile: userProfile ? { 
        id: userProfile.id, 
        clinica_id: userProfile.clinica_id,
        nome_completo: userProfile.nome_completo 
      } : null,
      clinica: clinica ? { 
        id: clinica.id, 
        nome: clinica.nome,
        email: clinica.email 
      } : null,
      isLoading,
      error: error?.message,
      hasClinica
    });
  }, [isAuthenticated, userProfile, clinica, isLoading, error, hasClinica]);

  // Função para recarregar dados da clínica
  const recarregarClinica = () => {
    console.log('[ClinicaContext] Solicitando recarregamento da clínica');
    // O recarregamento será implementado através do queryClient.invalidateQueries
    // no hook useClinicaData quando necessário
    window.location.reload(); // Fallback temporário
  };

  // Verificar se o usuário está autenticado mas não tem clínica associada
  useEffect(() => {
    if (isAuthenticated && userProfile && !userProfile.clinica_id && !authLoading) {
      console.warn('[ClinicaContext] Usuário autenticado mas sem clinica_id no perfil:', userProfile);
    }
  }, [isAuthenticated, userProfile, authLoading]);

  const contextValue: ClinicaContextType = {
    clinicaAtiva: clinica || null,
    clinicaId: clinica?.id || null,
    isLoading,
    error,
    hasClinica,
    recarregarClinica
  };

  return (
    <ClinicaContext.Provider value={contextValue}>
      {children}
    </ClinicaContext.Provider>
  );
};

// Hook personalizado para usar o contexto da clínica
export const useClinica = () => {
  const context = useContext(ClinicaContext);
  
  if (context === undefined) {
    throw new Error('useClinica deve ser usado dentro de um ClinicaProvider');
  }
  
  return context;
};

// Hook que retorna apenas o ID da clínica (para compatibilidade com código existente)
export const useClinicaId = () => {
  const { clinicaId } = useClinica();
  return clinicaId;
};
