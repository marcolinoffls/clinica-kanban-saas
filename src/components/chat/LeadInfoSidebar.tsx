
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types';
import { useUpdateLead } from '@/hooks/useSupabaseLeads';
import { useEtapas } from '@/hooks/useEtapasData';
import { useTags } from '@/hooks/useTagsData';
import { useClinicServices } from '@/hooks/useClinicServices';
import { useQuery } from '@tanstack/react-query';
import { useAdAliases } from '@/hooks/useAdAliases';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';
import { toast } from 'sonner';

// Importar componentes refatorados
import { LeadBasicInfo } from './lead-info/LeadBasicInfo';
import { LeadStatusSection } from './lead-info/LeadStatusSection';
import { LeadNotesSection } from './lead-info/LeadNotesSection';
import { LeadOriginSection } from './lead-info/LeadOriginSection';
import { LeadValueSection } from './lead-info/LeadValueSection';
import { LeadHistorySection } from './lead-info/LeadHistorySection';
import { LeadActivitySection } from './lead-info/LeadActivitySection';

/**
 * Componente principal da sidebar com informações detalhadas do lead
 * 
 * Refatorado em componentes menores para melhor manutenibilidade:
 * - LeadBasicInfo: informações básicas e contato
 * - LeadStatusSection: etapa e tags
 * - LeadNotesSection: anotações
 * - LeadOriginSection: origem e serviços
 * - LeadValueSection: valor/LTV
 * - LeadHistorySection: histórico de consultas
 * - LeadActivitySection: última atividade
 */

interface LeadInfoSidebarProps {
  lead: Lead;
  onClose: () => void;
}

export const LeadInfoSidebar = ({ lead, onClose }: LeadInfoSidebarProps) => {
  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [isEditingEtapa, setIsEditingEtapa] = useState(false);
  const [isEditingServico, setIsEditingServico] = useState(false);
  const [novoServico, setNovoServico] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  // Estados para modais
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Hooks para dados
  const { data: etapas = [] } = useEtapas();
  const { data: tags = [] } = useTags();
  const { services, addService } = useClinicServices();
  const updateLeadMutation = useUpdateLead();
  const { getAliasForAd } = useAdAliases();

  // Query para histórico de consultas (simulado)
  const { data: consultasHistorico = [] } = useQuery({
    queryKey: ['consultas-historico', lead.id],
    queryFn: async () => {
      // Dados simulados - futuramente conectar com tabela real
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

  // Resetar estados quando lead muda
  useEffect(() => {
    setEditedLead({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      ltv: lead.ltv,
      origem_lead: lead.origem_lead,
      servico_interesse: lead.servico_interesse,
      anotacoes: lead.anotacoes,
      etapa_id: lead.etapa_id
    });
    setNotesValue(lead.anotacoes || '');
    setIsEditing(false);
    setIsEditingNotes(false);
    setIsEditingEtapa(false);
    setIsEditingServico(false);
  }, [lead.id]);

  // Buscar etapa e tag atuais
  const etapaAtual = etapas.find(etapa => etapa.id === lead.etapa_id);
  const tagAtual = tags.find(tag => tag.id === (lead.tag_ids?.[0]));

  // Handlers
  const handleSave = async () => {
    try {
      const updateData = {
        id: lead.id,
        nome: editedLead.nome,
        telefone: editedLead.telefone,
        email: editedLead.email,
        ltv: editedLead.ltv,
        origem_lead: editedLead.origem_lead,
        servico_interesse: editedLead.servico_interesse,
        anotacoes: editedLead.anotacoes,
        etapa_id: editedLead.etapa_id || lead.etapa_id,
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
    setEditedLead({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      ltv: lead.ltv,
      origem_lead: lead.origem_lead,
      servico_interesse: lead.servico_interesse,
      anotacoes: lead.anotacoes,
      etapa_id: lead.etapa_id
    });
    setIsEditing(false);
  };

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
        etapa_id: novaEtapaId,
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

  const handleSaveServico = async (servico: string) => {
    try {
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
        etapa_id: lead.etapa_id,
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

  const handleSaveNotes = async () => {
    try {
      const updateData = {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        email: lead.email,
        ltv: lead.ltv,
        origem_lead: lead.origem_lead,
        servico_interesse: lead.servico_interesse,
        anotacoes: notesValue,
        etapa_id: lead.etapa_id,
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

  return (
    <div className="w-96 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Informações do Lead</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Informações básicas do lead */}
      <LeadBasicInfo
        lead={lead}
        isEditing={isEditing}
        editedLead={editedLead}
        onEditedLeadChange={(updates) => setEditedLead(prev => ({ ...prev, ...updates }))}
        onEditToggle={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={updateLeadMutation.isPending}
      />

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

      {/* Status e etapa */}
      <LeadStatusSection
        lead={lead}
        etapas={etapas}
        tags={tags}
        etapaAtual={etapaAtual}
        tagAtual={tagAtual}
        isEditingEtapa={isEditingEtapa}
        editedLead={editedLead}
        onEditedLeadChange={(updates) => setEditedLead(prev => ({ ...prev, ...updates }))}
        onEditEtapaToggle={() => setIsEditingEtapa(!isEditingEtapa)}
        onSaveEtapa={handleSaveEtapa}
        isSaving={updateLeadMutation.isPending}
      />

      {/* Anotações */}
      <LeadNotesSection
        lead={lead}
        isEditingNotes={isEditingNotes}
        notesValue={notesValue}
        onNotesValueChange={setNotesValue}
        onEditNotesToggle={() => setIsEditingNotes(!isEditingNotes)}
        onSaveNotes={handleSaveNotes}
        onCancelNotes={handleCancelNotes}
        isSaving={updateLeadMutation.isPending}
      />

      {/* Origem e interesse */}
      <LeadOriginSection
        lead={lead}
        services={services}
        isEditingServico={isEditingServico}
        novoServico={novoServico}
        editedLead={editedLead}
        onEditedLeadChange={(updates) => setEditedLead(prev => ({ ...prev, ...updates }))}
        onNovoServicoChange={setNovoServico}
        onEditServicoToggle={() => {
          setIsEditingServico(!isEditingServico);
          setNovoServico('');
        }}
        onSaveServico={handleSaveServico}
        getAliasForAd={getAliasForAd}
        isSaving={updateLeadMutation.isPending}
      />

      {/* Informações de valor */}
      <LeadValueSection
        lead={lead}
        isEditing={isEditing}
        editedLead={editedLead}
        onEditedLeadChange={(updates) => setEditedLead(prev => ({ ...prev, ...updates }))}
      />

      {/* Histórico de Consultas */}
      <LeadHistorySection
        consultasHistorico={consultasHistorico}
        isHistoryOpen={isHistoryOpen}
        onHistoryToggle={() => setIsHistoryOpen(!isHistoryOpen)}
      />

      {/* Última atividade */}
      <LeadActivitySection lead={lead} />

      {/* Modal de Agendamento */}
      <RegistroAgendamentoModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        lead={lead}
      />
    </div>
  );
};
