
import React from 'react';
import { MapPin, Edit, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead } from '@/types';
import { truncateAdName } from './leadUtils';

/**
 * Componente para exibir origem do lead e serviços de interesse
 */

interface LeadOriginSectionProps {
  lead: Lead;
  services: Array<{ id: string; nome_servico: string; }>;
  isEditingServico: boolean;
  novoServico: string;
  editedLead: Partial<Lead>;
  onEditedLeadChange: (updates: Partial<Lead>) => void;
  onNovoServicoChange: (value: string) => void;
  onEditServicoToggle: () => void;
  onSaveServico: (servico: string) => void;
  getAliasForAd: (adName: string) => string | null;
  isSaving: boolean;
}

export const LeadOriginSection = ({
  lead,
  services,
  isEditingServico,
  novoServico,
  editedLead,
  onEditedLeadChange,
  onNovoServicoChange,
  onEditServicoToggle,
  onSaveServico,
  getAliasForAd,
  isSaving
}: LeadOriginSectionProps) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Origem e Interesse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Origem do lead</p>
          <div className="flex items-center gap-2">
            {/* Ícone do WhatsApp se a origem for whatsapp */}
            {lead.origem_lead?.toLowerCase().includes('whatsapp') && (
              <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            )}
            <p className="text-sm">{lead.origem_lead || 'Não informado'}</p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Serviço de interesse</p>
          {isEditingServico ? (
            <div className="space-y-2">
              <Select
                value={editedLead.servico_interesse || lead.servico_interesse || ''}
                onValueChange={(value) => {
                  if (value === 'novo') {
                    // Não atualiza o lead ainda, só prepara para novo serviço
                    return;
                  }
                  onEditedLeadChange({ servico_interesse: value });
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.nome_servico}>
                      {service.nome_servico}
                    </SelectItem>
                  ))}
                  <SelectItem value="novo">+ Adicionar novo serviço</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Campo para novo serviço */}
              <Input
                placeholder="Nome do novo serviço"
                value={novoServico}
                onChange={(e) => onNovoServicoChange(e.target.value)}
                className="text-sm"
              />
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => {
                    const servicoFinal = novoServico.trim() ? novoServico.trim() : editedLead.servico_interesse || lead.servico_interesse;
                    if (servicoFinal) {
                      onSaveServico(novoServico.trim() ? 'novo' : servicoFinal);
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Salvar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onEditServicoToggle}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm">{lead.servico_interesse || 'Não informado'}</p>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEditServicoToggle}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {lead.ad_name && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Anúncio específico</p>
            <div className="space-y-2">
              <Badge 
                variant="outline" 
                className="text-purple-600 border-purple-300 max-w-full"
                title={`Nome original: ${lead.ad_name}`}
              >
                <span className="flex items-center gap-1">
                  📢 
                  <span className="truncate max-w-[200px]">
                    {getAliasForAd(lead.ad_name) || truncateAdName(lead.ad_name)}
                  </span>
                </span>
              </Badge>
              
              {/* Se tem apelido, mostrar que é um apelido */}
              {getAliasForAd(lead.ad_name) && (
                <p className="text-xs text-gray-400 italic">
                  Apelido personalizado
                </p>
              )}
              
              {/* Se não tem apelido, mostrar nome original truncado com tooltip */}
              {!getAliasForAd(lead.ad_name) && lead.ad_name.length > 30 && (
                <p className="text-xs text-gray-400" title={lead.ad_name}>
                  📝 Nome completo: {lead.ad_name.substring(0, 50)}...
                </p>
              )}
            </div>
          </div> 
        )}
      </CardContent>
    </Card>
  );
};
