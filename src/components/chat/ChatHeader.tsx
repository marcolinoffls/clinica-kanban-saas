
import { Phone, Video, Shield } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FollowupButton } from '@/components/followup/FollowupButton';
import { Lead } from '@/hooks/useLeadsData';
import { formatPhoneNumber } from './utils/phoneFormatter';
import { getOrigemIcon } from './utils/originIcons';

/**
 * Header do chat com informações do lead
 * 
 * O que faz:
 * - Exibe informações do lead selecionado
 * - Mostra botões de ação (follow-up, telefone, vídeo)
 * - Adapta para modo admin
 * 
 * Onde é usado:
 * - ChatPage como header da área de mensagens
 */

interface ChatHeaderProps {
  selectedLead: Lead;
  isAdmin: boolean;
}

export const ChatHeader = ({ selectedLead, isAdmin }: ChatHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={selectedLead.avatar_url || undefined} alt={`Avatar de ${selectedLead.nome || 'Lead'}`} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {selectedLead.nome ? selectedLead.nome.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          {getOrigemIcon(selectedLead.origem_lead)}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {selectedLead.nome || 'Lead sem nome'}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500 truncate">
              {formatPhoneNumber(selectedLead.telefone)}
            </p>
            {/* Mostrar clínica para admin */}
            {isAdmin && selectedLead.nome_clinica && (
              <Badge variant="outline" className="text-xs">
                {selectedLead.nome_clinica}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <FollowupButton
          leadId={selectedLead.id}
          leadNome={selectedLead.nome}
          leadTelefone={selectedLead.telefone}
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
