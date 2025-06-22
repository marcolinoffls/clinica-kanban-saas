
import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lead } from '@/types';
import { formatDate } from './leadUtils';

/**
 * Componente para exibir última atividade do lead
 */

interface LeadActivitySectionProps {
  lead: Lead;
}

export const LeadActivitySection = ({ lead }: LeadActivitySectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Última Atividade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-xs text-gray-500">Último contato</p>
          <p className="text-sm">{formatDate(lead.data_ultimo_contato)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Última atualização</p>
          <p className="text-sm">{formatDate(lead.updated_at)}</p>
        </div>
      </CardContent>
    </Card>
  );
};
