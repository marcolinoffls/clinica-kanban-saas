
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';

/**
 * Página do Funil de Vendas (Kanban)
 *
 * Gerencia leads em formato kanban.
 * Esta página encapsula o componente PipelineBoard.
 */
const PipelinePage = () => {
  const navigate = useNavigate();

  // Função para navegar para o chat com um lead específico
  const handleNavigateToChat = (leadId: string) => {
    navigate(`/chat?leadId=${leadId}`);
  };

  return (
    <div className="h-full">
      <PipelineBoard onNavigateToChat={handleNavigateToChat} />
    </div>
  );
};

export default PipelinePage;
