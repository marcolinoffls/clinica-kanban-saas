
/**
 * Componente da sidebar mobile (off-canvas)
 * 
 * Funcionalidades:
 * - Sidebar que desliza na tela em dispositivos móveis
 * - Overlay para fechar clicando fora
 * - Conteúdo idêntico à sidebar desktop
 * - Controle de abertura/fechamento via props
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        aria-label="Fechar menu"
      />
      
      {/* Sidebar mobile */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
        {/* Header com botão de fechar */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 bg-white rounded-full shadow-md"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </Button>
        </div>
        
        {/* Conteúdo da sidebar */}
        <Sidebar />
      </div>
    </>
  );
};
