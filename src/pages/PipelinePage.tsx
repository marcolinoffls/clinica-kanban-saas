
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';

/**
 * Página do Pipeline de Vendas (Funil de Vendas)
 *
 * Esta página oferece uma visão em formato Kanban para gerenciar
 * leads através do funil de vendas. É uma implementação completamente
 * nova e independente, focada especificamente no pipeline de vendas.
 * 
 * Funcionalidades:
 * - Visualização em colunas (etapas) do funil
 * - Drag and drop de leads entre etapas
 * - CRUD completo de leads e etapas
 * - Integração com chat para cada lead
 */
const PipelinePage = () => {
  const navigate = useNavigate();

  // Função para navegar para o chat com um lead específico
  // Garantindo que a função sempre seja válida
  const handleNavigateToChat = React.useCallback((leadId: string) => {
    if (leadId && typeof leadId === 'string') {
      navigate(`/chat?leadId=${leadId}`);
    }
  }, [navigate]);

  return (
    <div className="h-full bg-gray-50">
      <PipelineBoard onNavigateToChat={handleNavigateToChat} />
    </div>
  );
};

export default PipelinePage;
