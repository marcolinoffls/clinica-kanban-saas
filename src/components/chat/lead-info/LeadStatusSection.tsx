
import React from 'react';
import { Briefcase, Edit, Check, X, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead, Etapa, Tag as TagType } from '@/types';

/**
 * Componente para exibir e editar status do lead
 * - Etapa atual
 * - Tags
 * - Status de conversão
 */

interface LeadStatusSectionProps {
  lead: Lead;
  etapas: Etapa[];
  tags: TagType[];
  etapaAtual?: Etapa;
  tagAtual?: TagType;
  isEditingEtapa: boolean;
  editedLead: Partial<Lead>;
  onEditedLeadChange: (updates: Partial<Lead>) => void;
  onEditEtapaToggle: () => void;
  onSaveEtapa: (etapaId: string) => void;
  isSaving: boolean;
}

export const LeadStatusSection = ({
  lead,
  etapas,
  tags,
  etapaAtual,
  tagAtual,
  isEditingEtapa,
  editedLead,
  onEditedLeadChange,
  onEditEtapaToggle,
  onSaveEtapa,
  isSaving
}: LeadStatusSectionProps) => {
  const etapaNome = etapaAtual?.nome || 'Sem etapa';

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Etapa atual</p>
          {isEditingEtapa ? (
            <div className="space-y-2">
              <Select
                value={editedLead.etapa_id || lead.etapa_id}
                onValueChange={(value) => onEditedLeadChange({ etapa_id: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => onSaveEtapa(editedLead.etapa_id || lead.etapa_id)}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Salvar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onEditEtapaToggle}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{etapaNome}</Badge>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEditEtapaToggle}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        {tagAtual && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Tag</p>
            <Badge 
              style={{ backgroundColor: tagAtual.cor }}
              className="text-white"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tagAtual.nome}
            </Badge>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500 mb-1">Status de conversão</p>
          <Badge variant={lead.convertido ? "default" : "secondary"}>
            {lead.convertido ? 'Convertido' : 'Em andamento'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
