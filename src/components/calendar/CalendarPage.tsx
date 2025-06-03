import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Clock, User, MessageSquare } from 'lucide-react';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';
import { useFetchAgendamentos, AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { useLeads } from '@/hooks/useLeadsData';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

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

export const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [monthViewMode, setMonthViewMode] = useState<MonthViewMode>('calendar');
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<AgendamentoFromDatabase | null>(null);

  // Buscar agendamentos reais do Supabase
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useFetchAgendamentos();
  const { data: leads = [] } = useLeads();

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

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'AGENDADO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REALIZADO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'Confirmado';
      case 'AGENDADO':
        return 'Agendado';
      case 'REALIZADO':
        return 'Realizado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
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

  // Renderizar card de agendamento compacto
  const renderAgendamentoCard = (agendamento: AgendamentoFromDatabase) => (
    <div
      key={agendamento.id}
      className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(agendamento.status)}`}
      onClick={() => handleEditAgendamento(agendamento)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-gray-600 flex-shrink-0" />
            <h4 className="font-medium text-gray-900 truncate text-sm">
              {getClienteNome(agendamento.cliente_id)}
            </h4>
          </div>
          
          <p className="text-xs text-gray-600 mb-1 truncate">
            <strong>Serviço:</strong> {agendamento.titulo}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {format(new Date(agendamento.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </span>
            {agendamento.valor && agendamento.valor > 0 && (
              <span>R$ {agendamento.valor.toFixed(2)}</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 ml-2">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agendamento.status)}`}>
            {getStatusText(agendamento.status)}
          </span>
          
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenChat(agendamento.cliente_id);
              }}
              className="p-1 hover:bg-blue-100 rounded text-blue-600 hover:text-blue-700"
              title="Enviar mensagem"
            >
              <MessageSquare size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditAgendamento(agendamento);
              }}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
              title="Editar agendamento"
            >
              <Edit size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
                    className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(agendamento.status)}`}
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

          {/* Seletor de visualização */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
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
        <div className="h-full pb-24 overflow-hidden">
          {loadingAgendamentos ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Carregando agendamentos...</div>
            </div>
          ) : (
            <div className="h-full overflow-auto p-6">
              {/* Renderização baseada no modo de visualização */}
              {viewMode === 'month' && monthViewMode === 'calendar' ? (
                renderCalendarGrid()
              ) : (
                <div>
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
                    <div className="space-y-2">
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
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <h4 className="text-sm font-medium text-gray-600">Agendados</h4>
              <p className="text-xl font-bold text-yellow-600">
                {agendamentos.filter(a => a.status === 'AGENDADO').length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <h4 className="text-sm font-medium text-gray-600">Confirmados</h4>
              <p className="text-xl font-bold text-green-600">
                {agendamentos.filter(a => a.status === 'CONFIRMADO').length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <h4 className="text-sm font-medium text-gray-600">Realizados</h4>
              <p className="text-xl font-bold text-purple-600">
                {agendamentos.filter(a => a.status === 'REALIZADO').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Registro/Edição de Agendamento */}
      <RegistroAgendamentoModal
        isOpen={modalEditarAberto}
        onClose={() => setModalEditarAberto(false)}
        agendamento={agendamentoSelecionado}
      />
  );
};
