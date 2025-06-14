import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useCreateAgendamento, useUpdateAgendamento, type AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useLeads, type Lead } from '@/hooks/useLeadsData';
import { useClinicServices } from '@/hooks/useClinicServices';
import { ClienteSelector } from './ClienteSelector';
import { NovoClienteFields } from './NovoClienteFields';
import { ServicoSelector } from './ServicoSelector';
import { AGENDAMENTO_STATUS_OPTIONS } from '@/constants/agendamentos';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DateTimePicker } from '@/components/ui/DateTimePicker';

// Esquema de validação
const agendamentoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  data_inicio: z.date({ required_error: 'Data de início é obrigatória' }),
  data_fim: z.date({ required_error: 'Data de fim é obrigatória' }),
  // CORREÇÃO: O enum de status foi atualizado para incluir todos os valores
  // possíveis e usar o formato em minúsculas, alinhado com o banco de dados.
  status: z.enum(['agendado', 'confirmado', 'realizado', 'cancelado', 'pago', 'nao_compareceu']),
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  valor: z.number().optional(),
  clinica_id: z.string().min(1, 'Clínica é obrigatória'),
  usuario_id: z.string().min(1, 'Usuário é obrigatório'),
  novo_cliente_nome: z.string().optional(),
  novo_cliente_telefone: z.string().optional(),
});

type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

interface RegistroAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento?: AgendamentoFromDatabase; // Prop para edição
  selectedDate?: Date;
  lead?: Lead; // Prop para novo agendamento a partir do chat
}

export const RegistroAgendamentoModal: React.FC<RegistroAgendamentoModalProps> = ({
  isOpen,
  onClose,
  agendamento,
  selectedDate,
  lead,
}) => {
  const { clinicaAtiva } = useClinica();
  const { userProfile, loading: isLoadingUser, profileError: userError, user } = useAuthUser();
  const createAgendamentoMutation = useCreateAgendamento();
  const updateAgendamentoMutation = useUpdateAgendamento();

  // Hooks para buscar dados para os seletores
  const { services: servicos, isLoading: loadingServices } = useClinicServices();
  const { data: leads, isLoading: loadingLeads } = useLeads();

  const [isNovoCliente, setIsNovoCliente] = useState(false);
  const [clienteBuscaInput, setClienteBuscaInput] = useState('');
  const [modoServico, setModoServico] = useState<'selecionar' | 'manual'>('selecionar');
  const [servicoSelecionadoIdHook, setServicoSelecionadoIdHook] = useState<string | null>(null);
  
  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      data_inicio: selectedDate || new Date(),
      data_fim: selectedDate || new Date(),
      status: 'agendado' as const,
      cliente_id: '',
      valor: 0,
      clinica_id: clinicaAtiva?.id || '',
      // CORREÇÃO: O ID do usuário deve vir do objeto 'user' (autenticação),
      // não do 'userProfile'. O 'user.id' corresponde à chave na tabela auth.users.
      usuario_id: user?.id || '',
      novo_cliente_nome: '',
      novo_cliente_telefone: ''
    },
  });

  // EFEITO 1: Reseta o estado geral do formulário ao abrir o modal ou mudar o contexto (edição/criação).
  // Este hook cuida da inicialização dos campos, mas não do serviço, que depende de uma chamada assíncrona.
  useEffect(() => {
    // Só executa a lógica se o modal estiver aberto.
    if (!isOpen) return;

    // Função interna para resetar o formulário com base no contexto.
    const resetForm = () => {
      if (agendamento) {
        // MODO EDIÇÃO: Preenche o formulário com os dados do agendamento existente.
        form.reset({
          titulo: agendamento.titulo || '',
          descricao: agendamento.descricao || '',
          data_inicio: agendamento.data_inicio ? new Date(agendamento.data_inicio) : selectedDate || new Date(),
          data_fim: agendamento.data_fim ? new Date(agendamento.data_fim) : selectedDate || new Date(),
          // CORREÇÃO: A tipagem foi expandida para incluir todos os status possíveis.
          status: agendamento.status as 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'pago' | 'nao_compareceu',
          cliente_id: agendamento.cliente_id || '',
          valor: agendamento.valor || 0,
          clinica_id: clinicaAtiva?.id || '',
          usuario_id: user?.id || '',
        });
        const clienteExistente = leads?.find(l => l.id === agendamento.cliente_id);
        if (clienteExistente) {
          setClienteBuscaInput(clienteExistente.nome || "");
        }
        setIsNovoCliente(false);
      } else if (lead) {
        // MODO CRIAÇÃO (via Lead): Preenche o cliente e prepara para um novo agendamento.
        form.reset({
          titulo: '', // O título será definido no outro useEffect.
          descricao: '',
          data_inicio: selectedDate || new Date(),
          data_fim: selectedDate || new Date(),
          status: 'agendado' as const,
          cliente_id: lead.id,
          valor: 0,
          clinica_id: clinicaAtiva?.id || '',
          usuario_id: user?.id || '',
        });
        setClienteBuscaInput(lead.nome || "");
        setIsNovoCliente(false);
      } else {
        // MODO CRIAÇÃO (padrão): Limpa o formulário para um novo agendamento.
        form.reset({
          titulo: '', // O título será definido no outro useEffect.
          descricao: '',
          data_inicio: selectedDate || new Date(),
          data_fim: selectedDate || new Date(),
          status: 'agendado' as const,
          cliente_id: '',
          valor: 0,
          clinica_id: clinicaAtiva?.id || '',
          usuario_id: user?.id || '',
        });
        setClienteBuscaInput('');
        setIsNovoCliente(false);
      }
      // Reseta o estado do seletor de serviço sempre que o contexto muda.
      setServicoSelecionadoIdHook(null);
      setModoServico('selecionar');
    };

    resetForm();
    // Dependências que disparam o reset: mudança de contexto ou abertura do modal.
  }, [agendamento, lead, selectedDate, clinicaAtiva, user, form, leads, isOpen]);


  // EFEITO 2: Gerencia a lógica do seletor de serviço de forma isolada.
  // Reage ao carregamento da lista de serviços para definir um padrão ou encontrar um existente.
  useEffect(() => {
    // Não faz nada se o modal estiver fechado ou se os serviços ainda não foram carregados.
    if (!isOpen || !servicos) return;

    if (agendamento) {
      // MODO EDIÇÃO: Procura o serviço que corresponde ao título salvo.
      const servicoCorrespondente = servicos.find(s => s.nome_servico === agendamento.titulo);
      if (servicoCorrespondente) {
        // Se encontrou, define o ID para o <Select> e mantém o modo de seleção.
        setServicoSelecionadoIdHook(servicoCorrespondente.id);
        setModoServico('selecionar');
      } else {
        // Se não encontrou, significa que era um título digitado manualmente.
        setServicoSelecionadoIdHook(null);
        setModoServico('manual');
      }
    } else {
      // MODO CRIAÇÃO: Define um serviço padrão para melhorar a experiência do usuário.
      // A condição `!form.getValues('titulo')` evita sobreescrever um valor já existente.
      if (servicos.length > 0 && !form.getValues('titulo')) {
        const primeiroServico = servicos[0];
        // Define o ID para o <Select> funcionar corretamente.
        setServicoSelecionadoIdHook(primeiroServico.id);
        // CORREÇÃO PRINCIPAL: Define o valor do campo 'titulo' no formulário.
        form.setValue('titulo', primeiroServico.nome_servico, { shouldValidate: true });
        console.log(`[EFFECT SERVIÇO] Serviço padrão definido: ${primeiroServico.nome_servico}`);
      }
    }
  // Depende da lista de serviços e do contexto (aberto, edição/criação).
  }, [isOpen, servicos, agendamento, form]);

  const onSubmit = async (data: AgendamentoFormData) => {
    try {
      if (agendamento) {
        // Para atualização, converter datas para strings ISO
        const updateData = {
          id: agendamento.id,
          titulo: data.titulo,
          descricao: data.descricao,
          data_inicio: data.data_inicio.toISOString(),
          data_fim: data.data_fim.toISOString(),
          status: data.status,
          cliente_id: data.cliente_id,
          valor: Number(data.valor),
        };
        
        await updateAgendamentoMutation.mutateAsync(updateData);
      } else {
        // Para criação, garantir que todos os campos obrigatórios estão presentes
        const createData = {
          titulo: data.titulo,
          descricao: data.descricao,
          data_inicio: data.data_inicio.toISOString(),
          data_fim: data.data_fim.toISOString(),
          status: data.status,
          cliente_id: data.cliente_id,
          clinica_id: data.clinica_id,
          usuario_id: data.usuario_id,
          valor: Number(data.valor) || 0,
        };
        
        await createAgendamentoMutation.mutateAsync(createData);
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      alert(`Erro ao salvar agendamento: ${error.message}`);
    }
  };

  if (isLoadingUser) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Carregando dados do usuário...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (userError || !userProfile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar seus dados de usuário. Faça logout e login novamente.
              <br />
              <strong>Detalhes técnicos:</strong> {userError?.message || 'Perfil de usuário não encontrado'}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!clinicaAtiva) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Clínica não identificada. Verifique sua configuração de clínica.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Usuário logado:</strong> {user?.email || 'Email não disponível'}
              <br />
              <strong>Clínica ativa:</strong> {clinicaAtiva?.nome || 'Não identificada'}
            </AlertDescription>
          </Alert>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {/* Seletor de Cliente (movido para o topo e populado com dados reais) */}
            <ClienteSelector
              form={form as any}
              leads={leads || []}
              clienteBuscaInput={clienteBuscaInput}
              setClienteBuscaInput={setClienteBuscaInput}
              setRegistrandoNovoCliente={setIsNovoCliente}
              loadingLeads={loadingLeads}
              registrandoNovoCliente={isNovoCliente}
            />

            {/* Campos para novo cliente (condicional) */}
            {isNovoCliente && (
              <NovoClienteFields
                form={form as any}
                setRegistrandoNovoCliente={setIsNovoCliente}
                setClienteBuscaInput={setClienteBuscaInput}
                leads={leads || []}
              />
            )}

            {/* Seletor de Serviço/Título (movido para o topo e populado com dados reais) */}
            <ServicoSelector
              form={form as any}
              servicos={servicos || []}
              loadingServices={loadingServices}
              modoServico={modoServico}
              setModoServico={setModoServico}
              servicoSelecionadoId={servicoSelecionadoIdHook}
              setServicoSelecionadoId={setServicoSelecionadoIdHook}
            />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Textarea id="descricao" {...form.register('descricao')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <FormControl>
                        <DateTimePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim *</FormLabel>
                      <FormControl>
                        <DateTimePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    onValueChange={(value) => form.setValue('status', value as any)}
                    value={form.watch('status')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENDAMENTO_STATUS_OPTIONS.map((statusOption) => (
                        <SelectItem key={statusOption.value} value={statusOption.value}>
                          {statusOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    {...form.register('valor', { valueAsNumber: true })}
                  />
                </div>
              </div>

            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAgendamentoMutation.isPending || updateAgendamentoMutation.isPending}>
                {agendamento ? 'Atualizar' : 'Criar'} Agendamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
