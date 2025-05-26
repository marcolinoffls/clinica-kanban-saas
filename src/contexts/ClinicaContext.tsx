
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Contexto da Clínica Ativa
 * 
 * Este contexto gerencia:
 * - A clínica atualmente ativa no sistema
 * - Garante que sempre seja usada a mesma clínica de demonstração
 * - Fornece dados da clínica para toda a aplicação
 * - Evita mudanças de clínica entre recarregamentos de página
 */

// ID fixo da clínica de demonstração (mesmo usado no useSupabaseData)
const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

interface Clinica {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cnpj?: string;
  evolution_instance_name?: string;
}

interface ClinicaContextType {
  clinicaAtiva: Clinica;
  clinicaId: string;
  isLoading: boolean;
  // Função para forçar recarregamento dos dados da clínica se necessário
  recarregarClinica: () => void;
}

const ClinicaContext = createContext<ClinicaContextType | undefined>(undefined);

interface ClinicaProviderProps {
  children: ReactNode;
}

export const ClinicaProvider = ({ children }: ClinicaProviderProps) => {
  const [clinicaAtiva, setClinicaAtiva] = useState<Clinica>({
    id: DEMO_CLINIC_ID,
    nome: 'Clínica Exemplo',
    email: 'contato@clinicaexemplo.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua Exemplo, 123 - São Paulo/SP',
    cnpj: '00.000.000/0001-00'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Função para garantir que sempre temos os dados da clínica de demonstração
  const inicializarClinica = () => {
    // Para desenvolvimento/teste, sempre usar a clínica fixa
    // Em produção, aqui seria feita a busca no Supabase baseada no usuário logado
    console.log('Inicializando clínica fixa para desenvolvimento:', DEMO_CLINIC_ID);
    
    setClinicaAtiva({
      id: DEMO_CLINIC_ID,
      nome: 'Clínica Exemplo',
      email: 'contato@clinicaexemplo.com',
      telefone: '(11) 99999-9999',
      endereco: 'Rua Exemplo, 123 - São Paulo/SP',
      cnpj: '00.000.000/0001-00'
    });
  };

  const recarregarClinica = () => {
    setIsLoading(true);
    inicializarClinica();
    setIsLoading(false);
  };

  // Inicializar a clínica ao montar o componente
  useEffect(() => {
    inicializarClinica();
  }, []);

  // Log para debug - mostrar qual clínica está ativa
  useEffect(() => {
    console.log('Clínica ativa definida:', clinicaAtiva);
  }, [clinicaAtiva]);

  const contextValue: ClinicaContextType = {
    clinicaAtiva,
    clinicaId: DEMO_CLINIC_ID, // ID fixo para garantir consistência
    isLoading,
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

// Hook que retorna apenas o ID da clínica (para compatibilidade)
export const useClinicaId = () => {
  const { clinicaId } = useClinica();
  return clinicaId;
};
