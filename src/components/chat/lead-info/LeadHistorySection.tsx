
import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from './leadUtils';

/**
 * Componente para exibir histórico de consultas do lead
 */

interface ConsultaHistorico {
  id: string;
  procedimento: string;
  valor: number;
  data_consulta: string;
  observacoes: string;
}

interface LeadHistorySectionProps {
  consultasHistorico: ConsultaHistorico[];
  isHistoryOpen: boolean;
  onHistoryToggle: () => void;
}

export const LeadHistorySection = ({
  consultasHistorico,
  isHistoryOpen,
  onHistoryToggle
}: LeadHistorySectionProps) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Histórico de Consultas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {consultasHistorico.length} consulta{consultasHistorico.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">
                Valor total: {formatCurrency(
                  consultasHistorico.reduce((sum, consulta) => sum + consulta.valor, 0)
                )}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onHistoryToggle}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {isHistoryOpen && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {consultasHistorico.length > 0 ? (
                consultasHistorico.map((consulta) => (
                  <div key={consulta.id} className="bg-gray-50 rounded p-2 text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{consulta.procedimento}</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(consulta.valor)}
                      </span>
                    </div>
                    <p className="text-gray-500">{formatDate(consulta.data_consulta)}</p>
                    {consulta.observacoes && (
                      <p className="text-gray-600 mt-1">{consulta.observacoes}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  Nenhuma consulta registrada
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
