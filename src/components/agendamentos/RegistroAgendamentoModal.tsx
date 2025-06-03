import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { AgendamentoFormData, AgendamentoStatus, AGENDAMENTO_STATUS_OPTIONS } from '@/constants/agendamentos';
import { agendamentoFormSchema } from '@/components/agendamentos/types';
import { useCreateAgendamento, useUpdateAgendamento, AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { ClienteSelector } from './ClienteSelector';
import { NovoClienteFields } from './NovoClienteFields';
import { ServicoSelector } from './ServicoSelector';

interface RegistroAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentoParaEditar?: AgendamentoFromDatabase | null;
}

export const RegistroAgendamentoModal: React.FC<RegistroAgendamentoModalProps> = ({
  isOpen,
  onClose,
  agendamentoParaEditar,
}) => {
  const { clinicaAtiva } = useClinica();
  const { userProfile, isLoading: isLoadingUser, error: userError, refetchUserProfile } = useAuthUser();
  const createAgendamentoMutation = useCreateAgendamento();
  const updateAgendamentoMutation = useUpdateAgendamento();

  const [isNovoCliente, setIsNovoCliente] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoFormSchema),
    defaultValues: {
      cliente_id: '',
      titulo: '',
      data_inicio: new Date(),
      hora_inicio: '',
      data_fim: new Date(),
      hora_fim: '',
      valor: 0,
      status: AgendamentoStatus.AGENDADO,
      descricao: '',
      clinica_id: clinicaAtiva?.id || '',
      usuario_id: userProfile?.id || '',
      novo_cliente_nome: '',
      novo_cliente_telefone: '',
    },
  });

  useEffect(() => {
    if (agendamentoParaEditar) {
      setDataInicio(new Date(agendamentoParaEditar.data_inicio));
      setDataFim(new Date(agendamentoParaEditar.data_fim));
      form.setValue('cliente_id', agendamentoParaEditar.cliente_id);
      form.setValue('titulo', agendamentoParaEditar.titulo);
      form.setValue('data_inicio', new Date(agendamentoParaEditar.data_inicio));
      form.setValue('hora_inicio', format(new Date(agendamentoParaEditar.data_inicio), 'HH:mm'));
      form.setValue('data_fim', new Date(agendamentoParaEditar.data_fim));
      form.setValue('hora_fim',  format(new Date(agendamentoParaEditar.data_fim), 'HH:mm'));
      form.setValue('valor', agendamentoParaEditar.valor || 0);
      form.setValue('status', agendamentoParaEditar.status as AgendamentoStatus);
      form.setValue('descricao', agendamentoParaEditar.descricao || '');
    } else {
      // Reseta os valores do formulário para o estado inicial
      form.reset({
        cliente_id: '',
        titulo: '',
        data_inicio: new Date(),
        hora_inicio: '08:00',
        data_fim: new Date(),
        hora_fim: '09:00',
        valor: 0,
        status: AgendamentoStatus.AGENDADO,
        descricao: '',
        clinica_id: clinicaAtiva?.id || '',
        usuario_id: userProfile?.id || '',
        novo_cliente_nome: '',
        novo_cliente_telefone: '',
      });
      setDataInicio(new Date());
      setDataFim(new Date());
    }
  }, [agendamentoParaEditar, form, clinicaAtiva?.id, userProfile?.id]);

  const isDateValid = (date: Date | undefined): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const validateTime = (date: Date | undefined, time: string): boolean => {
    if (!date) return false;
    const [hours, minutes] = time.split(':').map(Number);
    const selectedDate = new Date(date);
    selectedDate.setHours(hours, minutes, 0, 0);
    const now = new Date();

    if (selectedDate < now) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (data: AgendamentoFormData) => {
    console.log('🔄 [RegistroAgendamentoModal] Iniciando handleSubmit');
    console.log('📋 [RegistroAgendamentoModal] Dados do formulário:', data);
    console.log('🏥 [RegistroAgendamentoModal] Clínica ativa:', clinicaAtiva?.id);
    console.log('👤 [RegistroAgendamentoModal] User profile:', userProfile);

    // Validações críticas antes de prosseguir
    if (!clinicaAtiva?.id) {
      console.error('❌ [RegistroAgendamentoModal] ERRO: clinica_id está vazio');
      alert('Erro: Não foi possível identificar a clínica. Faça logout e login novamente.');
      return;
    }

    if (!userProfile?.id) {
      console.error('❌ [RegistroAgendamentoModal] ERRO: usuario_id está vazio');
      alert('Erro: Não foi possível identificar o usuário. Faça logout e login novamente.');
      return;
    }

    if (!data.cliente_id || data.cliente_id.trim() === '') {
      console.error('❌ [RegistroAgendamentoModal] ERRO: cliente_id está vazio');
      alert('Erro: Selecione um cliente válido.');
      return;
    }

    try {
      const agendamentoData = {
        cliente_id: data.cliente_id,
        clinica_id: clinicaAtiva.id,
        usuario_id: userProfile.id, // Corrigido: usar userProfile.id em vez de userProfile.nome
        titulo: data.titulo,
        data_inicio: combineDateAndTime(data.data_inicio, data.hora_inicio),
        data_fim: combineDateAndTime(data.data_fim, data.hora_fim),
        valor: data.valor || 0,
        status: data.status,
        descricao: data.descricao || '',
      };

      console.log('✅ [RegistroAgendamentoModal] Dados finais para envio:', agendamentoData);

      if (agendamentoParaEditar) {
        await updateAgendamentoMutation.mutateAsync({
          id: agendamentoParaEditar.id,
          ...agendamentoData,
        });
      } else {
        await createAgendamentoMutation.mutateAsync(agendamentoData);
      }

      onClose();
      form.reset();
    } catch (error) {
      console.error('❌ [RegistroAgendamentoModal] Erro ao salvar agendamento:', error);
    }
  };

  const combineDateAndTime = (date: Date, time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const combinedDate = new Date(date);
    combinedDate.setHours(hours, minutes, 0, 0);
    return combinedDate.toISOString();
  };

  // Mostrar erro de carregamento do usuário
  if (isLoadingUser) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-500">Carregando dados do usuário...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mostrar erro se não conseguir carregar o perfil do usuário
  if (userError || !userProfile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Erro de Autenticação</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar seus dados de usuário. Faça logout e login novamente.
              <br />
              <strong>Detalhes técnicos:</strong> {userError || 'Perfil de usuário não encontrado'}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={refetchUserProfile}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button onClick={onClose} variant="secondary">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agendamentoParaEditar ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Usuário logado:</strong> {userProfile.email || 'Email não disponível'} {/* Corrigido: usar userProfile.email */}
            <br />
            <strong>Clínica ativa:</strong> {clinicaAtiva?.nome || 'Não identificada'}
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <ClienteSelector
            isNovoCliente={isNovoCliente}
            setIsNovoCliente={setIsNovoCliente}
            form={form}
          />

          {isNovoCliente ? (
            <NovoClienteFields form={form} />
          ) : null}

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="titulo">Serviço</Label>
            <ServicoSelector form={form} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => {
                      setDataInicio(date);
                      form.setValue('data_inicio', date || new Date());
                    }}
                    disabled={(date) => !isDateValid(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="hora_inicio">Hora Início</Label>
              <Input
                type="time"
                id="hora_inicio"
                defaultValue={format(new Date(), 'HH:mm')}
                {...form.register('hora_inicio')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => {
                      setDataFim(date);
                      form.setValue('data_fim', date || new Date());
                    }}
                    disabled={(date) => !isDateValid(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="hora_fim">Hora Fim</Label>
              <Input
                type="time"
                id="hora_fim"
                defaultValue={format(new Date(), 'HH:mm')}
                {...form.register('hora_fim')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              type="number"
              id="valor"
              step="0.01"
              placeholder="0,00"
              {...form.register('valor', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={form.setValue.bind(null, 'status')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" defaultValue={AgendamentoStatus.AGENDADO} />
              </SelectTrigger>
              <SelectContent>
                {AGENDAMENTO_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Detalhes adicionais"
              {...form.register('descricao')}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createAgendamentoMutation.isPending || updateAgendamentoMutation.isPending}
            >
              {(createAgendamentoMutation.isPending || updateAgendamentoMutation.isPending) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {agendamentoParaEditar ? 'Atualizar' : 'Criar'} Agendamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
