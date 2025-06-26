
import { MessageSquare } from 'lucide-react';

/**
 * Estado vazio do chat
 * 
 * O que faz:
 * - Exibe mensagem quando nenhuma conversa está selecionada
 * - Adapta mensagem para modo admin
 * 
 * Onde é usado:
 * - ChatPage quando nenhum lead está selecionado
 */

interface ChatEmptyStateProps {
  isAdmin: boolean;
  adminClinicaSelecionada: any | null;
}

export const ChatEmptyState = ({ isAdmin, adminClinicaSelecionada }: ChatEmptyStateProps) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Selecione uma conversa
        </h3>
        <p className="text-gray-500">
          {isAdmin && !adminClinicaSelecionada
            ? 'Primeiro selecione uma clínica, depois escolha uma conversa'
            : 'Escolha uma conversa para começar a mensagear'
          }
        </p>
      </div>
    </div>
  );
};
