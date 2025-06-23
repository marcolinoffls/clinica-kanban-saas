
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FilterState } from './types';

interface ClientsActionsBarProps {
  onAddLead: () => void;
  filters: FilterState;
  totalContacts: number;
}

/**
 * 🎯 Barra de Ações da Página de Clientes
 * 
 * O que faz:
 * - Exibe o número total de contatos filtrados
 * - Botão para adicionar novo lead
 * - Área de ações rápidas para gerenciar contatos
 * 
 * Onde é usado:
 * - ClientsPage.tsx - como cabeçalho de ações
 * 
 * Como se conecta:
 * - Recebe função onAddLead para abrir modal de criação
 * - Mostra contagem baseada nos filtros aplicados
 */
export const ClientsActionsBar = ({ onAddLead, filters, totalContacts }: ClientsActionsBarProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        {totalContacts} contato{totalContacts !== 1 ? 's' : ''} encontrado{totalContacts !== 1 ? 's' : ''}
      </div>
      
      <Button onClick={onAddLead} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Adicionar Lead
      </Button>
    </div>
  );
};
