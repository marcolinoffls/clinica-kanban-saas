import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Clock, User, MessageSquare, Calendar as CalendarIconLucide } from 'lucide-react'; // Renomeado Calendar
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';
import { useFetchAgendamentos, AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { useLeads } from '@/hooks/useLeadsData';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Importar Button

/**
 * Página de Agenda/Calendário
 *
 * Funcionalidades:
 * - Visualização em dia, semana e mês (com sub-modos para mês: calendário, lista, grade)
 * - Métricas de resumo fixas no rodapé com conteúdo rolável acima.
 * - Cards de agendamento otimizados.
 * - Exibição clara do intervalo de datas para a semana.
 * - Visualização semanal agrupada por dia.
 */

type MonthViewMode = 'calendar' | 'list' | 'grid'; // 'grid' é a visualização de colunas verticais para os dias do mês

export const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [monthViewMode, setMonthViewMode] = useState<MonthViewMode>('calendar'); // Padrão para calendário
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<AgendamentoFromDatabase | null>(null);

  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useFetchAgendamentos();
  const { data: leads = [] } = useLeads();

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -1));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'week':
        const startWeek = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }); // Semana começa na Segunda
        const endWeek = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
        if (format(startWeek, 'MMMM') === format(endWeek, 'MMMM')) {
          return `${format(startWeek, 'dd')} a ${format(endWeek, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
        }
        return `${format(startWeek, "dd 'de' MMMM", { locale: ptBR })} a ${format(endWeek, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
      case 'month':
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
    return '';
  };

  const getStatusColor = (status: string) => {
    // (Mantido como no seu código original)
    switch (status) {
      case 'CONFIRMADO': return 'border-green-500 bg-green-50';
      case 'AGENDADO': return 'border-blue-500 bg-blue-50';
      case 'REALIZADO': return 'border-purple-500 bg-purple-50'; // Exemplo
      case 'CANCELADO': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };
  const getStatusTextColor = (status: string) => {
     // (Mantido como no seu código original)
    switch (status) {
      case 'CONFIRMADO': return 'text-green-700';
      case 'AGENDADO': return 'text-blue-700';
      case 'REALIZADO': return 'text-purple-700';
      case 'CANCELADO': return 'text-red-700';
      default: return 'text-gray-700';
    }
  }


  const getStatusText = (status: string) => {
    // (Mantido como no seu código original)
    const statusOption = AGENDAMENTO_STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getClienteNome = (clienteId: string | null) => {
    if (!clienteId) return 'Cliente desconhecido';
    const cliente = leads.find(lead => lead.id === clienteId);
    return cliente?.nome || 'Cliente não encontrado';
  };

  const handleEditAgendamento = (agendamento: AgendamentoFromDatabase) => {
    setAgendamentoParaEditar(agendamento);
    setIsAgendamentoModalOpen(true);
  };

  const handleNovoAgendamento = () => {
    setAgendamentoParaEditar(null);
    setIsAgendamentoModalOpen(true);
  };

  const handleCloseModal = () => {
    setAgendamentoParaEditar(null);
    setIsAgendamentoModalOpen(false);
  };

  const handleOpenChat = (clienteId: string | null) => {
    if (clienteId) navigate(`/chat?leadId=${clienteId}`);
  };

  // Card de agendamento otimizado
  const renderAgendamentoCard = (agendamento: AgendamentoFromDatabase, showDate: boolean = false) => (
    <div
      key={agendamento.id}
      className={`p-3 rounded-md border-l-4 shadow-sm cursor-pointer hover:shadow-lg transition-shadow ${getStatusColor(agendamento.status)}`}
      onClick={() => handleEditAgendamento(agendamento)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-gray-500 flex-shrink-0" />
            <h4 className="font-semibold text-gray-800 truncate text-sm">
              {getClienteNome(agendamento.cliente_id)}
            </h4>
          </div>
          <p className="text-xs text-gray-600 mb-1 truncate" title={agendamento.titulo}>
            {agendamento.titulo}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {showDate && `${format(new Date(agendamento.data_inicio), "dd/MM", { locale: ptBR })} - `}
              {format(new Date(agendamento.data_inicio), "HH:mm", { locale: ptBR })}
              {' - '}
              {format(new Date(agendamento.data_fim), "HH:mm", { locale: ptBR })}
            </span>
            {agendamento.valor && agendamento.valor > 0 && (
              <span className="font-medium">R$ {agendamento.valor.toFixed(2)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 ml-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(agendamento.status)} ${getStatusTextColor(agendamento.status)} border ${getStatusColor(agendamento.status).replace('bg-', 'border-')}`}>
            {getStatusText(agendamento.status)}
          </span>
          <div className="flex mt-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenChat(agendamento.cliente_id); }}
              className="p-1 hover:bg-blue-100 rounded text-blue-500 hover:text-blue-700"
              title="Enviar mensagem"
            > <MessageSquare size={12} /> </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleEditAgendamento(agendamento); }}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
              title="Editar agendamento"
            > <Edit size={12} /> </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDayColumn = (day: Date, forMonthGrid: boolean = false) => {
    const dayAgendamentos = agendamentos.filter(ag => isSameDay(new Date(ag.data_inicio), day));
    dayAgendamentos.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

    return (
      <div
        key={day.toISOString()}
        className={`border border-gray-200 rounded-md ${forMonthGrid ? 'min-h-[100px]' : 'flex-1 min-w-[180px]'} ${!isSameMonth(day, currentDate) && forMonthGrid ? 'bg-gray-50' : 'bg-white'}`}
      >
        <div className={`p-2 text-center border-b ${isSameDay(day, new Date()) && !forMonthGrid ? 'bg-blue-500 text-white rounded-t-md' : 'bg-gray-50'}`}>
          <div className={`text-xs font-medium ${!isSameMonth(day, currentDate) && forMonthGrid ? 'text-gray-400' : 'text-gray-600'}`}>
            {format(day, 'EEE', { locale: ptBR }).toUpperCase()}
          </div>
          <div className={`text-lg font-semibold ${!isSameMonth(day, currentDate) && forMonthGrid ? 'text-gray-400' : 'text-gray-800'}`}>
            {format(day, 'd')}
          </div>
        </div>
        <div className="p-2 space-y-2 overflow-y-auto h-[calc(100%-60px)]">
          {dayAgendamentos.length > 0 ? (
            dayAgendamentos.map(ag => renderAgendamentoCard(ag, false))
          ) : (
            <p className="text-xs text-gray-400 text-center mt-4">Nenhum agendamento</p>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    return (
      <div className="flex gap-2 h-full">
        {days.map(day => renderDayColumn(day))}
      </div>
    );
  };

  const renderCalendarGridForMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDateCal = startOfWeek(monthStart, { locale: ptBR, weekStartsOn: 0 }); // Calendário começa no Domingo
    const endDateCal = endOfWeek(monthEnd, { locale: ptBR, weekStartsOn: 0 });
    const daysInCalendar = eachDayOfInterval({ start: startDateCal, end: endDateCal });
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 h-full">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
        {daysInCalendar.map(day => {
          const dayAgendamentos = agendamentos.filter(ag => isSameDay(new Date(ag.data_inicio), day));
          return (
            <div
              key={day.toISOString()}
              className={`p-1 min-h-[80px] ${!isSameMonth(day, currentDate) ? 'bg-gray-100' : 'bg-white'} hover:bg-gray-50 transition-colors`}
            >
              <div className={`text-xs text-right ${!isSameMonth(day, currentDate) ? 'text-gray-400' : 'text-gray-700'} ${isSameDay(day, new Date()) ? 'font-bold text-blue-600' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="mt-1 space-y-1">
                {dayAgendamentos.slice(0, 2).map(ag => (
                  <div
                    key={ag.id}
                    title={`${format(new Date(ag.data_inicio), 'HH:mm')} - ${getClienteNome(ag.cliente_id)} (${ag.titulo})`}
                    className={`text-[10px] p-0.5 rounded truncate cursor-pointer ${getStatusColor(ag.status).replace('bg-', 'border-').replace('text-', 'text-')} ${getStatusTextColor(ag.status)}`}
                    onClick={() => handleEditAgendamento(ag)}
                  >
                    {format(new Date(ag.data_inicio), 'HH:mm')} {getClienteNome(ag.cliente_id)}
                  </div>
                ))}
                {dayAgendamentos.length > 2 && (
                  <div className="text-[10px] text-gray-500 text-center mt-0.5">
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

  // Renderiza visualização em grade (colunas verticais) para o mês
  const renderMonthAsVerticalGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentDate) });
    return (
      <div className="flex gap-2 overflow-x-auto h-full py-2">
        {daysInMonth.map(day => renderDayColumn(day, true))}
      </div>
    );
  };

  const renderContent = () => {
    if (loadingAgendamentos) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-500">Carregando agendamentos...</p>
        </div>
      );
    }

    if (viewMode === 'month') {
      if (monthViewMode === 'calendar') return renderCalendarGridForMonth();
      if (monthViewMode === 'grid') return renderMonthAsVerticalGrid();
      // Fallback para lista se 'list' ou não reconhecido
    }
    if (viewMode === 'week') return renderWeekView();
    // Para 'day' ou 'month' com monthViewMode 'list'
    if (agendamentosFiltrados.length === 0) {
      return (
        <div className="text-center py-12 h-full flex flex-col items-center justify-center">
          <CalendarIconLucide className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum agendamento</h3>
          <p className="text-sm text-gray-500 mb-4">Não há agendamentos para o período selecionado.</p>
          <Button onClick={handleNovoAgendamento} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" /> Criar Novo Agendamento
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-2 h-full">
        {agendamentosFiltrados.map(ag => renderAgendamentoCard(ag, viewMode !== 'day'))}
      </div>
    );
  };


  return (
    <div className="h-screen flex flex-col p-0 sm:p-4 md:p-6 bg-gray-50">
      {/* Header da página */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 flex-shrink-0 px-4 sm:px-0 pt-4 sm:pt-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Agenda</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie os agendamentos da sua clínica
          </p>
        </div>
        <Button
          onClick={handleNovoAgendamento}
          className="bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto"
        >
          <Plus size={20} />
          Novo Agendamento
        </Button>
      </div>

      {/* Controles do calendário */}
      <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-1 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} />
            </Button>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 min-w-[150px] sm:min-w-[280px] text-center whitespace-nowrap">
              {formatDateHeader()}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={20} />
            </Button>
            <Button
              onClick={() => setCurrentDate(new Date())}
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs sm:text-sm"
            >
              Hoje
            </Button>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1 mt-2 sm:mt-0">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium transition-colors rounded-md ${
                  viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
              </Button>
            ))}
          </div>
        </div>

        {viewMode === 'month' && (
          <div className="flex gap-1 sm:gap-2 mt-3 pt-3 border-t border-gray-200 justify-center sm:justify-start">
            <span className="text-xs sm:text-sm text-gray-600 mr-2 self-center">Ver como:</span>
            {(['calendar', 'list', 'grid'] as MonthViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={monthViewMode === mode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMonthViewMode(mode)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm ${
                  monthViewMode === mode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {mode === 'calendar' ? 'Calendário' : mode === 'list' ? 'Lista' : 'Grade Vertical'}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Área de Conteúdo Principal (Rolável) e Métricas Fixas */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Área rolável para os agendamentos */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {renderContent()}
        </div>

        {/* Métricas fixas no rodapé */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
            {[
              { label: 'Total', value: agendamentos.length, color: 'text-blue-600' },
              { label: 'Agendados', value: agendamentos.filter(a => a.status === 'AGENDADO').length, color: 'text-yellow-600' },
              { label: 'Confirmados', value: agendamentos.filter(a => a.status === 'CONFIRMADO').length, color: 'text-green-600' },
              { label: 'Realizados', value: agendamentos.filter(a => a.status === 'REALIZADO').length, color: 'text-purple-600' },
            ].map(metric => (
              <div key={metric.label} className="bg-white p-2 sm:p-3 rounded-md shadow-sm border">
                <h4 className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">{metric.label}</h4>
                <p className={`text-lg sm:text-xl font-bold ${metric.color}`}>{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RegistroAgendamentoModal
        isOpen={isAgendamentoModalOpen}
        onClose={handleCloseModal}
        agendamentoParaEditar={agendamentoParaEditar}
      />
    </div>
  );
};