
import { useClinica } from '@/contexts/ClinicaContext';

/**
 * Hook para garantir uso da clínica fixa em desenvolvimento
 * 
 * Este hook:
 * - Força o uso da clínica de demonstração em todas as operações
 * - Substitui qualquer lógica que possa buscar diferentes clínicas
 * - Garante consistência entre recarregamentos de página
 * - Facilita desenvolvimento e testes
 * 
 * Uso:
 * - Substitua chamadas diretas ao useSupabaseData por este hook
 * - Use `clinicaId` em todas as operações que precisam do ID da clínica
 */

export const useClinicaFixa = () => {
  const { clinicaAtiva, clinicaId, isLoading, recarregarClinica } = useClinica();

  // Log para debug - confirmar que estamos sempre usando a mesma clínica
  console.log('Hook useClinicaFixa - Clínica ID:', clinicaId);

  return {
    // Dados da clínica ativa (sempre a mesma)
    clinica: clinicaAtiva,
    clinicaId, // ID fixo: '00000000-0000-0000-0000-000000000001'
    isLoading,
    
    // Função para recarregar dados da clínica se necessário
    recarregarClinica,
    
    // Funções de conveniência
    getNomeClinica: () => clinicaAtiva.nome,
    getIdClinica: () => clinicaId,
    
    // Para compatibilidade com código existente
    DEMO_CLINIC_ID: clinicaId
  };
};
