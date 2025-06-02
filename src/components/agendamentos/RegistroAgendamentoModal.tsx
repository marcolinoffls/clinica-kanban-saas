import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon, Clock, X, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns'; // Removido setHours, setMinutes se não usados diretamente aqui
import { ptBR } from 'date-fns/locale';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useLeads } from '@/hooks/useLeadsData';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useClinicServices } from '@/hooks/useClinicServices';
import {
  useCreateAgendamento, useUpdateAgendamento, useDeleteAgendamento,
  CreateAgendamentoData, AgendamentoFromDatabase
} from '@/hooks/useAgendamentosData';
import { useClinicaOperations } from '@/hooks/useClinicaOperations';

import { AGENDAMENTO_STATUS_OPTIONS } from '@/constants/agendamentos';
import {
  AgendamentoFormData, AgendamentoStatus, agendamentoFormSchema, formatarDataParaISO
} from './types';

import { ClienteSelector } from './ClienteSelector';
import { NovoClienteFields } from './NovoClienteFields';
import { ServicoSelector } from './ServicoSelector';

interface RegistroAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentoParaEditar?: AgendamentoFromDatabase | null;
  leadPreSelecionadoId?: string | null;
}

export const RegistroAgendamentoModal = ({
  isOpen,
  onClose,
  agendamentoParaEditar,
  leadPreSelecionadoId,
}: RegistroAgendamentoModalProps) => {
  const [dataInicioPopoverOpen, setDataInicioPopoverOpen] = useState(false);
  const [dataFimPopoverOpen, setDataFimPopoverOpen] = useState(false);
  const [modoServico, setModoServico] = useState<'selecionar' | 'manual'>('selecionar');
  const [servicoSelecionadoIdHook, setServicoSelecionadoIdHook] = useState<string | null>(null);
  const [registrandoNovoCliente, setRegistrandoNovoCliente] = useState(false);
  const [clienteBuscaInput, setClienteBuscaInput] = useState('');

  const isEdicaoMode = !!agendamentoParaEditar;

  const { data: leadsData, isLoading: loadingLeads } = useLeads();
  const { services: servicosData, isLoading: loadingServices } = useClinicServices();
  const { clinicaAtiva } = useClinica();
  // Adicionado profileError e refreshProfile do useAuthUser
  const { userProfile, user, isAuthenticated, profileError, refreshProfile } = useAuthUser();

  // Variável para detectar problema crítico de autenticação/perfil
  const authCriticalProblem = isAuthenticated && !userProfile && !profileError;

  const leadsSeguro = Array.isArray(leadsData) ? leadsData : [];
  const servicosSeguro = Array.isArray(servicosData) ? servicosData : [];

  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoFormSchema),
    // Default values são cruciais e devem usar dados disponíveis de forma segura
    defaultValues: {
      cliente_id: '',
      titulo: '',
      data_inicio: new Date(),
      hora_inicio: format(new Date(), 'HH:mm'),
      data_fim: new Date(new Date().getTime() + 60 * 60 * 1000), // Default para 1h depois
      hora_fim: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm'),
      valor: 0,
      status: AgendamentoStatus.AGENDADO,
      descricao: '',
      clinica_id: '', // Será preenchido no useEffect ou onSubmit
      usuario_id: '', // Será preenchido no useEffect ou onSubmit
      novo_cliente_nome: '',
      novo_cliente_telefone: '',
    },
  });

  // Efeito para popular o formulário ao abrir ou quando dados relevantes mudam
  useEffect(() => {
    if (!isOpen) {
        // Resetar o formulário para o estado inicial quando o modal é fechado
        form.reset({
            cliente_id: '',
            titulo: '',
            data_inicio: new Date(),
            hora_inicio: format(new Date(), 'HH:mm'),
            data_fim: new Date(new Date().getTime() + 60 * 60 * 1000),
            hora_fim: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm'),
            valor: 0,
            status: AgendamentoStatus.AGENDADO,
            descricao: '',
            clinica_id: clinicaAtiva?.id || '',
            usuario_id: userProfile?.user_id || user?.id || '',
            novo_cliente_nome: '',
            novo_cliente_telefone: '',
        });
        setModoServico('selecionar');
        setServicoSelecionadoIdHook(null);
        setRegistrandoNovoCliente(false);
        setClienteBuscaInput('');
        return;
    }

    // Preencher dados para edição
    if (agendamentoParaEditar) {
      const dataInicio = new Date(agendamentoParaEditar.data_inicio);
      const dataFim = new Date(agendamentoParaEditar.data_fim);
      form.reset({
        cliente_id: agendamentoParaEditar.cliente_id || '',
        titulo: agendamentoParaEditar.titulo || '',
        data_inicio: dataInicio,
        hora_inicio: format(dataInicio, 'HH:mm'),
        data_fim: dataFim,
        hora_fim: format(dataFim, 'HH:mm'),
        valor: agendamentoParaEditar.valor || 0,
        status: (agendamentoParaEditar.status as AgendamentoStatus) || AgendamentoStatus.AGENDADO,
        descricao: agendamentoParaEditar.descricao || '',
        clinica_id: agendamentoParaEditar.clinica_id,
        usuario_id: agendamentoParaEditar.usuario_id,
      });
      const servicoOriginal = servicosSeguro.find(s => s.nome_servico === agendamentoParaEditar.titulo);
      if (servicoOriginal) {
        setModoServico('selecionar');
        setServicoSelecionadoIdHook(servicoOriginal.id);
      } else {
        setModoServico('manual');
      }
      const clienteDoAgendamento = leadsSeguro.find(l => l.id === agendamentoParaEditar.cliente_id);
      if (clienteDoAgendamento) setClienteBuscaInput(clienteDoAgendamento.nome);

    } else { // Modo de criação
        form.reset({
            cliente_id: leadPreSelecionadoId || '',
            titulo: '',
            data_inicio: new Date(),
            hora_inicio: format(new Date(), 'HH:mm'),
            data_fim: new Date(new Date().getTime() + 60 * 60 * 1000),
            hora_fim: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm'),
            valor: 0,
            status: AgendamentoStatus.AGENDADO,
            descricao: '',
            clinica_id: clinicaAtiva?.id || '',
            usuario_id: userProfile?.user_id || user?.id || '', // Garante que usuario_id seja preenchido
            novo_cliente_nome: '',
            novo_cliente_telefone: '',
        });
        if (leadPreSelecionadoId) {
            const clientePre = leadsSeguro.find(l => l.id === leadPreSelecionadoId);
            if (clientePre) setClienteBuscaInput(clientePre.nome);
        } else {
            setClienteBuscaInput('');
        }
    }
  }, [isOpen, agendamentoParaEditar, leadPreSelecionadoId, form, clinicaAtiva, userProfile, user, leadsSeguro, servicosSeguro]);


  const createAgendamentoMutation = useCreateAgendamento();
  const updateAgendamentoMutation = useUpdateAgendamento();
  const deleteAgendamentoMutation = useDeleteAgendamento();
  const { createLead, isCreatingLead } = useClinicaOperations();

  const combinarDataHora = (data: Date, horaString: string): Date => {
    const [horas, minutos] = horaString.split(':').map(Number);
    const novaData = new Date(data.getFullYear(), data.getMonth(), data.getDate(), horas, minutos, 0, 0);
    return novaData;
  };

  const onSubmit = async (formDataValues: AgendamentoFormData) => {
    // Validação crítica 1: Autenticação e Perfil do Usuário
    if (!isAuthenticated || !user?.id) {
      toast.error("Você precisa estar logado para criar agendamentos.");
      console.error("[ModalAgendamento] Tentativa de submissão sem usuário autenticado.");
      return;
    }
    if (!userProfile?.user_id) {
        toast.error("Perfil do usuário não carregado. Tente novamente ou faça login.");
        console.error("[ModalAgendamento] Tentativa de submissão sem perfil de usuário carregado (userProfile).");
        // Sugerir ao usuário recarregar ou logar novamente se isso persistir
        return;
    }
    // Garante que o ID do usuário do Supabase Auth seja usado
    const finalUsuarioId = user.id;

    // Validação crítica 2: Clínica Ativa
    if (!clinicaAtiva?.id) {
      toast.error("Erro de configuração: Clínica não identificada.");
      console.error("[ModalAgendamento] Tentativa de submissão sem clínica ativa.");
      return;
    }
    const finalClinicaId = clinicaAtiva.id;

    let finalClienteId = formDataValues.cliente_id;

    if (registrandoNovoCliente) {
      if (!formDataValues.novo_cliente_nome?.trim() || !formDataValues.novo_cliente_telefone?.trim()) {
        form.setError("novo_cliente_nome", { type: "manual", message: "Nome é obrigatório para novo cliente." });
        form.setError("novo_cliente_telefone", { type: "manual", message: "Telefone é obrigatório." });
        toast.error("Nome e telefone são obrigatórios para cadastrar um novo cliente.");
        return;
      }
      try {
        const novoLead = await createLead({
          nome: formDataValues.novo_cliente_nome,
          telefone: formDataValues.novo_cliente_telefone,
          // clinica_id é adicionado automaticamente pelo hook useClinicaOperations
        });
        finalClienteId = novoLead.id;
      } catch (error: any) {
        toast.error(`Falha ao criar novo cliente: ${error.message}`);
        console.error('[ModalAgendamento] Erro ao criar novo lead:', error.message);
        return;
      }
    }

    if (!finalClienteId) {
      form.setError("cliente_id", { type: "manual", message: "Cliente é obrigatório." });
      toast.error("Por favor, selecione um cliente ou cadastre um novo.");
      return;
    }

    const dataInicioFinal = combinarDataHora(formDataValues.data_inicio, formDataValues.hora_inicio);
    const dataFimFinal = combinarDataHora(formDataValues.data_fim, formDataValues.hora_fim);

    if (dataFimFinal <= dataInicioFinal) {
      form.setError("data_fim", { type: "manual", message: "Data/hora de fim deve ser posterior à de início." });
      form.setError("hora_fim", { type: "manual", message: " " }); // Para acionar o erro visual no campo
      toast.error("Data ou hora de fim inválida. Verifique se é posterior ao início.");
      return;
    }

    const agendamentoPayload = {
      ...(isEdicaoMode && agendamentoParaEditar && { id: agendamentoParaEditar.id }),
      cliente_id: finalClienteId,
      clinica_id: finalClinicaId,
      usuario_id: finalUsuarioId, // ID do usuário autenticado que está criando/editando
      titulo: modoServico === 'manual' ? formDataValues.titulo : (servicosSeguro.find(s => s.id === servicoSelecionadoIdHook)?.nome_servico || formDataValues.titulo),
      data_inicio: formatarDataParaISO(dataInicioFinal),
      data_fim: formatarDataParaISO(dataFimFinal),
      valor: formDataValues.valor ? Number(formDataValues.valor) : 0,
      status: formDataValues.status,
      descricao: formDataValues.descricao || null,
    };

    try {
      if (isEdicaoMode) {
        await updateAgendamentoMutation.mutateAsync(agendamentoPayload as Partial<AgendamentoFromDatabase> & { id: string });
      } else {
        await createAgendamentoMutation.mutateAsync(agendamentoPayload as CreateAgendamentoData);
      }
      handleCloseModal(); // Fecha o modal em sucesso
    } catch (error: any) {
      // O toast de erro já é tratado dentro das mutações
      console.error('[ModalAgendamento] Erro ao salvar agendamento via mutação:', error.message);
    }
  };

  const handleCloseModal = () => {
    // Resetar o formulário para os valores iniciais seguros
    form.reset({
        cliente_id: leadPreSelecionadoId || '',
        titulo: '',
        data_inicio: new Date(),
        hora_inicio: format(new Date(), 'HH:mm'),
        data_fim: new Date(new Date().getTime() + 60 * 60 * 1000),
        hora_fim: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm'),
        valor: 0,
        status: AgendamentoStatus.AGENDADO,
        descricao: '',
        clinica_id: clinicaAtiva?.id || '',
        usuario_id: userProfile?.user_id || user?.id || '',
        novo_cliente_nome: '',
        novo_cliente_telefone: '',
    });
    setModoServico('selecionar');
    setServicoSelecionadoIdHook(null);
    setRegistrandoNovoCliente(false);
    // Restaurar o input de busca do cliente se houver um lead pré-selecionado
    if(leadPreSelecionadoId && leadsSeguro.length > 0) {
        const clientePre = leadsSeguro.find(l => l.id === leadPreSelecionadoId);
        setClienteBuscaInput(clientePre?.nome || '');
    } else {
        setClienteBuscaInput('');
    }
    setDataInicioPopoverOpen(false);
    setDataFimPopoverOpen(false);
    onClose();
    // console.log('[ModalAgendamento] Modal fechado e formulário resetado.');
  };

  const handleDelete = async () => {
    if (!agendamentoParaEditar?.id) return;
    // console.log(`[ModalAgendamento] Solicitando exclusão do agendamento ID: ${agendamentoParaEditar.id}`);
    try {
      await deleteAgendamentoMutation.mutateAsync(agendamentoParaEditar.id);
      handleCloseModal();
    } catch (error: any) {
      console.error(`[ModalAgendamento] Erro ao excluir agendamento ID ${agendamentoParaEditar.id}:`, error.message);
    }
  };

  const isLoadingMutation = createAgendamentoMutation.isPending || updateAgendamentoMutation.isPending || deleteAgendamentoMutation.isPending || isCreatingLead;

  if (loadingLeads && !isOpen) { // Não mostrar loading se modal estiver fechado
    return null;
  }
  if (loadingLeads && isOpen && leadsSeguro.length === 0 && !agendamentoParaEditar) { // Mostrar loading apenas se estiver aberto e criando novo
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Carregando dados...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">
              {isEdicaoMode ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <div className="flex items-center gap-1">
              {isEdicaoMode && agendamentoParaEditar && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                      disabled={isLoadingMutation} aria-label="Excluir agendamento"
                    > <Trash2 size={16} /> </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isLoadingMutation}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete} disabled={isLoadingMutation}
                        className="bg-red-600 hover:bg-red-700"
                      > {deleteAgendamentoMutation.isPending ? 'Excluindo...' : 'Excluir'} </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseModal} aria-label="Fechar modal">
                  <X size={18} />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 pl-0.5 py-1">
          {/* Alerta para problemas de autenticação / perfil de usuário */}
          {authCriticalProblem && (
            <Alert variant="destructive" className="mb-4 border-amber-300 bg-amber-50 text-amber-900">
              <AlertCircle className="h-4 w-4 !text-amber-600" /> {/* Força a cor do ícone */}
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Perfil de usuário não encontrado. Ações podem falhar.</span>
                  <Button
                    variant="outline" size="sm" onClick={refreshProfile}
                    className="ml-2 h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-100"
                  > <RefreshCw size={14} className="mr-1" /> Tentar Novamente </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {profileError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar perfil do usuário: {profileError.message}.
                Algumas funcionalidades podem não operar corretamente.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <ClienteSelector
                form={form} leads={leadsSeguro} loadingLeads={loadingLeads}
                registrandoNovoCliente={registrandoNovoCliente} setRegistrandoNovoCliente={setRegistrandoNovoCliente}
                clienteBuscaInput={clienteBuscaInput} setClienteBuscaInput={setClienteBuscaInput}
              />
              {registrandoNovoCliente && (
                <NovoClienteFields
                  form={form} setRegistrandoNovoCliente={setRegistrandoNovoCliente}
                  setClienteBuscaInput={setClienteBuscaInput} leads={leadsSeguro}
                />
              )}
              <ServicoSelector
                form={form} servicos={servicosSeguro} loadingServices={loadingServices}
                modoServico={modoServico} setModoServico={setModoServico}
                servicoSelecionadoId={servicoSelecionadoIdHook} setServicoSelecionadoId={setServicoSelecionadoIdHook}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="data_inicio" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início *</FormLabel>
                    <Popover open={dataInicioPopoverOpen} onOpenChange={setDataInicioPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hora_inicio" render={({ field }) => (
                  <FormItem> <FormLabel>Hora Início *</FormLabel> <FormControl> <Input type="time" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="data_fim" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim *</FormLabel>
                    <Popover open={dataFimPopoverOpen} onOpenChange={setDataFimPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => form.getValues("data_inicio") ? date < form.getValues("data_inicio") : false} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hora_fim" render={({ field }) => (
                  <FormItem> <FormLabel>Hora Fim *</FormLabel> <FormControl> <Input type="time" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="valor" render={({ field }) => (
                  <FormItem> <FormLabel>Valor (R$)</FormLabel> <FormControl> <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /> </FormControl> <FormMessage /> </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl> <SelectTrigger> <SelectValue placeholder="Selecione um status" /> </SelectTrigger> </FormControl>
                      <SelectContent>
                        {AGENDAMENTO_STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem> <FormLabel>Observações</FormLabel> <FormControl> <Textarea placeholder="Detalhes adicionais sobre o agendamento..." {...field} /> </FormControl> <FormMessage /> </FormItem>
              )} />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isLoadingMutation}> Cancelar </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoadingMutation || authCriticalProblem || !!profileError}>
                  {isLoadingMutation ? 'Salvando...' : (isEdicaoMode ? 'Salvar Alterações' : 'Criar Agendamento')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};