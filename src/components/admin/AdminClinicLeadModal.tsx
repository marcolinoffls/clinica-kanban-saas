
import { useState } from 'react';
import { LeadModal } from '@/components/kanban/LeadModal';
import { useAdminLeadOperations } from '@/hooks/useAdminLeadOperations';
import { useSupabaseData } from '@/hooks/useSupabaseData';

/**
 * Modal para criação/edição de leads no contexto admin
 * 
 * O que faz:
 * - Encapsula o LeadModal padrão com lógica admin
 * - Garante que leads são criados para a clínica correta
 * - Mantém compatibilidade com a interface existente
 * 
 * Onde é usado:
 * - Páginas admin quando precisam criar/editar leads
 * - Substitui o LeadModal padrão em contexto admin
 * 
 * Como se conecta:
 * - useAdminLeadOperations para operações de lead
 * - LeadModal existente para interface
 * - Passa clinica_id correto para as operações
 */

interface AdminClinicLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: any;
  targetClinicaId: string;
  etapas: any[];
}

export const AdminClinicLeadModal = ({ 
  isOpen, 
  onClose, 
  lead, 
  targetClinicaId,
  etapas 
}: AdminClinicLeadModalProps) => {
  const { createLead } = useAdminLeadOperations(targetClinicaId);

  // Função para salvar lead com clínica específica
  const handleSaveLead = async (leadData: any) => {
    console.log('💾 [AdminClinicLeadModal] Salvando lead para clínica:', targetClinicaId);
    
    try {
      await createLead({
        ...leadData,
        clinica_id: targetClinicaId // Garantir que usa a clínica correta
      });
      onClose();
    } catch (error) {
      console.error('❌ [AdminClinicLeadModal] Erro ao salvar lead:', error);
      throw error; // Permitir que o modal trate o erro
    }
  };

  return (
    <LeadModal
      isOpen={isOpen}
      onClose={onClose}
      lead={lead}
      etapas={etapas}
      onSave={handleSaveLead}
    />
  );
};
