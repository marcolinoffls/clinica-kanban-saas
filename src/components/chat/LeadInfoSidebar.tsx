
import React, { useState } from 'react';
import { Calendar, MapPin, Phone, Mail, User, MessageSquare, Tag, Briefcase, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lead } from '@/hooks/useLeadsData';
import { useUpdateLead } from '@/hooks/useSupabaseLeads';
import { useEtapas } from '@/hooks/useEtapasData';
import { useTags } from '@/hooks/useTagsData';

/**
 * Componente lateral com informações detalhadas do lead
 * 
 * Exibe e permite editar:
 * - Informações básicas do lead (nome, telefone, email)
 * - Avatar e dados de identificação
 * - Etapa atual no pipeline
 * - Tags e anotações
 * - Histórico de conversões e LTV
 * - Origem do lead e serviços de interesse
 */

interface LeadInfoSidebarProps {
  lead: Lead;
  onClose: () => void;
}

export const LeadInfoSidebar = ({ lead, onClose }: LeadInfoSidebarProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>(lead);

  // Hooks para buscar dados relacionados
  const { data: etapas = [] } = useEtapas();
  const { data: tags = [] } = useTags();
  const updateLeadMutation = useUpdateLead();

  // Buscar nome da etapa atual
  const etapaAtual = etapas.find(etapa => etapa.id === (lead.etapa_kanban_id || lead.etapa_id));
  const etapaNome = etapaAtual?.nome || 'Sem etapa';

  // Buscar informações da tag
  const tagAtual = tags.find(tag => tag.id === lead.tag_id);

  const handleSave = async () => {
    try {
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        ...editedLead
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleCancel = () => {
    setEditedLead(lead);
    setIsEditing(false);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Informações do Lead</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Avatar e informações básicas */}
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
              <h3 className="font-semibold text-lg text-gray-900">
                {lead.nome || 'Lead sem nome'}
              </h3>
              <p className="text-sm text-gray-500">
                Criado em {formatDate(lead.created_at)}
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                Editar
              </Button>
            ) : (
              <>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={updateLeadMutation.isPending}
                  className="flex-1"
                >
                  Salvar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações de contato */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{lead.telefone || 'Não informado'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{lead.email || 'Não informado'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status e etapa */}
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
            <Badge variant="secondary">{etapaNome}</Badge>
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

      {/* Informações de valor */}
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
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(lead.ltv || 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Origem e interesse */}
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
            <p className="text-sm">{lead.origem_lead || 'Não informado'}</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Serviço de interesse</p>
            <p className="text-sm">{lead.servico_interesse || 'Não informado'}</p>
          </div>

          {lead.ad_name && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Anúncio específico</p>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                📢 {lead.ad_name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anotações */}
      {lead.anotacoes && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Anotações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {lead.anotacoes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Última atividade */}
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
    </div>
  );
};
