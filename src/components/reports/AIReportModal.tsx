
import React, { useState, useEffect } from 'react';
import { X, FileText, Send, Calendar, Clock, XCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimeRangeFilter } from '@/components/admin/TimeRangeFilter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';

/**
 * Modal para Emissão de Relatórios de IA
 * 
 * O que faz:
 * - Permite selecionar período para análise usando TimeRangeFilter
 * - Oferece opções de entrega (no app ou WhatsApp)
 * - Valida e confirma o número de telefone para envio via WhatsApp
 * - Dispara a criação do relatório através do hook useAIReport
 * - Permite cancelar relatórios em andamento
 * - Usa o telefone da clínica como padrão para WhatsApp
 * - Suporte a modo administrador mostrando clínica selecionada
 * 
 * Onde é usado:
 * - Aberto a partir do botão "Gerar Relatório" no Dashboard
 * 
 * Como se conecta:
 * - Usa o hook useAIReport para gerenciar a lógica de criação e cancelamento
 * - Reutiliza o TimeRangeFilter do painel administrativo
 * - Busca dados da clínica para obter o telefone padrão
 */

interface AIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateReport: (data: {
    period_start: Date;
    period_end: Date;
    delivery_method: 'in_app' | 'whatsapp';
    recipient_phone_number?: string;
  }) => void;
  onCancelReport?: (reportId: string) => void;
  isCreating: boolean;
  isCancelling?: boolean;
  currentProcessingReport?: {
    id: string;
    status: string;
  } | null;
  adminMode?: boolean;
  selectedClinica?: any;
}

export const AIReportModal: React.FC<AIReportModalProps> = ({
  isOpen,
  onClose,
  onCreateReport,
  onCancelReport,
  isCreating,
  isCancelling = false,
  currentProcessingReport = null,
  adminMode = false,
  selectedClinica = null
}) => {
  const { clinicaId } = useClinica();
  
  // Estados locais do modal
  const [deliveryMethod, setDeliveryMethod] = useState<'in_app' | 'whatsapp'>('in_app');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<{
    start: Date | null;
    end: Date | null;
    filterName: string;
  }>({
    start: null,
    end: null,
    filterName: 'Últimos 30 dias'
  });

  // Determinar qual clinicaId usar para buscar dados
  const targetClinicaId = adminMode && selectedClinica ? selectedClinica.id : clinicaId;

  // Buscar dados da clínica para obter telefone padrão
  const { data: clinica } = useQuery({
    queryKey: ['clinica-telefone', targetClinicaId],
    queryFn: async () => {
      if (!targetClinicaId) return null;
      
      const { data, error } = await supabase
        .from('clinicas')
        .select('telefone, nome')
        .eq('id', targetClinicaId)
        .single();

      if (error) {
        console.error('Erro ao buscar dados da clínica:', error);
        return null;
      }

      return data;
    },
    enabled: !!targetClinicaId && isOpen
  });

  // Atualizar telefone quando os dados da clínica carregarem
  useEffect(() => {
    if (clinica?.telefone && !phoneNumber) {
      setPhoneNumber(clinica.telefone);
    }
  }, [clinica, phoneNumber]);

  // Handler para mudança de período
  const handlePeriodChange = (start: Date | null, end: Date | null, filterName: string) => {
    setSelectedPeriod({ start, end, filterName });
  };

  // Handler para criar relatório
  const handleCreateReport = () => {
    if (!selectedPeriod.start || !selectedPeriod.end) {
      return;
    }

    // Para WhatsApp, usar o número informado ou o da clínica como fallback
    const recipientPhone = deliveryMethod === 'whatsapp' 
      ? (phoneNumber.trim() || clinica?.telefone || undefined)
      : undefined;

    const reportData = {
      period_start: selectedPeriod.start,
      period_end: selectedPeriod.end,
      delivery_method: deliveryMethod,
      recipient_phone_number: recipientPhone
    };

    console.log('📊 Criando relatório com dados:', reportData);
    onCreateReport(reportData);
  };

  // Handler para cancelar relatório
  const handleCancelReport = () => {
    if (currentProcessingReport && onCancelReport) {
      console.log('🚫 Cancelando relatório:', currentProcessingReport.id);
      onCancelReport(currentProcessingReport.id);
    }
  };

  // Validar se pode criar o relatório
  const canCreateReport = selectedPeriod.start && selectedPeriod.end && 
    (deliveryMethod === 'in_app' || (deliveryMethod === 'whatsapp' && (phoneNumber.trim().length > 0 || clinica?.telefone)));

  // Verificar se há relatório em processamento
  const hasProcessingReport = currentProcessingReport && (isCreating || currentProcessingReport.status === 'processing');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Emitir Relatório de Análise
            {adminMode && selectedClinica && (
              <div className="flex items-center gap-2 ml-auto">
                <Building2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">{selectedClinica.nome}</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alerta de clínica selecionada para admin */}
          {adminMode && selectedClinica && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Gerando relatório para:</h4>
                    <p className="text-sm text-blue-700">
                      {selectedClinica.nome} - {selectedClinica.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerta de relatório em processamento */}
          {hasProcessingReport && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                    <div>
                      <h4 className="font-medium text-amber-900">Relatório em Processamento</h4>
                      <p className="text-sm text-amber-700">
                        Um relatório está sendo gerado pelo n8n. Você pode cancelar para fazer uma nova requisição.
                      </p>
                    </div>
                  </div>
                  {onCancelReport && (
                    <Button
                      onClick={handleCancelReport}
                      disabled={isCancelling}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      {isCancelling ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600 mr-2"></div>
                          Cancelando...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-2" />
                          Cancelar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seleção de Período */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <Label className="text-base font-medium">Período da Análise</Label>
                </div>
                
                <TimeRangeFilter 
                  onFilterChange={handlePeriodChange}
                  currentFilter={selectedPeriod.filterName}
                />

                {selectedPeriod.start && selectedPeriod.end && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      Analisando dados de {selectedPeriod.start.toLocaleDateString('pt-BR')} até {selectedPeriod.end.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Método de Entrega */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-gray-600" />
                  <Label className="text-base font-medium">Como deseja receber o relatório?</Label>
                </div>

                <RadioGroup 
                  value={deliveryMethod} 
                  onValueChange={(value: 'in_app' | 'whatsapp') => setDeliveryMethod(value)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="in_app" id="in_app" />
                    <Label htmlFor="in_app" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Visualizar no sistema</div>
                        <div className="text-sm text-gray-600">
                          O relatório será exibido aqui mesmo no dashboard
                        </div>
                      </div>
                    </Label>
                    <Badge variant="secondary">Recomendado</Badge>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Enviar para WhatsApp</div>
                        <div className="text-sm text-gray-600">
                          Receba o relatório diretamente no seu WhatsApp
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Campo de telefone quando WhatsApp selecionado */}
                {deliveryMethod === 'whatsapp' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número do WhatsApp</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-gray-600">
                      {clinica?.telefone ? 
                        `Número padrão da clínica: ${clinica.telefone}` : 
                        'Confirme o número para receber o relatório'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações sobre o relatório */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-blue-900">Sobre os Relatórios de IA</h4>
                <p className="text-sm text-blue-800">
                  A IA analisará todos os dados do período selecionado e gerará insights 
                  inteligentes sobre performance, tendências e oportunidades de melhoria.
                  O processamento é feito pelo n8n para máxima eficiência.
                </p>
                <p className="text-sm text-blue-700 font-medium">
                  ⏱️ Tempo de processamento: 2-5 minutos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isCreating || isCancelling}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateReport}
            disabled={!canCreateReport || isCreating || hasProcessingReport}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
