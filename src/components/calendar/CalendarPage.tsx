import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';

/**
 * Página de Agenda/Calendário
 * 
 * Funcionalidades:
 * - Visualização em dia, semana e mês
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

interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  procedure: string;
  date: Date;
  duration: number; // em minutos
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);

  // Dados mockados de agendamentos
  const appointments: Appointment[] = [
    {
      id: '1',
      clientName: 'Maria Silva',
      clientPhone: '(11) 99999-9999',
      procedure: 'Consulta de Rotina',
      date: new Date('2024-01-15T09:00:00'),
      duration: 60,
      status: 'confirmed',
      notes: 'Paciente pontual'
    },
    {
      id: '2',
      clientName: 'João Santos',
      clientPhone: '(11) 88888-8888',
      procedure: 'Implante Dentário',
      date: new Date('2024-01-15T14:30:00'),
      duration: 120,
      status: 'scheduled'
    },
    {
      id: '3',
      clientName: 'Ana Costa',
      clientPhone: '(11) 77777-7777',
      procedure: 'Limpeza',
      date: new Date('2024-01-16T10:00:00'),
      duration: 45,
      status: 'confirmed'
    }
  ];

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
        options.month = 'long';
        options.year = 'numeric';
        return `Semana de ${currentDate.toLocaleDateString('pt-BR', options)}`;
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
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Realizado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header da página */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <p className="text-gray-600 mt-1">
            Gerencie os agendamentos da sua clínica
          </p>
        </div>
        <button 
          onClick={() => setIsAgendamentoModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Agendamento
        </button>
      </div>

      {/* Controles do calendário */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
        <div className="flex justify-between items-center">
          {/* Navegação de data */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
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
      </div>

      {/* Área do calendário */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
        {viewMode === 'week' && (
          <div>
            {/* Grid de horários para visualização semanal */}
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`p-4 rounded-lg border-l-4 ${getStatusColor(appointment.status)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {appointment.clientName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {appointment.procedure}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {appointment.date.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {appointment.duration} min
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {appointment.clientPhone}
                      </p>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {appointment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-4">
              Agendamentos do dia
            </h3>
            {/* Aqui seria implementada a visualização de dia */}
            <p className="text-gray-500">Visualização de dia em desenvolvimento</p>
          </div>
        )}

        {viewMode === 'month' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Visão mensal
            </h3>
            {/* Aqui seria implementada a visualização de mês */}
            <p className="text-gray-500">Visualização de mês em desenvolvimento</p>
          </div>
        )}
      </div>

      {/* Resumo estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600">Hoje</h4>
          <p className="text-2xl font-bold text-blue-600">3</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600">Esta Semana</h4>
          <p className="text-2xl font-bold text-green-600">12</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600">Confirmados</h4>
          <p className="text-2xl font-bold text-purple-600">8</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600">Pendentes</h4>
          <p className="text-2xl font-bold text-orange-600">4</p>
        </div>
      </div>

      {/* Modal de Registro de Agendamento */}
      <RegistroAgendamentoModal
        isOpen={isAgendamentoModalOpen}
        onClose={() => setIsAgendamentoModalOpen(false)}
      />
    </div>
  );
};
