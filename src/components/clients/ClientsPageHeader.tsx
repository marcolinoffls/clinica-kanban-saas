
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

/**
 * Cabeçalho da página de Contatos.
 * Exibe o título da página e o botão para adicionar um novo lead.
 * 
 * Props:
 * - onAddLead: Função a ser chamada ao clicar no botão "Adicionar Lead".
 * 
 * Onde é usado:
 * - ClientsPage.tsx
 */
interface ClientsPageHeaderProps {
  onAddLead: () => void;
}

export const ClientsPageHeader: React.FC<ClientsPageHeaderProps> = ({ onAddLead }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
        <p className="text-gray-600 mt-1">Gerencie sua base de contatos e leads</p>
      </div>
      <Button onClick={onAddLead}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Lead
      </Button>
    </div>
  );
};
