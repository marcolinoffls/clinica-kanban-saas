
import { useAuthUser } from './useAuthUser';
import { useClinicaData } from './useClinicaData';
import { useCreateLead } from './useLeadsData';
import { useCreateEtapa } from './useEtapasData';
import { useCreateTag } from './useTagsData';

/**
 * Hook que facilita operações comuns da clínica
 * 
 * Este hook fornece funções simplificadas para criar dados
 * já associados automaticamente à clínica do usuário logado,
 * eliminando a necessidade de passar clinica_id manualmente.
 */

export const useClinicaOperations = () => {
  const { userProfile } = useAuthUser();
  const { clinicaId } = useClinicaData();
  
  const createLeadMutation = useCreateLead();
  const createEtapaMutation = useCreateEtapa();
  const createTagMutation = useCreateTag();

  // Função para criar lead automaticamente associado à clínica
  const createLead = async (leadData: {
    nome: string;
    telefone?: string;
    email?: string;
    etapa_kanban_id?: string;
    tag_id?: string;
    anotacoes?: string;
    origem_lead?: string;
    servico_interesse?: string;
  }) => {
    if (!clinicaId) {
      throw new Error('Usuário não possui clínica associada');
    }

    return createLeadMutation.mutateAsync({
      ...leadData,
      clinica_id: clinicaId,
    });
  };

  // Função para criar etapa automaticamente associada à clínica
  const createEtapa = async (etapaData: {
    nome: string;
    ordem: number;
  }) => {
    if (!clinicaId) {
      throw new Error('Usuário não possui clínica associada');
    }

    return createEtapaMutation.mutateAsync({
      ...etapaData,
      clinica_id: clinicaId,
    });
  };

  // Função para criar tag automaticamente associada à clínica
  const createTag = async (tagData: {
    nome: string;
    cor?: string;
  }) => {
    if (!clinicaId) {
      throw new Error('Usuário não possui clínica associada');
    }

    return createTagMutation.mutateAsync({
      ...tagData,
      clinica_id: clinicaId,
    });
  };

  // Estados de loading combinados
  const isCreatingLead = createLeadMutation.isPending;
  const isCreatingEtapa = createEtapaMutation.isPending;
  const isCreatingTag = createTagMutation.isPending;

  return {
    // Funções de criação simplificadas
    createLead,
    createEtapa,
    createTag,
    
    // Estados de loading
    isCreatingLead,
    isCreatingEtapa,
    isCreatingTag,
    
    // Dados úteis
    clinicaId,
    userProfile,
    
    // Verificação se usuário pode criar dados
    canCreateData: !!clinicaId,
  };
};
