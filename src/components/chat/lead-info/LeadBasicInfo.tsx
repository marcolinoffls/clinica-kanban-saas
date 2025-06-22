
import React from 'react';
import { User, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types';
import { formatPhoneNumber, formatDate } from './leadUtils';

/**
 * Componente para exibir e editar informações básicas do lead
 * - Avatar e nome
 * - Telefone e email
 * - Data de criação
 */

interface LeadBasicInfoProps {
  lead: Lead;
  isEditing: boolean;
  editedLead: Partial<Lead>;
  onEditedLeadChange: (updates: Partial<Lead>) => void;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const LeadBasicInfo = ({
  lead,
  isEditing,
  editedLead,
  onEditedLeadChange,
  onEditToggle,
  onSave,
  onCancel,
  isSaving
}: LeadBasicInfoProps) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {lead.avatar_url ? (
              <img
                src={lead.avatar_url}
                alt={lead.nome || 'Lead'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedLead.nome || ''}
                onChange={(e) => onEditedLeadChange({ nome: e.target.value })}
                className="font-semibold text-lg mb-2"
                placeholder="Nome do lead"
              />
            ) : (
              <h3 className="font-semibold text-lg text-gray-900">
                {lead.nome || 'Lead sem nome'}
              </h3>
            )}
            <p className="text-sm text-gray-500">
              Criado em {formatDate(lead.created_at)}
            </p>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-3">
            <Phone className="w-4 h-4 text-gray-400" />
            {isEditing ? (
              <Input
                value={editedLead.telefone || ''}
                onChange={(e) => onEditedLeadChange({ telefone: e.target.value })}
                placeholder="Telefone"
                className="text-sm"
              />
            ) : (
              <span className="text-sm">{formatPhoneNumber(lead.telefone)}</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="w-4 h-4 text-gray-400" />
            {isEditing ? (
              <Input
                value={editedLead.email || ''}
                onChange={(e) => onEditedLeadChange({ email: e.target.value })}
                placeholder="Email"
                className="text-sm"
                type="email"
              />
            ) : (
              <span className="text-sm">{lead.email || 'Não informado'}</span>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onEditToggle}
              className="flex-1"
            >
              Editar
            </Button>
          ) : (
            <>
              <Button 
                size="sm" 
                onClick={onSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
