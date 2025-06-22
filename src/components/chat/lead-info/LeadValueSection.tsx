
import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Lead } from '@/types';
import { formatCurrency } from './leadUtils';

/**
 * Componente para exibir informações de valor do lead
 */

interface LeadValueSectionProps {
  lead: Lead;
  isEditing: boolean;
  editedLead: Partial<Lead>;
  onEditedLeadChange: (updates: Partial<Lead>) => void;
}

export const LeadValueSection = ({
  lead,
  isEditing,
  editedLead,
  onEditedLeadChange
}: LeadValueSectionProps) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Valor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <p className="text-xs text-gray-500 mb-1">LTV (Lifetime Value)</p>
          {isEditing ? (
            <Input
              value={editedLead.ltv || ''}
              onChange={(e) => onEditedLeadChange({ ltv: parseFloat(e.target.value) || 0 })}
              placeholder="Valor em R$"
              type="number"
              step="0.01"
              className="text-lg font-semibold"
            />
          ) : (
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(lead.ltv || 0)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
