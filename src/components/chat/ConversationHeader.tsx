
/**
 * Header da conversa ativa no chat
 * 
 * Responsável por:
 * - Exibir informações do lead selecionado
 * - Botões de ação (telefone, vídeo, follow-up)
 * - Suporte a visualização Admin
 */

import { Phone, Video } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FollowupButton } from '@/components/followup/FollowupButton';
import { Lead } from '@/types';
import { formatPhoneNumber, getOrigemIcon } from './utils/chatUtils';

interface ConversationHeaderProps {
  lead: Lead;
  isAdmin: boolean;
}

export const ConversationHeader = ({ lead, isAdmin }: ConversationHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={lead.avatar_url || undefined} alt={`Avatar de ${lead.nome || 'Lead'}`} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {lead.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          {getOrigemIcon(lead.origem_lead)}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {lead.nome || 'Lead sem nome'}
            {/* Mostrar clínica no header para Admin */}
            {isAdmin && lead.nome_clinica && (
              <span className="ml-2 text-sm text-gray-500 font-normal">
                - {lead.nome_clinica}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {formatPhoneNumber(lead.telefone)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {/* Botão de Follow-up integrado */}
        <FollowupButton
          leadId={lead.id}
          leadNome={lead.nome}
          leadTelefone={lead.telefone}
          variant="outline"
          size="sm"
          showLabel={true}
          className="mr-2"
        />
        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <Phone size={20} />
        </button>
        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <Video size={20} />
        </button>
      </div>
    </div>
  );
};
