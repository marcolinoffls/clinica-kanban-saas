
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, X, ChevronDown, Check } from 'lucide-react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { useLeads } from '@/hooks/useLeadsData';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useClinicServices } from '@/hooks/useClinicServices';
import { useCreateAgendamento, CreateAgendamentoData } from '@/hooks/useAgendamentosData';
import { useCreateLead } from '@/hooks/useClinicaOperations';
import { AGENDAMENTO_STATUS_OPTIONS, AgendamentoFormData } from '@/constants/agendamentos';

/**
 * Modal para registrar/editar agendamentos
 * 
 * Funcionalidades:
 * - Formulário completo para criação de agendamentos
 * - Seleção ou criação de cliente/lead
 * - Seleção de serviço existente ou inserção manual do título
 * - Definição de data/hora de início e fim
 * - Controle de status do agendamento
 * - Valor financeiro e observações
 * - Validação de campos obrigatórios
 * - Integração com Supabase para salvamento
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
  // Estados para controles de UI
  const [dataInicioPopoverOpen, setDataInicioPopoverOpen] = useState(false);
  const [dataFimPopoverOpen, setDataFimPopoverOpen] = useState(false);
  const [clienteComboboxOpen, setClienteComboboxOpen] = useState(false);
  
  // Estados para modo de serviço (selecionar da lista ou manual)
  const [modoServico, setModoServico] = useState<'selecionar' | 'manual'>('selecionar');
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<string | null>(null);
  
  // Estados para criação de novo cliente
  const [registrandoNovoCliente, setRegistrandoNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [clienteBusca, setClienteBusca] = useState('');

  // Hooks para obter dados necessários
  const { data: leads = [] } = useLeads();
  const { data: servicos = [] } = useClinicServices();
  const { clinicaAtiva } = useClinica();
  const { userProfile } = useAuthUser();
  
  // Hooks para mutações
  const createAgendamentoMutation = useCreateAgendamento();
  const createLeadMutation = useCreateLead();

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

  // Função para formatar data para ISO string
  const formatarDataParaISO = (data: Date) => {
    return data.toISOString();
  };

  // Função para lidar com seleção de serviço
  const handleServicoSelect = (servicoId: string) => {
    const servico = servicos.find(s => s.id === servicoId);
    if (servico) {
      setServicoSelecionadoId(servicoId);
      form.setValue('titulo', servico.nome_servico);
    }
  };

  // Função para lidar com seleção de cliente
  const handleClienteSelect = (clienteId: string) => {
    if (clienteId === 'novo_cliente') {
      setRegistrandoNovoCliente(true);
      form.setValue('cliente_id', '');
    } else {
      setRegistrandoNovoCliente(false);
      form.setValue('cliente_id', clienteId);
      const cliente = leads.find(l => l.id === clienteId);
      if (cliente) {
        setClienteBusca(cliente.nome);
      }
    }
    setClienteComboboxOpen(false);
  };

  // Função para lidar com salvamento do agendamento
  const handleSaveAgendamento = async (dados: AgendamentoFormData) => {
    try {
      console.log('🔄 Iniciando salvamento do agendamento...');
      
      let cliente_id_final = dados.cliente_id;
      
      // Se estamos registrando um novo cliente, criar primeiro
      if (registrandoNovoCliente) {
        if (!novoClienteNome.trim() || !novoClienteTelefone.trim()) {
          throw new Error('Nome e telefone são obrigatórios para novo cliente');
        }
        
        console.log('🔄 Criando novo cliente:', { nome: novoClienteNome, telefone: novoClienteTelefone });
        
        const novoLead = await createLeadMutation.mutateAsync({
          nome: novoClienteNome.trim(),
          telefone: novoClienteTelefone.trim(),
          clinica_id: clinicaAtiva?.id || '',
        });
        
        cliente_id_final = novoLead.id;
        console.log('✅ Novo cliente criado com ID:', cliente_id_final);
      }
      
      // Determinar título final baseado no modo de serviço
      let titulo_final = dados.titulo;
      if (modoServico === 'selecionar' && servicoSelecionadoId) {
        const servicoSelecionado = servicos.find(s => s.id === servicoSelecionadoId);
        if (servicoSelecionado) {
          titulo_final = servicoSelecionado.nome_servico;
        }
      }
      
      // Construir dados do agendamento
      const agendamentoData: CreateAgendamentoData = {
        cliente_id: cliente_id_final,
        clinica_id: clinicaAtiva?.id || '',
        usuario_id: userProfile?.user_id || '',
        titulo: titulo_final,
        data_inicio: formatarDataParaISO(dados.data_inicio),
        data_fim: formatarDataParaISO(dados.data_fim),
        valor: dados.valor || 0,
        status: dados.status,
        descricao: dados.descricao || '',
      };
      
      console.log('🔄 Dados do agendamento para salvar:', agendamentoData);
      
      // Salvar agendamento
      await createAgendamentoMutation.mutateAsync(agendamentoData);
      
      console.log('✅ Agendamento salvo com sucesso');
      
      // Fechar modal e resetar formulário
      handleCancel();
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar agendamento:', error);
    }
  };

  // Função para lidar com cancelamento
  const handleCancel = () => {
    form.reset();
    setModoServico('selecionar');
    setServicoSelecionadoId(null);
    setRegistrandoNovoCliente(false);
    setNovoClienteNome('');
    setNovoClienteTelefone('');
    setClienteBusca('');
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
            {/* Seleção do Cliente/Lead com Combobox */}
            <FormField
              control={form.control}
              name="cliente_id"
              rules={{ required: !registrandoNovoCliente ? 'Selecione um cliente' : false }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cliente *</FormLabel>
                  <Popover open={clienteComboboxOpen} onOpenChange={setClienteComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && !registrandoNovoCliente && "text-muted-foreground"
                          )}
                        >
                          {registrandoNovoCliente 
                            ? `Novo cliente: ${novoClienteNome || 'Digite o nome...'}`
                            : field.value 
                            ? leads.find(lead => lead.id === field.value)?.nome 
                            : "Selecione um cliente..."
                          }
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar cliente..." 
                          value={clienteBusca}
                          onValueChange={setClienteBusca}
                        />
                        <CommandEmpty>
                          <div className="p-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleClienteSelect('novo_cliente')}
                            >
                              Criar novo cliente: "{clienteBusca}"
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {leads.map((lead) => (
                            <CommandItem
                              key={lead.id}
                              value={lead.nome}
                              onSelect={() => handleClienteSelect(lead.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === lead.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {lead.nome} - {lead.telefone}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos para Novo Cliente (se selecionado) */}
            {registrandoNovoCliente && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium text-blue-900">Dados do Novo Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Cliente *
                    </label>
                    <Input
                      value={novoClienteNome}
                      onChange={(e) => setNovoClienteNome(e.target.value)}
                      placeholder="Digite o nome completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <Input
                      value={novoClienteTelefone}
                      onChange={(e) => setNovoClienteTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRegistrandoNovoCliente(false)}
                >
                  Cancelar novo cliente
                </Button>
              </div>
            )}

            {/* Campo Título/Serviço com Modo Seleção ou Manual */}
            <div className="space-y-4">
              {modoServico === 'selecionar' ? (
                <FormField
                  control={form.control}
                  name="titulo"
                  rules={{ required: 'Serviço é obrigatório' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço/Procedimento *</FormLabel>
                      <Select onValueChange={handleServicoSelect} value={servicoSelecionadoId || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {servicos.map((servico) => (
                            <SelectItem key={servico.id} value={servico.id}>
                              {servico.nome_servico}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-sm">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-blue-600"
                          onClick={() => setModoServico('manual')}
                        >
                          Serviço não listado? Digitar manualmente
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="titulo"
                  rules={{ required: 'Título é obrigatório' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Serviço/Procedimento Manual *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Consulta personalizada, Procedimento especial..."
                          {...field} 
                        />
                      </FormControl>
                      <div className="text-sm">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-blue-600"
                          onClick={() => setModoServico('selecionar')}
                        >
                          Selecionar da lista
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
                disabled={createAgendamentoMutation.isPending || createLeadMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createAgendamentoMutation.isPending || createLeadMutation.isPending}
              >
                {createAgendamentoMutation.isPending || createLeadMutation.isPending 
                  ? 'Salvando...' 
                  : (agendamento ? 'Atualizar' : 'Criar') + ' Agendamento'
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
