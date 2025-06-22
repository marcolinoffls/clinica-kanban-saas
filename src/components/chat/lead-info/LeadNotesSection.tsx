
import React from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lead } from '@/types';

/**
 * Componente para exibir e editar anotações do lead
 */

interface LeadNotesSectionProps {
  lead: Lead;
  isEditingNotes: boolean;
  notesValue: string;
  onNotesValueChange: (value: string) => void;
  onEditNotesToggle: () => void;
  onSaveNotes: () => void;
  onCancelNotes: () => void;
  isSaving: boolean;
}

export const LeadNotesSection = ({
  lead,
  isEditingNotes,
  notesValue,
  onNotesValueChange,
  onEditNotesToggle,
  onSaveNotes,
  onCancelNotes,
  isSaving
}: LeadNotesSectionProps) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Anotações</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditingNotes ? (
          <div className="space-y-3">
            <Textarea
              value={notesValue}
              onChange={(e) => onNotesValueChange(e.target.value)}
              placeholder="Adicione anotações sobre o lead..."
              className="text-sm min-h-[80px]"
            />
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={onSaveNotes}
                disabled={isSaving}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCancelNotes}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
              {lead.anotacoes || 'Nenhuma anotação'}
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onEditNotesToggle}
              className="w-full"
            >
              {lead.anotacoes ? 'Editar anotações' : 'Adicionar anotação'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
