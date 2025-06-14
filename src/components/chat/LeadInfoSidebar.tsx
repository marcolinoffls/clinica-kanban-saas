import { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar as CalendarIconLucide, FileText, ChevronDown, ChevronRight, History, Edit, Check, X, MoveHorizontal } from 'lucide-react'; // Ícone para a etapa
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead, useUpdateLead, useMoveLeadToStage } from '@/hooks/useLeadsData'; // Importar o hook para mover o lead
import { useEtapas } from '@/hooks/useEtapasData'; // Importar o hook para buscar as etapas
import { Input } from '../ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Componentes para o seletor

/**
 * Barra lateral com informações detalhadas do lead
 *
 * Funcionalidades:
 * - Exibe imagem do contato (avatar_url)
 * - Edição inline do nome do lead
 * - Informações básicas do lead (telefone, email)
 * - Edição da etapa do funil de vendas (NOVO)
 * - Histórico de interações
 * - Tags associadas
 * - Ações rápidas (ligar, agendar, ver histórico)
 * - Seções expansíveis para melhor organização
 * - Timeline de atividades
 */

// Ajustar a interface para aceitar a prop Lead completa, que inclui avatar_url
interface LeadInfoSidebarProps {
  lead: Lead; // Usar a interface Lead importada que já deve ter avatar_url
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
  onViewHistory?: () => void; // Nova prop para ver histórico
}

export const LeadInfoSidebar = ({
  lead,
  tags = [],
  historico = [],
  onCallLead,
  onScheduleAppointment,
  onViewHistory
}: LeadInfoSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    tags: true,
    historico: true,
    anotacoes: true
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(lead.nome);
  const updateLeadMutation = useUpdateLead();

  // Hooks para buscar as etapas e mover o lead entre elas
  const { data: etapas, isLoading: etapasLoading } = useEtapas();
  const moveLeadMutation = useMoveLeadToStage();

  // Efeito para resetar o estado de edição quando o lead selecionado mudar
  useEffect(() => {
    setIsEditingName(false);
    setEditedName(lead.nome);
  }, [lead.id, lead.nome]);


  // Função para salvar o novo nome do lead
  const handleSaveName = () => {
    if (!editedName || editedName.trim() === '') {
      toast.error('O nome do lead não pode ficar em branco.');
      return;
    }
    if (editedName.trim() === lead.nome) {
      setIsEditingName(false); // Nenhuma mudança, apenas fecha o editor
      return;
    }

    updateLeadMutation.mutate(
      { id: lead.id, data: { nome: editedName.trim() } },
      {
        onSuccess: (updatedLead) => {
          toast.success(`Nome do lead atualizado para "${updatedLead.nome}"!`);
          setIsEditingName(false);
        },
        onError: () => {
          // O hook useUpdateLead já mostra um toast de erro genérico.
          // Poderíamos adicionar um mais específico aqui se necessário.
        }
      }
    );
  };

  // Função para lidar com a mudança de etapa do lead
  const handleStageChange = (newStageId: string) => {
    // Verifica se a etapa selecionada é diferente da atual para evitar chamadas desnecessárias
    if (newStageId && newStageId !== lead.etapa_kanban_id) {
      // Chama a mutação para mover o lead para a nova etapa
      moveLeadMutation.mutate({ leadId: lead.id, etapaId: newStageId });
    }
  };

  // Função para toggle de seções
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Função para formatar data
  const formatarData = (dataString: string | null | undefined) => {
    if (!dataString) return 'N/A'; // Tratar caso a data seja nula ou indefinida
    const data = new Date(dataString);
    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
        return 'Data inválida';
    }
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header com foto/avatar e nome editável do lead */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Usar o componente Avatar para exibir a imagem do contato */}
          <Avatar className="w-12 h-12">
            <AvatarImage src={lead.avatar_url || undefined} alt={`Avatar de ${lead.nome || 'Lead'}`} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
              {/* CORREÇÃO: Adicionado fallback para quando o nome for nulo */}
              {lead.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Input
                    value={editedName || ''}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="h-8 text-base"
                    placeholder="Nome do Lead"
                    disabled={updateLeadMutation.isPending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={handleSaveName} disabled={updateLeadMutation.isPending}>
                    <Check size={16} className="text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setIsEditingName(false)} disabled={updateLeadMutation.isPending}>
                    <X size={16} className="text-red-600" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate" title={lead.nome || 'Lead sem nome'}>
                  {lead.nome || 'Lead sem nome'}
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full"
                  onClick={() => {
                    setEditedName(lead.nome);
                    setIsEditingName(true);
                  }}
                >
                  <Edit size={14} className="text-gray-500 hover:text-gray-800" />
                </Button>
              </div>
            )}
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
            <CalendarIconLucide size={14} /> {/* Usar o ícone renomeado */}
            Agendar
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewHistory}
          className="w-full mt-2 flex items-center gap-2"
        >
          <History size={14} />
          Ver Histórico
        </Button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Informações básicas */}
        <Collapsible open={expandedSections.info} onOpenChange={() => toggleSection('info')}>
          <CollapsibleTrigger className="w-full p-4 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between text-left">
            <h4 className="font-medium text-gray-900">Informações Básicas</h4>
            {expandedSections.info ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 border-b border-gray-200 space-y-3">
            {lead.telefone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 break-all">{lead.telefone}</span>
              </div>
            )}

            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 break-all">{lead.email}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <CalendarIconLucide size={16} className="text-gray-400 flex-shrink-0" /> {/* Usar o ícone renomeado */}
              <div className="text-sm text-gray-700">
                <div>Criado: {formatarData(lead.created_at)}</div>
                {lead.updated_at && <div>Atualizado: {formatarData(lead.updated_at)}</div>}
              </div>
            </div>

            {/* NOVO: Seletor de Etapa do Funil */}
            <div className="flex items-start gap-3 pt-2">
              <MoveHorizontal size={16} className="text-gray-400 flex-shrink-0 mt-2.5" />
              <div className="w-full">
                <label className="text-sm text-gray-700">Etapa do Funil</label>
                <Select
                  value={lead.etapa_kanban_id || ''}
                  onValueChange={handleStageChange}
                  disabled={etapasLoading || moveLeadMutation.isPending}
                >
                  <SelectTrigger className="w-full mt-1 h-9">
                    <SelectValue placeholder="Selecione uma etapa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {etapasLoading ? (
                      <SelectItem value="loading" disabled>Carregando etapas...</SelectItem>
                    ) : (
                      etapas && [...etapas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map((etapa) => (
                        <SelectItem key={etapa.id} value={etapa.id}>
                          {etapa.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {moveLeadMutation.isPending && <p className="text-xs text-gray-500 mt-1">Movendo lead...</p>}
              </div>
            </div>

            {lead.ltv && typeof lead.ltv === 'number' && lead.ltv > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-700">
                  LTV: <span className="font-medium text-green-600">R$ {Number(lead.ltv).toFixed(2)}</span>
                </span>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Tags */}
        <Collapsible open={expandedSections.tags} onOpenChange={() => toggleSection('tags')}>
          <CollapsibleTrigger className="w-full p-4 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between text-left">
            <h4 className="font-medium text-gray-900">Tags ({tags.length})</h4>
            {expandedSections.tags ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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
            <CollapsibleTrigger className="w-full p-4 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between text-left">
              <h4 className="font-medium text-gray-900">Anotações</h4>
              {expandedSections.anotacoes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed break-words">{lead.anotacoes}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Histórico de atividades */}
        <Collapsible open={expandedSections.historico} onOpenChange={() => toggleSection('historico')}>
          <CollapsibleTrigger className="w-full p-4 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between text-left">
            <h4 className="font-medium text-gray-900">Histórico ({historico.length})</h4>
            {expandedSections.historico ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4">
            {historico.length > 0 ? (
              <div className="space-y-3">
                {historico.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 break-words">{item.descricao}</p>
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
