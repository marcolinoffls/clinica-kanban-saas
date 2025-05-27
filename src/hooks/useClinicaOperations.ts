// src/hooks/useClinicaOperations.ts

import { useAuthUser } from './useAuthUser'; // Hook para obter o perfil do usuário autenticado
import { useClinicaData } from './useClinicaData'; // Hook para obter dados da clínica, incluindo clinicaId
import { useCreateLead, CreateLeadData } from './useLeadsData'; // Hook de mutação para criar leads
import { useCreateEtapa, CreateEtapaData } from './useEtapasData'; // Hook de mutação para criar etapas
import { useCreateTag, CreateTagData } from './useTagsData'; // Hook de mutação para criar tags

// Tipos para os dados de entrada das funções de criação,
// omitindo clinica_id pois será adicionado automaticamente.
type LeadInputData = Omit<CreateLeadData, 'clinica_id'>;
type EtapaInputData = Omit<CreateEtapaData, 'clinica_id'>;
type TagInputData = Omit<CreateTagData, 'clinica_id'>;


/**
 * Hook `useClinicaOperations`
 * 
 * Facilita a execução de operações comuns relacionadas à clínica (como criar leads, etapas, tags),
 * associando-as automaticamente à `clinica_id` do usuário logado.
 * Centraliza a lógica de obtenção do `clinicaId` e o adiciona aos dados antes da mutação.
 * Também expõe os estados de carregamento dessas operações.
 */
export const useClinicaOperations = () => {
  // 1. Obter o perfil completo do usuário (inclui dados de auth e da tabela user_profiles).
  //    `userProfile` pode conter informações como nome, tipo de perfil, etc.
  //    `authLoading` (do useAuthUser, implícito aqui) indica se os dados básicos de auth estão carregando.
  const { userProfile, loading: authUserLoading } = useAuthUser();

  // 2. Obter o `clinicaId` e o estado de carregamento dos dados da clínica.
  //    `clinicaDataLoading` indica se os detalhes da clínica (incluindo seu ID) estão carregando.
  const { clinicaId, loading: clinicaDataLoading, error: clinicaDataError } = useClinicaData();
  
  // Hooks de mutação do @tanstack/react-query para cada tipo de criação.
  // Estes hooks lidam com a chamada à API/Supabase e gerenciam estados de pending, error, success.
  const createLeadMutation = useCreateLead();
  const createEtapaMutation = useCreateEtapa();
  const createTagMutation = useCreateTag();

  // Log de desenvolvimento para monitorar os valores chave recebidos dos outros hooks.
  // Útil para diagnosticar por que `clinicaId` poderia ser nulo.
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[useClinicaOperations DEV_LOG] Iniciando. AuthUser Loading:', authUserLoading, 
      'ClinicaData Loading:', clinicaDataLoading,
      'ClinicaData Error:', clinicaDataError,
      'UserProfile:', userProfile, 
      'ClinicaId recebido:', clinicaId
    );
  }

  // Função auxiliar para verificar se os dados necessários estão prontos antes de uma operação.
  // Lança um erro se não estiverem, prevenindo a execução da mutação.
  const ensureClinicaReady = () => {
    if (authUserLoading || clinicaDataLoading) {
      const errorMessage = "Operação não permitida: Dados de autenticação ou da clínica ainda estão carregando.";
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[useClinicaOperations DEV_LOG] ensureClinicaReady: ${errorMessage}`);
      }
      // Em um cenário real, você pode querer que o componente que chama desabilite o botão
      // em vez de lançar um erro aqui, mas para robustez do hook, esta verificação é útil.
      throw new Error(errorMessage); 
    }

    if (clinicaDataError) {
        const errorMessage = `Operação não permitida: Erro ao carregar dados da clínica (${clinicaDataError.message}).`;
        if (process.env.NODE_ENV === 'development') {
            console.error(`[useClinicaOperations DEV_LOG] ensureClinicaReady: ${errorMessage}`);
        }
        throw new Error(errorMessage);
    }

    if (!clinicaId) {
      const errorMessage = 'Operação não permitida: O usuário não possui uma clínica associada ou o ID da clínica não pôde ser carregado.';
      if (process.env.NODE_ENV === 'development') {
        console.error(`[useClinicaOperations DEV_LOG] ensureClinicaReady: ${errorMessage}. UserProfile:`, userProfile);
      }
      throw new Error(errorMessage);
    }
    // Se tudo estiver OK, retorna o clinicaId para uso.
    return clinicaId;
  };

  // Função para criar um novo lead, automaticamente associado à clínica do usuário.
  const createLead = async (leadData: LeadInputData) => {
    // Garante que clinicaId está disponível antes de prosseguir. Lança erro se não estiver.
    const currentClinicaId = ensureClinicaReady(); 

    // Monta o objeto de dados completo para a criação do lead, incluindo o clinica_id.
    const createData: CreateLeadData = {
      ...leadData,
      clinica_id: currentClinicaId, // Adiciona o clinica_id obtido.
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[useClinicaOperations DEV_LOG] createLead: Dados para mutação ->', createData);
    }
    // Executa a mutação para criar o lead.
    return createLeadMutation.mutateAsync(createData);
  };

  // Função para criar uma nova etapa Kanban, automaticamente associada à clínica.
  const createEtapa = async (etapaData: EtapaInputData) => {
    const currentClinicaId = ensureClinicaReady();

    const createData: CreateEtapaData = {
      ...etapaData,
      clinica_id: currentClinicaId,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[useClinicaOperations DEV_LOG] createEtapa: Dados para mutação ->', createData);
    }
    return createEtapaMutation.mutateAsync(createData);
  };

  // Função para criar uma nova tag, automaticamente associada à clínica.
  const createTag = async (tagData: TagInputData) => {
    const currentClinicaId = ensureClinicaReady();

    const createData: CreateTagData = {
      ...tagData,
      clinica_id: currentClinicaId,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[useClinicaOperations DEV_LOG] createTag: Dados para mutação ->', createData);
    }
    return createTagMutation.mutateAsync(createData);
  };

  // Estados de carregamento (isPending) das respectivas mutações.
  // Útil para a UI mostrar indicadores de carregamento.
  const isCreatingLead = createLeadMutation.isPending;
  const isCreatingEtapa = createEtapaMutation.isPending;
  const isCreatingTag = createTagMutation.isPending;

  // Determina se o usuário pode criar dados.
  // Verdadeiro se não houver carregamentos pendentes, não houver erro ao buscar dados da clínica, e clinicaId existir.
  const canPerformOperations = !authUserLoading && !clinicaDataLoading && !clinicaDataError && !!clinicaId;
  if (process.env.NODE_ENV === 'development') {
    console.log('[useClinicaOperations DEV_LOG] canPerformOperations:', canPerformOperations);
  }

  // Retorna as funções de criação, estados de loading, e dados úteis.
  return {
    createLead,
    createEtapa,
    createTag,
    
    isCreatingLead,
    isCreatingEtapa,
    isCreatingTag,
    
    // Expõe clinicaId e userProfile caso sejam úteis diretamente para o componente consumidor.
    clinicaId: clinicaId || null, // Garante que seja string | null
    userProfile: userProfile || null, // Garante que seja UserProfile | null
    
    // Flag consolidada para verificar se as operações de criação podem ser executadas.
    // Substitui o `canCreateData` anterior por uma verificação mais robusta.
    canPerformOperations, 
  };
};