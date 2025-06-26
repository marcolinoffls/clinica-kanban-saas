
import { MessageSquare, Instagram } from 'lucide-react';

/**
 * Utilitários para ícones de origem dos leads
 * 
 * O que faz:
 * - Retorna ícones específicos baseados na origem do lead
 * - Suporta WhatsApp e Instagram
 * 
 * Onde é usado:
 * - ChatPage para mostrar origem dos leads na lista
 */

/**
 * Função para determinar o ícone da origem do lead
 */
export const getOrigemIcon = (origem: string | null | undefined) => {
  if (!origem) return null;
  
  const origemLower = origem.toLowerCase();
  if (origemLower.includes('whatsapp')) {
    return (
      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
        <MessageSquare size={10} className="text-white" />
      </div>
    );
  }
  
  if (origemLower.includes('instagram')) {
    return (
      <div className="absolute bottom-1 right-1 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Instagram size={10} className="text-white" />
      </div>
    );
  }
  
  return null;
};
