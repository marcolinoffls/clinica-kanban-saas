import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Clock, User, MessageSquare, Trash2 } from 'lucide-react';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';
import { useFetchAgendamentos, useDeleteAgendamento, useUpdateAgendamento, AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { AgendamentoStatusActions } from '@/components/agendamentos/AgendamentoStatusActions';
import { useLeads } from '@/hooks/useLeadsData';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { AgendamentoStatus, AGENDAMENTO_STATUS_OPTIONS } from '@/constants/agendamentos';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimelineDayView } from '@/components/calendar/TimelineDayView';
import { generateTimeSlots, calculateCardPosition, SLOT_HEIGHT_PX, START_HOUR } from '@/utils/timelineUtils';

/**
 * Página de Agenda/Calendário
 * 
 * Funcionalidades:
 * - Visualização em dia, semana e mês
 * - Busca de agendamentos reais do Supabase
 * - Criação, edição e exclusão de agendamentos
 * - Integração com dados de clientes
 * - Notificações e lembretes
 * 
 * Os agendamentos incluem:
 * - Data e horário
 * - Cliente associado
 * - Tipo de procedimento
 * - Status (agendado, confirmado, realizado, cancelado)
 */

type MonthViewMode = 'calendar' | 'list' | 'grid';
type DisplayMode = 'list' | 'timeline';

export const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [monthViewMode, setMonthViewMode] = useState<MonthViewMode>('calendar');
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<AgendamentoFromDatabase | null>(null);

  // NOVO: Estado para controlar o diálogo de confirmação de exclusão
  const [agendamentoParaDeletarId, setAgendamentoParaDeletarId] = useState<string | null>(null);

  // NOVO: Estado para controlar o diálogo de confirmação de MUDANÇA DE STATUS
  const [statusUpdateConfirmation, setStatusUpdateConfirmation] = useState<{
    agendamento: AgendamentoFromDatabase;
    newStatus: AgendamentoStatus;
  } | null>(null);

  // NOVO: Estado para armazenar o valor confirmado ao marcar como pago.
  const [valorConfirmado, setValorConfirmado] = useState<string>('');

  // Buscar agendamentos e instanciar as mutações de delete e update
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useFetchAgendamentos();
  const { data: leads = [] } = useLeads();
  const deleteAgendamentoMutation = useDeleteAgendamento();
  const updateAgendamentoMutation = useUpdateAgendamento(); // NOVO

  // Função para navegar entre datas
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Função para formatar data para exibição
  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (viewMode) {
      case 'day':
        options.weekday = 'long';
        options.day = 'numeric';
        options.month = 'long';
        options.year = 'numeric';
        break;
      case 'week':
        const startWeek = startOfWeek(currentDate, { locale: ptBR });
        const endWeek = endOfWeek(currentDate, { locale: ptBR });
        return `${format(startWeek, 'dd', { locale: ptBR })} de ${format(startWeek, 'MMMM', { locale: ptBR })} a ${format(endWeek, 'dd', { locale: ptBR })} de ${format(endWeek, 'MMMM yyyy', { locale: ptBR })}`;
      case 'month':
        options.month = 'long';
        options.year = 'numeric';
        break;
    }
    
    return currentDate.toLocaleDateString('pt-BR', options);
  };

  // CORREÇÃO e MELHORIA: A função foi atualizada para usar os valores de status
  // em minúsculas do enum `AgendamentoStatus` e cobrir todos os casos.
  // NOVO: A função agora retorna um objeto com todas as classes de cor necessárias.
  const getStatusClasses = (status: string) => {
    switch (status) {
      case AgendamentoStatus.CONFIRMADO:
        return {
          border: 'border-green-500',
          tagBg: 'bg-green-100',
          tagText: 'text-green-700',
        };
      case AgendamentoStatus.AGENDADO:
        return {
          border: 'border-blue-500',
          tagBg: 'bg-blue-100',
          tagText: 'text-blue-700',
        };
      case AgendamentoStatus.REALIZADO:
        return {
          border: 'border-purple-500',
          tagBg: 'bg-purple-100',
          tagText: 'text-purple-700',
        };
      case AgendamentoStatus.PAGO:
        return {
          border: 'border-emerald-500',
          tagBg: 'bg-emerald-100',
          tagText: 'text-emerald-700',
        };
      case AgendamentoStatus.CANCELADO:
        return {
          border: 'border-red-500',
          tagBg: 'bg-red-100',
          tagText: 'text-red-700',
        };
      case AgendamentoStatus.NAO_COMPARECEU:
        return {
          border: 'border-yellow-500',
          tagBg: 'bg-yellow-100',
          tagText: 'text-yellow-700',
        };
      default:
        return {
          border: 'border-gray-300',
          tagBg: 'bg-gray-100',
          tagText: 'text-gray-700',
        };
    }
  };

  // CORREÇÃO e MELHORIA: A função agora busca o texto correspondente na lista
  // de opções, tornando-a mais robusta e centralizada.
  const getStatusText = (status: string) => {
    const statusOption = AGENDAMENTO_STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.label || status;
  };

  // Função para obter nome do cliente pelo ID
  const getClienteNome = (clienteId: string) => {
    const cliente = leads.find(lead => lead.id === clienteId);
    return cliente?.nome || 'Cliente não encontrado';
  };

  // Função para obter telefone do cliente pelo ID
  const getClienteTelefone = (clienteId: string) => {
    const cliente = leads.find(lead => lead.id === clienteId);
    return cliente?.telefone || '';
  };

  // Função para abrir modal de edição
  const handleEditAgendamento = (agendamento: AgendamentoFromDatabase) => {
    setAgendamentoParaEditar(agendamento);
    setIsAgendamentoModalOpen(true);
  };

  // Função para abrir modal de criação
  const handleNovoAgendamento = () => {
    setAgendamentoParaEditar(null);
    setIsAgendamentoModalOpen(true);
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setAgendamentoParaEditar(null);
    setIsAgendamentoModalOpen(false);
  };

  // NOVO: Funções para controlar o diálogo de exclusão
  const handleOpenDeleteDialog = (id: string) => {
    setAgendamentoParaDeletarId(id);
  };

  const handleConfirmDelete = () => {
    if (agendamentoParaDeletarId) {
      deleteAgendamentoMutation.mutate(agendamentoParaDeletarId);
      setAgendamentoParaDeletarId(null); // Fecha o diálogo após a exclusão
    }
  };

  // NOVO: Funções para controlar a mudança de status e seu diálogo de confirmação
  const handleStatusChange = (agendamento: AgendamentoFromDatabase, newStatus: AgendamentoStatus) => {
    // Se o novo status for 'pago', pré-preenche o campo de valor com o valor existente do agendamento.
    // Isso facilita a confirmação ou ajuste do valor.
    if (newStatus === AgendamentoStatus.PAGO) {
      setValorConfirmado(String(agendamento.valor || ''));
    }
    setStatusUpdateConfirmation({ agendamento, newStatus });
  };

  const handleConfirmStatusUpdate = () => {
    if (statusUpdateConfirmation) {
      // Prepara o objeto de dados para a atualização.
      const payload: { id: string; status: AgendamentoStatus; valor?: number } = {
        id: statusUpdateConfirmation.agendamento.id,
        status: statusUpdateConfirmation.newStatus,
      };

      // Se a ação é marcar como 'pago', inclui o valor confirmado no payload.
      // O valor é convertido para número; se estiver vazio, vira 0.
      if (statusUpdateConfirmation.newStatus === AgendamentoStatus.PAGO) {
        payload.valor = Number(valorConfirmado) || 0;
      }

      updateAgendamentoMutation.mutate(payload);
      
      setStatusUpdateConfirmation(null); // Fecha o diálogo
      setValorConfirmado(''); // Limpa o estado do valor
    }
  };
  
  // NOVO: Função para gerar a descrição do diálogo de confirmação de status
  const getStatusChangeDescription = () => {
    if (!statusUpdateConfirmation) return '';
    const oldStatusLabel = getStatusText(statusUpdateConfirmation.agendamento.status).toLowerCase();
    const newStatusLabel = getStatusText(statusUpdateConfirmation.newStatus).toLowerCase();
    return `Você tem certeza que deseja alterar o status de "${oldStatusLabel}" para "${newStatusLabel}"?`;
  };

  // Função para abrir chat do cliente
  const handleOpenChat = (clienteId: string) => {
    navigate(`/chat?leadId=${clienteId}`);
  };

  // Filtrar agendamentos para a visualização atual
  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data_inicio);
    const dataAtual = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        return isSameDay(dataAgendamento, dataAtual);
      case 'week':
        const startWeek = startOfWeek(dataAtual, { locale: ptBR });
        const endWeek = endOfWeek(dataAtual, { locale: ptBR });
        return dataAgendamento >= startWeek && dataAgendamento <= endWeek;
      case 'month':
        return isSameMonth(dataAgendamento, dataAtual);
      default:
        return true;
    }
  });

  // MELHORIA: O card do agendamento foi reestruturado para acomodar as ações de status.
  const renderAgendamentoCard = (agendamento: AgendamentoFromDatabase) => {
    // Busca as classes de cor com base no status atual
    const statusClasses = getStatusClasses(agendamento.status);
    
    return (
      <div
        key={agendamento.id}
        className={`bg-white p-3 rounded-lg border-l-4 shadow-sm flex flex-col justify-between ${statusClasses.border}`}
      >
        {/* O conteúdo principal do card ainda abre a edição ao ser clicado */}
        <div
          className="cursor-pointer"
          onClick={() => handleEditAgendamento(agendamento)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-gray-600 flex-shrink-0" />
                <h4 className="font-semibold text-gray-800 truncate text-sm">
                  {getClienteNome(agendamento.cliente_id)}
                </h4>
              </div>
              
              <p className="text-xs text-gray-600 mb-2 truncate">
                {agendamento.titulo}
              </p>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {format(new Date(agendamento.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
                {agendamento.valor && agendamento.valor > 0 && (
                  <span className="font-medium">R$ {agendamento.valor.toFixed(2)}</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end justify-between h-full gap-2 ml-2">
              {/* ATUALIZADO: As classes de cor da tag agora são dinâmicas */}
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses.tagBg} ${statusClasses.tagText}`}>
                {getStatusText(agendamento.status)}
              </span>
              
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita abrir o modal de edição
                    handleOpenChat(agendamento.cliente_id);
                  }}
                  className="p-1.5 hover:bg-blue-100 rounded-full text-blue-600 hover:text-blue-700 transition-colors"
                  title="Enviar mensagem"
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita abrir o modal de edição
                    handleEditAgendamento(agendamento);
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
                  title="Editar agendamento"
                >
                  <Edit size={14} />
                </button>
                {/* Botão de exclusão */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita abrir o modal de edição
                    handleOpenDeleteDialog(agendamento.id);
                  }}
                  className="p-1.5 hover:bg-red-100 rounded-full text-red-600 hover:text-red-700 transition-colors"
                  title="Excluir agendamento"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* NOVO: Seção separada para as ações de status, com uma linha divisória. */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <AgendamentoStatusActions
            agendamento={agendamento}
            onStatusChange={(newStatus) => handleStatusChange(agendamento, newStatus)}
          />
        </div>
      </div>
    );
  };

  // Renderizar visualização de calendário em grid para o mês
  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1 h-full">
        {/* Cabeçalho dos dias da semana */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 border-b">
            {day}
          </div>
        ))}
        
        {/* Dias do calendário */}
        {days.map(day => {
          const dayAgendamentos = agendamentos.filter(agendamento => 
            isSameDay(new Date(agendamento.data_inicio), day)
          );
          
          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[80px] p-1 border border-gray-200 ${
                !isSameMonth(day, currentDate) ? 'bg-gray-50 text-gray-400' : 'bg-white'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayAgendamentos.slice(0, 2).map(agendamento => (
                  <div 
                    key={agendamento.id}
                    className={`text-xs p-1 rounded cursor-pointer ${getStatusClasses(agendamento.status).border}`}
                    onClick={() => handleEditAgendamento(agendamento)}
                  >
                    {format(new Date(agendamento.data_inicio), 'HH:mm')} - {getClienteNome(agendamento.cliente_id)}
                  </div>
                ))}
                {dayAgendamentos.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayAgendamentos.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // NOVO: Função para renderizar a visualização de timeline para a semana inteira.
  const renderWeekTimeline = () => {
    const start = startOfWeek(currentDate, { locale: ptBR });
    const end = endOfWeek(currentDate, { locale: ptBR });
    const weekDays = eachDayOfInterval({ start, end });
    const timeSlots = generateTimeSlots(START_HOUR);

    return (
      <div className="flex h-full">
        {/* Coluna de horários fixa à esquerda, que não rola horizontalmente */}
        <div className="w-16 flex-shrink-0 sticky left-0 bg-white z-20 border-r border-gray-200">
          {/* Espaço em branco para alinhar com os cabeçalhos dos dias */}
          <div className="h-16 border-b border-gray-200" />
          {/* Renderiza as marcações de hora */}
          {timeSlots.map((slot) => {
            if (slot.endsWith(':00')) {
              return (
                <div
                  key={`time-${slot}`}
                  className="relative text-xs text-gray-500 text-right pr-2"
                  style={{ height: `${SLOT_HEIGHT_PX * 2}px` }}
                >
                  <span className="absolute -top-1.5">{slot}</span>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Container rolável para os dias da semana */}
        <div className="grid grid-cols-7 flex-1">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="border-r border-gray-200 min-w-[200px]">
              {/* Cabeçalho do dia, fixo no topo ao rolar */}
              <div className="text-center p-2 border-b border-gray-200 sticky top-0 bg-white z-10 h-16 flex flex-col justify-center">
                <p className="font-semibold text-sm capitalize">{format(day, 'EEE', { locale: ptBR })}</p>
                <p className="text-2xl font-bold">{format(day, 'd')}</p>
              </div>
              
              {/* Renderiza a timeline para este dia, mas sem a coluna de tempo (pois já existe a fixa) */}
              <TimelineDayView
                agendamentosDoDia={agendamentos.filter(ag => isSameDay(new Date(ag.data_inicio), day))}
                getClienteNome={getClienteNome}
                getStatusClasses={getStatusClasses}
                onEditAgendamento={handleEditAgendamento}
                showTimeColumn={false}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header da página */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <p className="text-gray-600 mt-1">
            Gerencie os agendamentos da sua clínica
          </p>
        </div>
        <button 
          onClick={handleNovoAgendamento}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Agendamento
        </button>
      </div>

      {/* Controles do calendário */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          {/* Navegação de data */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 min-w-[300px] text-center">
              {formatDateHeader()}
            </h3>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hoje
            </button>
          </div>

          {/* Controles de Visualização */}
          <div className="flex items-center gap-4">
            {/* NOVO: Seletor de modo de exibição (Lista/Timeline) para Dia e Semana */}
            {(viewMode === 'day' || viewMode === 'week') && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['list', 'timeline'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDisplayMode(mode)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      displayMode === mode
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode === 'list' ? 'Lista' : 'Timeline'}
                  </button>
                ))}
              </div>
            )}
            
            {/* Seletor de visualização (Dia/Semana/Mês) */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['day', 'week', 'month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode as any);
                    // Reseta para 'list' se mudar para mês, onde timeline não está disponível
                    if (mode === 'month') setDisplayMode('list');
                  }}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-modos para visualização mensal */}
        {viewMode === 'month' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600 mr-2">Visualização:</span>
            {(['calendar', 'list', 'grid'] as MonthViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setMonthViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  monthViewMode === mode
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {mode === 'calendar' ? 'Calendário' : mode === 'list' ? 'Lista' : 'Grade'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Área principal - com padding bottom para as métricas fixas */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden relative">
        <div className="h-full pb-24 overflow-auto">
          {loadingAgendamentos ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Carregando agendamentos...</div>
            </div>
          ) : (
            <div className="h-full">
              {/* Renderização baseada no modo de visualização */}
              {viewMode === 'month' && monthViewMode === 'calendar' ? (
                <div className="p-6">{renderCalendarGrid()}</div>
              
              // NOVO: Renderiza a timeline de dia
              ) : viewMode === 'day' && displayMode === 'timeline' ? (
                <div className="p-4 h-full">
                  <TimelineDayView
                    agendamentosDoDia={agendamentosFiltrados}
                    getClienteNome={getClienteNome}
                    getStatusClasses={getStatusClasses}
                    onEditAgendamento={handleEditAgendamento}
                  />
                </div>
              
              // NOVO: Renderiza a timeline de semana
              ) : viewMode === 'week' && displayMode === 'timeline' ? (
                renderWeekTimeline()
              
              // Renderização padrão (lista/grade)
              ) : (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Agendamentos {viewMode === 'day' ? 'do dia' : viewMode === 'week' ? 'da semana' : 'do mês'}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {agendamentosFiltrados.length} agendamento(s) encontrado(s)
                    </span>
                  </div>

                  {agendamentosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
                      <p className="text-gray-500 mb-4">
                        Não há agendamentos para o período selecionado.
                      </p>
                      <button
                        onClick={handleNovoAgendamento}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Criar primeiro agendamento
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {agendamentosFiltrados.map(renderAgendamentoCard)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Métricas fixas na parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <h4 className="text-sm font-medium text-gray-600">Total</h4>
              <p className="text-xl font-bold text-blue-600">{agendamentos.length}</p>
            </div>
            {/* CORREÇÃO: Os status foram atualizados para minúsculas */}
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <h4 className="text-sm font-medium text-gray-600">Agendados</h4>
              <p className="text-xl font-bold text-yellow-600">
                {agendamentos.filter(a => a.status === AgendamentoStatus.AGENDADO).length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <h4 className="text-sm font-medium text-gray-600">Confirmados</h4>
              <p className="text-xl font-bold text-green-600">
                {agendamentos.filter(a => a.status === AgendamentoStatus.CONFIRMADO).length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <h4 className="text-sm font-medium text-gray-600">Realizados</h4>
              <p className="text-xl font-bold text-purple-600">
                {agendamentos.filter(a => a.status === AgendamentoStatus.REALIZADO).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Registro/Edição de Agendamento */}
      <RegistroAgendamentoModal
        isOpen={isAgendamentoModalOpen}
        onClose={handleCloseModal}
        agendamento={agendamentoParaEditar}
      />

      {/* NOVO: Diálogo de confirmação para exclusão de agendamento */}
      <AlertDialog open={!!agendamentoParaDeletarId} onOpenChange={(open) => !open && setAgendamentoParaDeletarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o agendamento do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgendamentoParaDeletarId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAgendamentoMutation.isPending}
            >
              {deleteAgendamentoMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* NOVO: Diálogo de confirmação para MUDANÇA DE STATUS de agendamento */}
      <AlertDialog open={!!statusUpdateConfirmation} onOpenChange={(open) => {
        // Ao fechar o diálogo (seja por clique fora ou cancelamento),
        // reseta ambos os estados para garantir que o modal esteja limpo na próxima vez.
        if (!open) {
          setStatusUpdateConfirmation(null);
          setValorConfirmado('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Mudança de Status</AlertDialogTitle>
            <AlertDialogDescription>
              {getStatusChangeDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* CAMPO CONDICIONAL: Aparece apenas ao marcar um agendamento como "Pago" */}
          {statusUpdateConfirmation?.newStatus === AgendamentoStatus.PAGO && (
            <div className="grid gap-2 py-2">
              <Label htmlFor="valor-pago">Confirmar Valor Pago (R$)</Label>
              <Input
                id="valor-pago"
                type="number"
                placeholder="Ex: 150.00"
                value={valorConfirmado}
                onChange={(e) => setValorConfirmado(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500">
                O valor original do agendamento era R$ {statusUpdateConfirmation.agendamento.valor?.toFixed(2) || '0.00'}.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              // Garante que ao clicar em "Cancelar", os estados sejam limpos.
              setStatusUpdateConfirmation(null);
              setValorConfirmado('');
            }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmStatusUpdate}
              disabled={updateAgendamentoMutation.isPending}
            >
              {updateAgendamentoMutation.isPending ? 'Atualizando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
