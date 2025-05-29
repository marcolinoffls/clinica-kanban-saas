
import { useState } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Leads (Kanban)
 * 
 * Gerencia leads em formato kanban. Mantém a funcionalidade
 * existente de navegação para chat quando necessário.
 * Esta página encapsula o componente KanbanBoard existente.
 */
const LeadsPage = () => {
  const navigate = useNavigate();

  // Função para navegar para o chat com um lead específico
  const handleNavigateToChat = (leadId: string) => {
    navigate(`/chat?leadId=${leadId}`);
  };

  return <KanbanBoard />;
};

export default LeadsPage;
