
import { useAdminCheck } from './useAdminCheck';
import { useAdminClinicOperations } from './useAdminClinicOperations';
import { useClinicaOperations } from './useClinicaOperations';

/**
 * Hook unificado para operações de leads (admin e usuário normal)
 * 
 * O que faz:
 * - Detecta automaticamente se é admin ou usuário normal
 * - Redireciona para as operações apropriadas
 * - Mantém interface consistente entre modos
 * 
 * Onde é usado:
 * - Componentes que precisam criar leads independente do tipo de usuário
 * - Modals e forms de criação de leads
 * 
 * Como se conecta:
 * - useAdminCheck para detectar privilégios
 * - useAdminClinicOperations para operações admin
 * - useClinicaOperations para operações normais
 */
export const useAdminLeadOperations = (targetClinicaId?: string) => {
  const { isAdmin } = useAdminCheck();
  const adminOps = useAdminClinicOperations();
  const normalOps = useClinicaOperations();

  // Função unificada para criar lead
  const createLead = async (leadData: any) => {
    console.log('🔄 [useAdminLeadOperations] Criando lead. Admin:', isAdmin, 'Target Clinic:', targetClinicaId);
    
    if (isAdmin && targetClinicaId) {
      // Admin criando lead para clínica específica
      return adminOps.createLeadForClinic({
        ...leadData,
        clinica_id: targetClinicaId
      });
    } else {
      // Usuário normal criando lead para sua própria clínica
      return normalOps.createLead(leadData);
    }
  };

  const isCreatingLead = isAdmin && targetClinicaId 
    ? adminOps.isCreatingLead 
    : normalOps.isCreatingLead;

  return {
    createLead,
    isCreatingLead,
    isAdmin,
    targetClinicaId
  };
};
