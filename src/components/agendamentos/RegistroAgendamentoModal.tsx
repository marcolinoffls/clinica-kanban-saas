
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { useLeads } from '@/hooks/useLeadsData';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { AGENDAMENTO_STATUS_OPTIONS, AgendamentoFormData } from '@/constants/agendamentos';

/**
 * Modal para registrar/editar agendamentos
 * 
 * Funcionalidades:
 * - Formulário completo para criação de agendamentos
 * - Seleção de lead/cliente existente
 * - Definição de data/hora de início e fim
 * - Controle de status do agendamento
 * - Valor financeiro e observações
 * - Validação de campos obrigatórios
 * 
 * Props:
 * - isOpen: controla visibilidade do modal
 * - onClose: função para fechar o modal
 * - agendamento: dados do agendamento para edição (opcional)
 */

interface RegistroAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento?: any; // Para futuras implementações de edição
}

export const RegistroAgendamentoModal = ({ 
  isOpen, 
  onClose, 
  agendamento 
}: RegistroAgendamentoModalProps) => {
  const [dataInicioPopoverOpen, setDataInicioPopoverOpen] = useState(false);
  const [dataFimPopoverOpen, setDataFimPopoverOpen] = useState(false);

  // Hooks para obter dados necessários
  const { data: leads = [] } = useLeads();
  const { clinicaAtiva } = useClinica();
  const { userProfile } = useAuthUser();

  // Configuração do formulário
  const form = useForm<AgendamentoFormData>({
    defaultValues: {
      cliente_id: agendamento?.cliente_id || '',
      titulo: agendamento?.titulo || '',
      data_inicio: agendamento?.data_inicio ? new Date(agendamento.data_inicio) : new Date(),
      data_fim: agendamento?.data_fim ? new Date(agendamento.data_fim) : new Date(),
      valor: agendamento?.valor || 0,
      status: agendamento?.status || 'AGENDADO',
      descricao: agendamento?.descricao || '',
      clinica_id: clinicaAtiva?.id || '',
      usuario_id: userProfile?.user_id || '',
    },
  });

  // Função para formatar data e hora para exibição
  const formatarDataHora = (data: Date) => {
    return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Função para lidar com salvamento do agendamento
  const handleSaveAgendamento = (dados: AgendamentoFormData) => {
    console.log('🔄 Dados do agendamento para salvar:', {
      ...dados,
      clinica_id: clinicaAtiva?.id,
      usuario_id: userProfile?.user_id,
      data_inicio_formatted: formatarDataHora(dados.data_inicio),
      data_fim_formatted: formatarDataHora(dados.data_fim),
    });

    // TODO: Implementar integração com Supabase na próxima etapa
    console.log('✅ Agendamento salvo com sucesso (simulado)');
    
    // Fechar modal após salvar
    onClose();
    form.reset();
  };

  // Função para lidar com cancelamento
  const handleCancel = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">
              {agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-6 w-6"
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveAgendamento)} className="space-y-6">
            {/* Seleção do Cliente/Lead */}
            <FormField
              control={form.control}
              name="cliente_id"
              rules={{ required: 'Selecione um cliente' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.nome} - {lead.telefone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Título do Agendamento */}
            <FormField
              control={form.control}
              name="titulo"
              rules={{ required: 'Título é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título/Serviço *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Consulta de rotina, Limpeza dental..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data e Hora de Início */}
            <FormField
              control={form.control}
              name="data_inicio"
              rules={{ required: 'Data de início é obrigatória' }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data e Hora de Início *</FormLabel>
                  <Popover open={dataInicioPopoverOpen} onOpenChange={setDataInicioPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatarDataHora(field.value)
                          ) : (
                            <span>Selecione data e hora</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Manter horário atual se já existir
                            const novaData = new Date(date);
                            if (field.value) {
                              novaData.setHours(field.value.getHours());
                              novaData.setMinutes(field.value.getMinutes());
                            }
                            field.onChange(novaData);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                      <div className="p-3 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <Input
                            type="time"
                            value={field.value ? format(field.value, 'HH:mm') : ''}
                            onChange={(e) => {
                              if (field.value && e.target.value) {
                                const [horas, minutos] = e.target.value.split(':');
                                const novaData = new Date(field.value);
                                novaData.setHours(parseInt(horas), parseInt(minutos));
                                field.onChange(novaData);
                              }
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data e Hora de Fim */}
            <FormField
              control={form.control}
              name="data_fim"
              rules={{ required: 'Data de fim é obrigatória' }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data e Hora de Fim *</FormLabel>
                  <Popover open={dataFimPopoverOpen} onOpenChange={setDataFimPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatarDataHora(field.value)
                          ) : (
                            <span>Selecione data e hora</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            const novaData = new Date(date);
                            if (field.value) {
                              novaData.setHours(field.value.getHours());
                              novaData.setMinutes(field.value.getMinutes());
                            }
                            field.onChange(novaData);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                      <div className="p-3 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <Input
                            type="time"
                            value={field.value ? format(field.value, 'HH:mm') : ''}
                            onChange={(e) => {
                              if (field.value && e.target.value) {
                                const [horas, minutos] = e.target.value.split(':');
                                const novaData = new Date(field.value);
                                novaData.setHours(parseInt(horas), parseInt(minutos));
                                field.onChange(novaData);
                              }
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grid para Valor e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valor */}
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                rules={{ required: 'Status é obrigatório' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGENDAMENTO_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição/Observações */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o agendamento..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {agendamento ? 'Atualizar' : 'Criar'} Agendamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
