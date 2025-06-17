
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Phone, Mail, User, MessageSquare, Tag, Briefcase, DollarSign, Check, X, Plus, Edit, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead } from '@/hooks/useLeadsData';
import { useUpdateLead } from '@/hooks/useSupabaseLeads';
import { useEtapas } from '@/hooks/useEtapasData';
import { useTags } from '@/hooks/useTagsData';
import { useClinicServices } from '@/hooks/useClinicServices';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdAliases } from '@/hooks/useAdAliases';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';
import { toast } from 'sonner';

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
  
  // Estado para controlar edição da etapa
  const [isEditingEtapa, setIsEditingEtapa] = useState(false);
  
  // Estado para controlar edição do serviço de interesse
  const [isEditingServico, setIsEditingServico] = useState(false);
  const [novoServico, setNovoServico] = useState('');
  
  // Estados específicos para anotações
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  // Estado para controlar o modal de agendamento
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Estado para histórico de consultas
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Hooks para buscar dados relacionados
  const { data: etapas = [] } = useEtapas();
  const { data: tags = [] } = useTags();
  const { services, addService } = useClinicServices();
  const updateLeadMutation = useUpdateLead();

  // Hook para buscar apelidos de anúncios
  const { data: adAliases = [] } = useQuery({
    queryKey: ['ad-aliases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_aliases')
        .select('*');
      
      if (error) {
        console.error('❌ Erro ao buscar apelidos:', error);
        return [];
      }
      
      console.log('✅ Apelidos carregados da tabela:', data);
      return data || [];
    },
  });

  // Query para buscar histórico de consultas (simulado)
  const { data: consultasHistorico = [] } = useQuery({
    queryKey: ['consultas-historico', lead.id],
    queryFn: async () => {
      // Por enquanto retornando dados simulados
      // Futuramente isso será conectado com a tabela real de consultas
      return [
        {
          id: '1',
          procedimento: 'Limpeza de Pele',
          valor: 150.00,
          data_consulta: '2024-01-15',
          observacoes: 'Primeira consulta, pele sensível'
        },
        {
          id: '2',
          procedimento: 'Peeling Químico',
          valor: 300.00,
          data_consulta: '2024-02-15',
          observacoes: 'Evolução positiva, agendar retorno'
        }
      ];
    },
  });
  
  const getAliasForAd = (adName: string): string | null => {
    if (!adName || !adAliases.length) {
      console.log('⚠️ Sem nome do anúncio ou sem apelidos');
      return null;
    }
    
    console.log('🔍 Procurando apelido para:', adName);
    console.log('🔍 Apelidos disponíveis:', adAliases);
    
    // Buscar por correspondência exata
    const exactMatch = adAliases.find((alias: any) => 
      alias.ad_name_original === adName
    );
    
    if (exactMatch) {
      console.log('✅ Apelido exato encontrado:', exactMatch.ad_alias);
      return exactMatch.ad_alias;
    }
    
    // Buscar por correspondência parcial
    const partialMatch = adAliases.find((alias: any) => 
      alias.ad_name_original.includes(adName) || 
      adName.includes(alias.ad_name_original)
    );
    
    if (partialMatch) {
      console.log('✅ Apelido parcial encontrado:', partialMatch.ad_alias);
      return partialMatch.ad_alias;
    }
    
    console.log('❌ Nenhum apelido encontrado');
    return null;
  };

  // Resetar o estado de edição sempre que o lead mudar
  useEffect(() => {
    setEditedLead({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      ltv: lead.ltv,
      origem_lead: lead.origem_lead,
      servico_interesse: lead.servico_interesse,
      anotacoes: lead.anotacoes,
      etapa_kanban_id: lead.etapa_kanban_id
    });
    setNotesValue(lead.anotacoes || '');
    setIsEditing(false);
    setIsEditingNotes(false);
    setIsEditingEtapa(false);
    setIsEditingServico(false);
  }, [lead.id]);

  // Buscar nome da etapa atual
  const etapaAtual = etapas.find(etapa => etapa.id === (lead.etapa_kanban_id || lead.etapa_id));
  const etapaNome = etapaAtual?.nome || 'Sem etapa';

  // Buscar informações da tag
  const tagAtual = tags.find(tag => tag.id === lead.tag_id);

  const handleSave = async () => {
    try {
      console.log('Salvando lead com dados:', editedLead);
      
      // Preparar dados para atualização
      const updateData = {
        id: lead.id,
        nome: editedLead.nome,
        telefone: editedLead.telefone,
        email: editedLead.email,
        ltv: editedLead.ltv,
        origem_lead: editedLead.origem_lead,
        servico_interesse: editedLead.servico_interesse,
        anotacoes: editedLead.anotacoes,
        etapa_kanban_id: editedLead.etapa_kanban_id || lead.etapa_kanban_id,
        clinica_id: lead.clinica_id
      };

      await updateLeadMutation.mutateAsync(updateData);
      setIsEditing(false);
      toast.success('Lead atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
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
      anotacoes: lead.anotacoes,
      etapa_kanban_id: lead.etapa_kanban_id
    });
    setIsEditing(false);
  };

  // Função para salvar alteração da etapa
  const handleSaveEtapa = async (novaEtapaId: string) => {
    try {
      const updateData = {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        email: lead.email,
        ltv: lead.ltv,
        origem_lead: lead.origem_lead,
        servico_interesse: lead.servico_interesse,
        anotacoes: lead.anotacoes,
        etapa_kanban_id: novaEtapaId,
        clinica_id: lead.clinica_id
      };

      await updateLeadMutation.mutateAsync(updateData);
      setIsEditingEtapa(false);
      toast.success('Etapa atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      toast.error('Erro ao atualizar etapa');
    }
  };

  // Função para salvar serviço de interesse
  const handleSaveServico = async (servico: string) => {
    try {
      // Se é um novo serviço, adicionar à lista primeiro
      if (servico === 'novo' && novoServico.trim()) {
        await addService(novoServico.trim());
        servico = novoServico.trim();
      }

      const updateData = {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        email: lead.email,
        ltv: lead.ltv,
        origem_lead: lead.origem_lead,
        servico_interesse: servico,
        anotacoes: lead.anotacoes,
        etapa_kanban_id: lead.etapa_kanban_id,
        clinica_id: lead.clinica_id
      };

      await updateLeadMutation.mutateAsync(updateData);
      setIsEditingServico(false);
      setNovoServico('');
      toast.success('Serviço de interesse atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast.error('Erro ao atualizar serviço');
    }
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
      toast.success('Anotações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar anotações:', error);
      toast.error('Erro ao salvar anotações');
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

      {/* Avatar, informações básicas e contato INTEGRADOS */}
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

          {/* Informações de contato integradas */}
          <div className="space-y-3 mb-4">
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

      {/* Botão para Novo Agendamento - MOVIDO PARA BAIXO DO CARD DE PERFIL */}
      <div className="mb-4">
        <Button 
          onClick={() => setIsScheduleModalOpen(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Status e etapa COM EDIÇÃO */}
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
                  value={editedLead.etapa_kanban_id || lead.etapa_kanban_id}
                  onValueChange={(value) => setEditedLead(prev => ({ ...prev, etapa_kanban_id: value }))}
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
                    onClick={() => handleSaveEtapa(editedLead.etapa_kanban_id || lead.etapa_kanban_id)}
                    disabled={updateLeadMutation.isPending}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditingEtapa(false)}
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
                  onClick={() => setIsEditingEtapa(true)}
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

      {/* Anotações */}
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

      {/* Origem e interesse COM MELHORIAS */}
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
              <div className="flex items-center gap-2">
                {/* Ícone do WhatsApp se a origem for whatsapp */}
                {lead.origem_lead?.toLowerCase().includes('whatsapp') && (
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                )}
                <p className="text-sm">{lead.origem_lead || 'Não informado'}</p>
              </div>
            )}
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
                    setEditedLead(prev => ({ ...prev, servico_interesse: value }));
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
                  onChange={(e) => setNovoServico(e.target.value)}
                  className="text-sm"
                />
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const servicoFinal = novoServico.trim() ? novoServico.trim() : editedLead.servico_interesse || lead.servico_interesse;
                      if (servicoFinal) {
                        handleSaveServico(novoServico.trim() ? 'novo' : servicoFinal);
                      }
                    }}
                    disabled={updateLeadMutation.isPending}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingServico(false);
                      setNovoServico('');
                    }}
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
                  onClick={() => setIsEditingServico(true)}
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

      {/* Histórico de Consultas - NOVO CARD */}
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
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
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
