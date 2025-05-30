import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar as CalendarIcon, Clock, X, ChevronDown, Check, Trash2, UserPlus, ListPlus, Edit3 } from 'lucide-react';
import { format, parse, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter, // Importado para o rodapé
  DialogDescription, // Importado para descrições
  DialogClose, // Importado para botão de fechar explícito se necessário
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList, // Importar CommandList para rolagem se necessário
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner'; // Usando sonner para toasts

// Hooks de dados
import { useLeads, Lead } from '@/hooks/useLeadsData'; // Assumindo que Lead é exportado
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useClinicServices, ClinicaServico } from '@/hooks/useClinicServices'; // Assumindo que ClinicaServico é exportado
import {
  useCreateAgendamento,
  useUpdateAgendamento,
  useDeleteAgendamento,
  CreateAgendamentoData,
  AgendamentoFromDatabase // Este tipo deve ser definido em useAgendamentosData.ts
} from '@/hooks/useAgendamentosData'; // Criar este hook na Etapa 2
import { useClinicaOperations } from '@/hooks/useClinicaOperations';

// Constantes e Tipos
import { AGENDAMENTO_STATUS_OPTIONS, AgendamentoStatus } from '@/constants/agendamentos'; // Criar este arquivo

// Schema de validação com Zod
const agendamentoFormSchema = z.object({
  cliente_id: z.string().min(1, { message: "Selecione um cliente ou cadastre um novo." }),
  // O título pode ser opcional se um serviço for selecionado, mas obrigatório se manual
  titulo: z.string().min(1, { message: "Título ou serviço é obrigatório." }),
  data_inicio: z.date({ required_error: "Data de início é obrigatória." }),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Hora de início inválida." }),
  data_fim: z.date({ required_error: "Data de fim é obrigatória." }),
  hora_fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Hora de fim inválida." }),
  valor: z.number().min(0, { message: "Valor não pode ser negativo." }).optional(),
  status: z.nativeEnum(AgendamentoStatus, { required_error: "Status é obrigatório." }),
  descricao: z.string().optional(),
  // Campos não visíveis, mas parte do data object
  clinica_id: z.string(),
  usuario_id: z.string(),
  // Campos condicionais para novo cliente
  novo_cliente_nome: z.string().optional(),
  novo_cliente_telefone: z.string().optional(),
}).refine(data => data.data_fim >= data.data_inicio, {
  message: "Data/hora de fim deve ser após a data/hora de início.",
  path: ["data_fim"], // ou path: ["hora_fim"] se quiser focar no tempo
});

// Tipagem para os dados do formulário
export type AgendamentoFormData = z.infer<typeof agendamentoFormSchema>;

interface RegistroAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentoParaEditar?: AgendamentoFromDatabase | null; // Tipo vindo do hook
  leadPreSelecionadoId?: string | null;
}

export const RegistroAgendamentoModal = ({
  isOpen,
  onClose,
  agendamentoParaEditar,
  leadPreSelecionadoId,
}: RegistroAgendamentoModalProps) => {
  console.log('[ModalAgendamento] Props recebidas:', { isOpen, agendamentoParaEditar, leadPreSelecionadoId });

  // Estados para controles de UI
  const [dataInicioPopoverOpen, setDataInicioPopoverOpen] = useState(false);
  const [dataFimPopoverOpen, setDataFimPopoverOpen] = useState(false);
  const [clienteComboboxOpen, setClienteComboboxOpen] = useState(false);

  // Estados para modo de serviço (selecionar da lista ou manual)
  const [modoServico, setModoServico] = useState<'selecionar' | 'manual'>('selecionar');
  const [servicoSelecionadoIdHook, setServicoSelecionadoIdHook] = useState<string | null>(null); // Para o Select de serviço

  // Estados para criação de novo cliente
  const [registrandoNovoCliente, setRegistrandoNovoCliente] = useState(false);
  // novoClienteNome e novoClienteTelefone serão gerenciados pelo react-hook-form agora

  // Estado para o input de busca do Combobox de cliente
  const [clienteBuscaInput, setClienteBuscaInput] = useState('');

  // Determinar se estamos em modo de edição
  const isEdicaoMode = !!agendamentoParaEditar;

  // Hooks para obter dados necessários
  const { data: leadsData, isLoading: loadingLeads } = useLeads();
  const { services: servicosData, isLoading: loadingServices } = useClinicServices();
  const { clinicaAtiva } = useClinica(); // Usar clinicaAtiva para clinica_id
  const { userProfile } = useAuthUser();

  // Garantir que os dados sejam sempre arrays válidos para iteração
  // Esta é a correção crucial para o erro "undefined is not iterable"
  const leadsSeguro = Array.isArray(leadsData) ? leadsData : [];
  const servicosSeguro = Array.isArray(servicosData) ? servicosData : [];

  console.log('[ModalAgendamento] Estado dos dados:', {
    leadsData, // O que vem do hook
    leadsSeguro, // O que será usado no map
    loadingLeads,
    servicosData,
    servicosSeguro,
    loadingServices,
    clinicaId: clinicaAtiva?.id,
    userId: userProfile?.user_id
  });

  // Configuração do formulário com react-hook-form e Zod
  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoFormSchema),
    defaultValues: {
      cliente_id: leadPreSelecionadoId || '',
      titulo: '',
      data_inicio: new Date(),
      hora_inicio: format(new Date(), 'HH:mm'),
      data_fim: new Date(),
      hora_fim: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm'), // Default 1 hora depois
      valor: 0,
      status: AgendamentoStatus.AGENDADO,
      descricao: '',
      clinica_id: clinicaAtiva?.id || '',
      usuario_id: userProfile?.user_id || '',
      novo_cliente_nome: '',
      novo_cliente_telefone: '',
    },
  });

  // Preencher formulário quando estiver em modo de edição ou com lead pré-selecionado
  useEffect(() => {
    console.log('[ModalAgendamento] useEffect de Edição/Pré-seleção. isOpen:', isOpen, 'agendamentoParaEditar:', agendamentoParaEditar, 'leadPreSelecionadoId:', leadPreSelecionadoId);
    if (!isOpen) {
        // Resetar o formulário e estados quando o modal fecha
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
            usuario_id: userProfile?.user_id || '',
            novo_cliente_nome: '',
            novo_cliente_telefone: '',
        });
        setModoServico('selecionar');
        setServicoSelecionadoIdHook(null);
        setRegistrandoNovoCliente(false);
        setClienteBuscaInput('');
        return;
    }

    if (agendamentoParaEditar) {
      console.log('[ModalAgendamento] Modo Edição - Preenchendo formulário com:', agendamentoParaEditar);
      const dataInicio = new Date(agendamentoParaEditar.data_inicio);
      const dataFim = new Date(agendamentoParaEditar.data_fim);

      form.reset({
        cliente_id: agendamentoParaEditar.cliente_id || '',
        titulo: agendamentoParaEditar.titulo || '', // Será sobrescrito se um serviço for encontrado
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

      // Tentar encontrar o serviço correspondente ao título para pré-selecionar
      const servicoOriginal = servicosSeguro.find(s => s.nome_servico === agendamentoParaEditar.titulo);
      if (servicoOriginal) {
        setModoServico('selecionar');
        setServicoSelecionadoIdHook(servicoOriginal.id);
        form.setValue('titulo', servicoOriginal.nome_servico); // Garante que o título do form é o do serviço
      } else {
        setModoServico('manual'); // Se não achar, assume que foi título manual
        form.setValue('titulo', agendamentoParaEditar.titulo || '');
      }
      
      // Preencher busca de cliente para exibição no ComboboxTrigger
      const clienteDoAgendamento = leadsSeguro.find(l => l.id === agendamentoParaEditar.cliente_id);
      if (clienteDoAgendamento) {
        setClienteBuscaInput(clienteDoAgendamento.nome);
      }


    } else if (leadPreSelecionadoId) {
        console.log('[ModalAgendamento] Pré-selecionando lead ID:', leadPreSelecionadoId);
        form.setValue('cliente_id', leadPreSelecionadoId);
        const clientePre = leadsSeguro.find(l => l.id === leadPreSelecionadoId);
        if (clientePre) {
            setClienteBuscaInput(clientePre.nome); // Atualiza o texto exibido no ComboboxTrigger
        }
    } else {
        // Modo de criação sem pré-seleção, resetar para defaults
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
            usuario_id: userProfile?.user_id || '',
            novo_cliente_nome: '',
            novo_cliente_telefone: '',
        });
        setClienteBuscaInput('');
    }
  }, [agendamentoParaEditar, isOpen, form, leadPreSelecionadoId, clinicaAtiva, userProfile, leadsSeguro, servicosSeguro]);


  // Hooks de mutação do Supabase
  const createAgendamentoMutation = useCreateAgendamento();
  const updateAgendamentoMutation = useUpdateAgendamento();
  const deleteAgendamentoMutation = useDeleteAgendamento();
  const { createLead, isCreatingLead } = useClinicaOperations(); // Usar estado de loading daqui


  // Função para combinar data (do DatePicker) e hora (do input type="time") em um objeto Date
  const combinarDataHora = (data: Date, horaString: string): Date => {
    const [horas, minutos] = horaString.split(':').map(Number);
    const novaData = new Date(data);
    novaData.setHours(horas, minutos, 0, 0); // Zera segundos e milissegundos
    return novaData;
  };

  // Função para lidar com seleção de serviço no Select
  const handleServicoChange = (servicoIdValue: string) => {
    const servico = servicosSeguro.find(s => s.id === servicoIdValue);
    if (servico) {
      setServicoSelecionadoIdHook(servicoIdValue);
      form.setValue('titulo', servico.nome_servico, { shouldValidate: true });
      // Poderia pré-preencher o valor aqui se o serviço tivesse preço
      // form.setValue('valor', servico.preco || 0);
      console.log(`[ModalAgendamento] Serviço selecionado: ${servico.nome_servico}, ID: ${servicoIdValue}`);
    } else {
      // Caso o valor seja 'outro' ou inválido, limpar
      setServicoSelecionadoIdHook(null);
      if(modoServico === 'selecionar') form.setValue('titulo', '', { shouldValidate: true }); // Limpa o título se estava no modo selecionar e não achou
    }
  };

  // Função para lidar com seleção de cliente no Combobox
  const handleClienteSelect = useCallback((value: string) => {
    // 'value' aqui será o que foi definido no `value` do `CommandItem`, ex: lead.id ou "novo_cliente_dynamic"
    const leadSelecionado = leadsSeguro.find(l => l.id === value);

    if (leadSelecionado) {
      form.setValue('cliente_id', leadSelecionado.id, { shouldValidate: true });
      form.clearErrors('cliente_id'); // Limpa erro de cliente_id se houver
      setClienteBuscaInput(leadSelecionado.nome); // Atualiza o texto do input de busca/display do Combobox
      setRegistrandoNovoCliente(false);
      form.setValue('novo_cliente_nome', ''); // Limpa campos de novo cliente
      form.setValue('novo_cliente_telefone', '');
      console.log(`[ModalAgendamento] Cliente existente selecionado: ${leadSelecionado.nome}, ID: ${leadSelecionado.id}`);
    } else if (value.startsWith('criar_novo_cliente:')) {
      const nomeDigitado = value.substring('criar_novo_cliente:'.length);
      setRegistrandoNovoCliente(true);
      form.setValue('cliente_id', ''); // Limpa cliente_id pois será um novo
      form.setValue('novo_cliente_nome', nomeDigitado); // Pré-preenche nome
      setClienteBuscaInput(nomeDigitado); // Atualiza input de busca
      console.log(`[ModalAgendamento] Iniciando cadastro de novo cliente com nome: ${nomeDigitado}`);
    }
    setClienteComboboxOpen(false); // Fecha o popover do combobox
  }, [form, leadsSeguro]);


  // Função principal de salvamento (onSubmit do react-hook-form)
  const onSubmit = async (data: AgendamentoFormData) => {
    console.log('[ModalAgendamento] Tentando salvar. Dados do formulário:', data);
    if (!clinicaAtiva?.id || !userProfile?.user_id) {
      toast.error("Erro de configuração: ID da clínica ou do usuário não encontrado.");
      console.error("[ModalAgendamento] ERRO: clinicaId ou userId ausentes.", { clinicaId: clinicaAtiva?.id, userId: userProfile?.user_id });
      return;
    }

    let cliente_id_final = data.cliente_id;

    if (registrandoNovoCliente) {
      if (!data.novo_cliente_nome?.trim() || !data.novo_cliente_telefone?.trim()) {
        form.setError("novo_cliente_nome", { type: "manual", message: "Nome é obrigatório para novo cliente."});
        form.setError("novo_cliente_telefone", { type: "manual", message: "Telefone é obrigatório para novo cliente."});
        toast.error("Nome e telefone são obrigatórios para cadastrar um novo cliente.");
        console.warn("[ModalAgendamento] Validação falhou: Nome ou telefone do novo cliente ausente.");
        return;
      }
      try {
        console.log('[ModalAgendamento] Criando novo lead:', { nome: data.novo_cliente_nome, telefone: data.novo_cliente_telefone });
        const novoLead = await createLead({ // createLead já deve incluir clinica_id
          nome: data.novo_cliente_nome,
          telefone: data.novo_cliente_telefone,
        });
        cliente_id_final = novoLead.id;
        console.log('[ModalAgendamento] Novo lead criado com ID:', cliente_id_final);
      } catch (error) {
        toast.error("Falha ao criar novo cliente.");
        console.error('[ModalAgendamento] Erro ao criar novo lead:', error);
        return;
      }
    }

    if (!cliente_id_final && !registrandoNovoCliente) {
        // Isso pode acontecer se o usuário limpou o campo e não selecionou "novo cliente"
        form.setError("cliente_id", { type: "manual", message: "Cliente é obrigatório."});
        toast.error("Por favor, selecione um cliente ou cadastre um novo.");
        console.warn("[ModalAgendamento] Validação falhou: cliente_id_final está vazio e não está registrando novo cliente.");
        return;
    }


    const dataInicioFinal = combinarDataHora(data.data_inicio, data.hora_inicio);
    const dataFimFinal = combinarDataHora(data.data_fim, data.hora_fim);

    if (dataFimFinal <= dataInicioFinal) {
      form.setError("data_fim", { type: "manual", message: "Data/hora de fim deve ser posterior à de início."});
      form.setError("hora_fim", { type: "manual", message: " "}); // Para destacar o campo de hora também
      toast.error("Data ou hora de fim inválida.");
      console.warn("[ModalAgendamento] Validação falhou: Data/hora de fim não é posterior à de início.");
      return;
    }

    const agendamentoPayload: CreateAgendamentoData | (Partial<AgendamentoFromDatabase> & { id: string }) = {
      ...(isEdicaoMode && agendamentoParaEditar && { id: agendamentoParaEditar.id }), // ID para edição
      cliente_id: cliente_id_final,
      clinica_id: clinicaAtiva.id,
      usuario_id: userProfile.user_id,
      titulo: modoServico === 'manual' ? data.titulo : (servicosSeguro.find(s => s.id === servicoSelecionadoIdHook)?.nome_servico || data.titulo),
      data_inicio: formatarDataParaISO(dataInicioFinal),
      data_fim: formatarDataParaISO(dataFimFinal),
      valor: data.valor ? Number(data.valor) : 0,
      status: data.status,
      descricao: data.descricao || null,
    };
    console.log('[ModalAgendamento] Payload final para Supabase:', agendamentoPayload);

    try {
      if (isEdicaoMode) {
        await updateAgendamentoMutation.mutateAsync(agendamentoPayload as Partial<AgendamentoFromDatabase> & { id: string });
      } else {
        await createAgendamentoMutation.mutateAsync(agendamentoPayload as CreateAgendamentoData);
      }
      handleCloseModal(); // Chama a função que reseta e fecha
    } catch (error) {
      // O toast de erro já é tratado dentro das mutações
      console.error('[ModalAgendamento] Erro na mutação de salvar/atualizar agendamento:', error);
    }
  };

  const handleCloseModal = () => {
    form.reset({ // Reseta para os valores default definidos no useForm
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
        usuario_id: userProfile?.user_id || '',
        novo_cliente_nome: '',
        novo_cliente_telefone: '',
    });
    setModoServico('selecionar');
    setServicoSelecionadoIdHook(null);
    setRegistrandoNovoCliente(false);
    setClienteBuscaInput(leadPreSelecionadoId && leadsSeguro.find(l=>l.id === leadPreSelecionadoId)?.nome || '');
    setDataInicioPopoverOpen(false);
    setDataFimPopoverOpen(false);
    setClienteComboboxOpen(false);
    onClose(); // Chama a prop onClose para fechar o Dialog
    console.log('[ModalAgendamento] Modal fechado e formulário resetado.');
  };


  const handleDelete = async () => {
    if (!agendamentoParaEditar?.id) return;
    console.log(`[ModalAgendamento] Solicitando exclusão do agendamento ID: ${agendamentoParaEditar.id}`);
    try {
      await deleteAgendamentoMutation.mutateAsync(agendamentoParaEditar.id);
      handleCloseModal();
    } catch (error) {
        // toast de erro já é tratado na mutação
        console.error(`[ModalAgendamento] Erro ao excluir agendamento ID: ${agendamentoParaEditar.id}`, error);
    }
  };
  
  const isLoadingMutation = createAgendamentoMutation.isPending || updateAgendamentoMutation.isPending || deleteAgendamentoMutation.isPending || isCreatingLead;

  // Filtrar leads para o Combobox baseado no input de busca
  const leadsFiltradosParaCombobox = clienteBuscaInput
    ? leadsSeguro.filter(lead =>
        lead.nome.toLowerCase().includes(clienteBuscaInput.toLowerCase()) ||
        lead.telefone?.includes(clienteBuscaInput)
      )
    : leadsSeguro;


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
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                      disabled={isLoadingMutation}
                      aria-label="Excluir agendamento"
                    >
                      <Trash2 size={16} />
                    </Button>
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
                        onClick={handleDelete}
                        disabled={isLoadingMutation}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleteAgendamentoMutation.isPending ? 'Excluindo...' : 'Excluir'}
                      </AlertDialogAction>
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

        <div className="flex-grow overflow-y-auto pr-2 pl-0.5 py-1"> {/* Adicionado padding e scroll */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* SELEÇÃO DE CLIENTE (COMBOBOX) */}
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Cliente *</FormLabel>
                    <Popover open={clienteComboboxOpen} onOpenChange={setClienteComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={clienteComboboxOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && !registrandoNovoCliente && "text-muted-foreground"
                            )}
                            disabled={loadingLeads}
                          >
                            {registrandoNovoCliente
                              ? `Registrando: ${form.getValues("novo_cliente_nome") || clienteBuscaInput || 'Novo Cliente...'}`
                              : field.value
                              ? leadsSeguro.find(lead => lead.id === field.value)?.nome || clienteBuscaInput || "Selecione..."
                              : clienteBuscaInput || "Selecione um cliente..."
                            }
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto p-0">
                        <Command shouldFilter={false}> {/* Desabilitar filtro interno se já filtramos com clienteBuscaInput */}
                          <CommandInput
                            placeholder="Buscar cliente por nome ou telefone..."
                            value={clienteBuscaInput}
                            onValueChange={(search) => {
                                setClienteBuscaInput(search);
                                // Se o usuário limpar a busca e estava registrando novo cliente, resetar
                                if (!search && registrandoNovoCliente) {
                                    setRegistrandoNovoCliente(false);
                                    form.setValue('novo_cliente_nome', '');
                                }
                            }}
                          />
                          <CommandList>
                            {loadingLeads && <div className="p-2 text-sm text-center">Carregando...</div>}
                            <CommandEmpty>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm p-2"
                                    onClick={() => handleClienteSelect(`criar_novo_cliente:${clienteBuscaInput}`)}
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Criar novo cliente: "{clienteBuscaInput || 'Digite o nome'}"
                                </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {/* Aplicar o fallback aqui */}
                              {(leadsFiltradosParaCombobox || []).map((lead) => (
                                <CommandItem
                                  key={lead.id}
                                  value={lead.id} // Usar ID para o valor real
                                  onSelect={() => {
                                    console.log(`[ModalAgendamento] CMD Item onSelect, lead.id: ${lead.id}`)
                                    handleClienteSelect(lead.id);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === lead.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {lead.nome} {lead.telefone && `- ${lead.telefone}`}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CAMPOS PARA NOVO CLIENTE (CONDICIONAL) */}
              {registrandoNovoCliente && (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50 my-4">
                  <h4 className="font-medium text-gray-800 text-sm">Detalhes do Novo Cliente</h4>
                  <FormField
                    control={form.control}
                    name="novo_cliente_nome"
                    rules={{ required: registrandoNovoCliente ? 'Nome do novo cliente é obrigatório.' : false }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo do novo cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="novo_cliente_telefone"
                    rules={{ required: registrandoNovoCliente ? 'Telefone do novo cliente é obrigatório.' : false }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs text-red-600"
                        onClick={() => {
                            setRegistrandoNovoCliente(false);
                            form.setValue('novo_cliente_nome', '');
                            form.setValue('novo_cliente_telefone', '');
                            setClienteBuscaInput(form.getValues('cliente_id') ? leadsSeguro.find(l => l.id === form.getValues('cliente_id'))?.nome || '' : '');
                        }}
                    >
                        Cancelar Novo Cliente
                    </Button>
                </div>
              )}

              {/* CAMPO TÍTULO/SERVIÇO */}
              <FormField
                control={form.control}
                name="titulo"
                rules={{ required: "Título ou serviço é obrigatório."}}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título/Serviço *</FormLabel>
                    {modoServico === 'selecionar' ? (
                      <>
                        <Select
                          onValueChange={(value) => {
                            handleServicoChange(value); // Isso vai setar field.onChange para 'titulo'
                          }}
                          value={servicoSelecionadoIdHook || ""} // Controlado pelo estado local
                          disabled={loadingServices}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um serviço..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingServices && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                            {(servicosSeguro || []).map((servico) => (
                              <SelectItem key={servico.id} value={servico.id}>
                                {servico.nome_servico}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => {setModoServico('manual'); form.setValue('titulo', ''); setServicoSelecionadoIdHook(null); }}>
                           <Edit3 className="mr-1 h-3 w-3" /> Digitar manualmente
                        </Button>
                      </>
                    ) : (
                      <>
                        <FormControl>
                          <Input placeholder="Ex: Consulta de Retorno, Venda Produto X" {...field} />
                        </FormControl>
                        <Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setModoServico('selecionar')}>
                          <ListPlus className="mr-1 h-3 w-3" /> Selecionar da lista
                        </Button>
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DATA E HORA DE INÍCIO */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
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
                  )}
                />
                <FormField
                  control={form.control}
                  name="hora_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Início *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* DATA E HORA DE FIM */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
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
                          <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < form.getValues("data_inicio")}/>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hora_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Fim *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* VALOR E STATUS */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(AGENDAMENTO_STATUS_OPTIONS || []).map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* DESCRIÇÃO */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalhes adicionais sobre o agendamento..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isLoadingMutation}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoadingMutation}>
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