
/**
 * Componente da barra superior (header)
 * 
 * Responsável por:
 * - Exibir botão de menu mobile
 * - Mostrar título da página atual
 * - Ações rápidas do usuário
 */

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
      {/* Botão de menu para mobile */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuClick}
        className="p-2"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </Button>

      {/* Logo/Título */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-blue-600">
          MediCRM
        </h1>
      </div>

      {/* Espaço reservado para ações futuras */}
      <div className="w-10" />
    </header>
  );
};
