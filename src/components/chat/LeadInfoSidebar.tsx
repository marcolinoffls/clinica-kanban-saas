
import { useState } from 'react';
import { User, Phone, Mail, Calendar, FileText, ChevronDown, ChevronRight, MessageSquare, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * Barra lateral com informações detalhadas do lead
 * 
 * Funcionalidades:
 * - Informações básicas do lead (nome, telefone, email)
 * - Histórico de interações
 * - Tags associadas
 * - Ações rápidas (ligar, agendar, etc.)
 * - Seções expansíveis para melhor organização
 * - Timeline de atividades
 */

interface LeadInfoSidebarProps {
  lead: {
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
    anotacoes?: string;
    created_at: string;
    updated_at: string;
    ltv?: number;
  };
  tags?: Array<{
    id: string;
    nome: string;
    cor: string;
  }>;
  historico?: Array<{
    id: string;
    tipo: string;
    descricao: string;
    data: string;
  }>;
  onCallLead?: () => void;
  onScheduleAppointment?: () => void;
  onEditLead?: () => void;
}

export const LeadInfoSidebar = ({
  lead,
  tags = [],
  historico = [],
  onCallLead,
  onScheduleAppointment,
  onEditLead
}: LeadInfoSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    tags: true,
    historico: true,
    anotacoes: true
  });

  // Função para toggle de seções
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Função para formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* Header com foto/avatar do lead */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {lead.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{lead.nome}</h3>
            <p className="text-sm text-gray-500">Lead ativo</p>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCallLead}
            className="flex items-center gap-2"
          >
            <Phone size={14} />
            Ligar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onScheduleAppointment}
            className="flex items-center gap-2"
          >
            <Calendar size={14} />
            Agendar
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditLead}
          className="w-full mt-2 flex items-center gap-2"
        >
          <User size={14} />
          Editar Lead
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Informações básicas */}
        <Collapsible open={expandedSections.info} onOpenChange={() => toggleSection('info')}>
          <CollapsibleTrigger className="w-full p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Informações Básicas</h4>
              {expandedSections.info ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 border-b border-gray-200 space-y-3">
            {lead.telefone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700">{lead.telefone}</span>
              </div>
            )}
            
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700">{lead.email}</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400" />
              <div className="text-sm text-gray-700">
                <div>Criado: {formatarData(lead.created_at)}</div>
                <div>Atualizado: {formatarData(lead.updated_at)}</div>
              </div>
            </div>

            {lead.ltv && lead.ltv > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  LTV: <span className="font-medium text-green-600">R$ {Number(lead.ltv).toFixed(2)}</span>
                </span>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Tags */}
        <Collapsible open={expandedSections.tags} onOpenChange={() => toggleSection('tags')}>
          <CollapsibleTrigger className="w-full p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Tags ({tags.length})</h4>
              {expandedSections.tags ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 border-b border-gray-200">
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.cor }}
                    className="text-white text-xs"
                  >
                    {tag.nome}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma tag associada</p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Anotações */}
        {lead.anotacoes && (
          <Collapsible open={expandedSections.anotacoes} onOpenChange={() => toggleSection('anotacoes')}>
            <CollapsibleTrigger className="w-full p-4 border-b border-gray-200 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Anotações</h4>
                {expandedSections.anotacoes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed">{lead.anotacoes}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Histórico de atividades */}
        <Collapsible open={expandedSections.historico} onOpenChange={() => toggleSection('historico')}>
          <CollapsibleTrigger className="w-full p-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Histórico ({historico.length})</h4>
              {expandedSections.historico ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4">
            {historico.length > 0 ? (
              <div className="space-y-3">
                {historico.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{item.descricao}</p>
                      <p className="text-xs text-gray-500">{formatarData(item.data)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <History size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma atividade registrada</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
