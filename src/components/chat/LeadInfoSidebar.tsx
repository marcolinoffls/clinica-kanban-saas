
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Phone, Mail, User, MessageSquare, Tag, Briefcase, DollarSign, Check, X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lead } from '@/hooks/useLeadsData';
import { useUpdateLead } from '@/hooks/useSupabaseLeads';
import { useEtapas } from '@/hooks/useEtapasData';
import { useTags } from '@/hooks/useTagsData';
import { useAdAliases } from '@/hooks/useAdAliases';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';

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

/**
 * Função para formatar números de telefone no padrão brasileiro
 * Converte números como "84987759827" para "(84) 98775-9827"
 */
const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'Não informado';
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (celular com 9 na frente)
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }
  
  // Se tem 10 dígitos (telefone fixo)
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }
  
  // Se não está no padrão esperado, retorna como está
  return phone;
};

export const LeadInfoSidebar = ({ lead, onClose }: LeadInfoSidebarProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const { getAliasForAd } = useAdAliases();
  
  // Estados específicos para anotações
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  // Estado para controlar o modal de agendamento
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Hooks para buscar dados relacionados
  const { data: etapas = [] } = useEtapas();
  const { data: tags = [] } = useTags();
  const updateLeadMutation = useUpdateLead();

  // Resetar o estado de edição sempre que o lead mudar
  useEffect(() => {
    setEditedLead({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      ltv: lead.ltv,
      origem_lead: lead.origem_lead,
      servico_interesse: lead.servico_interesse,
      anotacoes: lead.anotacoes
    });
    setNotesValue(lead.anotacoes || '');
    setIsEditing(false);
    setIsEditingNotes(false);
  }, [lead.id]); // Dependência no ID para garantir que reset quando trocar de lead

  // Buscar nome da etapa atual
  const etapaAtual = etapas.find(etapa => etapa.id === (lead.etapa_kanban_id || lead.etapa_id));
  const etapaNome = etapaAtual?.nome || 'Sem etapa';

  // Buscar informações da tag
  const tagAtual = tags.find(tag => tag.id === lead.tag_id);

  const handleSave = async () => {
    try {
      console.log('Salvando lead com dados:', editedLead);
      
      // Preparar dados para atualização, removendo campos que não existem na interface UpdateLeadData
      const updateData = {
        id: lead.id,
        nome: editedLead.nome,
        telefone: editedLead.telefone,
        email: editedLead.email,
        ltv: editedLead.ltv,
        origem_lead: editedLead.origem_lead,
        servico_interesse: editedLead.servico_interesse,
        anotacoes: editedLead.anotacoes,
        // Usar etapa_kanban_id ao invés de etapa_id
        etapa_kanban_id: lead.etapa_kanban_id,
        clinica_id: lead.clinica_id
      };

      await updateLeadMutation.mutateAsync(updateData);
      setIsEditing(false);
      console.log('Lead atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleCancel = () => {
    // Resetar para os valores originais do lead
    setEditedLead({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      ltv: lead.ltv,
      origem_lead: lead.origem_lead,
      servico_interesse: lead.servico_interesse,
      anotacoes: lead.anotacoes
    });
    setIsEditing(false);
  };

  // Funções específicas para anotações
  const handleSaveNotes = async () => {
    try {
      console.log('Salvando anotações:', notesValue);
      
      const updateData = {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        email: lead.email,
        ltv: lead.ltv,
        origem_lead: lead.origem_lead,
        servico_interesse: lead.servico_interesse,
        anotacoes: notesValue,
        etapa_kanban_id: lead.etapa_kanban_id,
        clinica_id: lead.clinica_id
      };

      await updateLeadMutation.mutateAsync(updateData);
      setIsEditingNotes(false);
      console.log('Anotações salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar anotações:', error);
    }
  };

  const handleCancelNotes = () => {
    setNotesValue(lead.anotacoes || '');
    setIsEditingNotes(false);
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
    /**
   * Função para truncar nomes de anúncios muito longos
   */
  const truncateAdName = (adName: string): string => {
    if (!adName) return '';
    
    // Se o nome é muito longo, truncar de forma inteligente
    if (adName.length > 30) {
      // Tentar pegar as primeiras palavras mais importantes
      const words = adName.split(' ');
      
      // Se tem muitas palavras, pegar as primeiras e últimas
      if (words.length > 5) {
        const firstPart = words.slice(0, 3).join(' ');
        const lastPart = words.slice(-2).join(' ');
        return `${firstPart}...${lastPart}`;
      }
      
      // Se não, apenas truncar no meio
      return adName.substring(0, 27) + '...';
    }
    
    return adName;
  };

  return (
    <div className="w-96 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Informações do Lead</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Botão para Novo Agendamento */}
      <div className="mb-4">
        <Button 
          onClick={() => setIsScheduleModalOpen(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
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
              {isEditing ? (
                <Input
                  value={editedLead.nome || ''}
                  onChange={(e) => setEditedLead(prev => ({ ...prev, nome: e.target.value }))}
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
                  {updateLeadMutation.isPending ? 'Salvando...' : 'Salvar'}
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
            {isEditing ? (
              <Input
                value={editedLead.telefone || ''}
                onChange={(e) => setEditedLead(prev => ({ ...prev, telefone: e.target.value }))}
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
                onChange={(e) => setEditedLead(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="text-sm"
                type="email"
              />
            ) : (
              <span className="text-sm">{lead.email || 'Não informado'}</span>
            )}
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

      {/* Anotações - movido para onde estava o LTV */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Anotações</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditingNotes ? (
            <div className="space-y-3">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Adicione anotações sobre o lead..."
                className="text-sm min-h-[80px]"
              />
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleSaveNotes}
                  disabled={updateLeadMutation.isPending}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-1" />
                  {updateLeadMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancelNotes}
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
                onClick={() => setIsEditingNotes(true)}
                className="w-full"
              >
                {lead.anotacoes ? 'Editar anotações' : 'Adicionar anotação'}
              </Button>
            </div>
          )}
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
            {isEditing ? (
              <Input
                value={editedLead.origem_lead || ''}
                onChange={(e) => setEditedLead(prev => ({ ...prev, origem_lead: e.target.value }))}
                placeholder="Origem do lead"
                className="text-sm"
              />
            ) : (
              <p className="text-sm">{lead.origem_lead || 'Não informado'}</p>
            )}
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Serviço de interesse</p>
            {isEditing ? (
              <Input
                value={editedLead.servico_interesse || ''}
                onChange={(e) => setEditedLead(prev => ({ ...prev, servico_interesse: e.target.value }))}
                placeholder="Serviço de interesse"
                className="text-sm"
              />
            ) : (
              <p className="text-sm">{lead.servico_interesse || 'Não informado'}</p>
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

      {/* Informações de valor - movido para baixo */}
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
                onChange={(e) => setEditedLead(prev => ({ ...prev, ltv: parseFloat(e.target.value) || 0 }))}
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

      {/* Modal de Agendamento */}
      <RegistroAgendamentoModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        lead={lead}
      />
    </div>
  );
};
