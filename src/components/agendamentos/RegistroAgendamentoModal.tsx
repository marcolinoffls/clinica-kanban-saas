
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
import { ClienteSelector } from './ClienteSelector';
import { NovoClienteFields } from './NovoClienteFields';
import { ServicoSelector } from './ServicoSelector';
import { AGENDAMENTO_STATUS_OPTIONS } from '@/constants/agendamentos';

// Esquema de validação
const agendamentoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  data_inicio: z.date({ required_error: 'Data de início é obrigatória' }),
  data_fim: z.date({ required_error: 'Data de fim é obrigatória' }),
  status: z.enum(['agendado', 'confirmado', 'realizado', 'cancelado']),
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  valor: z.number().optional(),
  clinica_id: z.string().min(1, 'Clínica é obrigatória'),
  usuario_id: z.string().min(1, 'Usuário é obrigatório'),
});

type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

interface RegistroAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento?: AgendamentoFromDatabase; // Prop para edição
  selectedDate?: Date;
}

export const RegistroAgendamentoModal: React.FC<RegistroAgendamentoModalProps> = ({
  isOpen,
  onClose,
  agendamento,
  selectedDate,
}) => {
  const { clinicaAtiva } = useClinica();
  const { userProfile, loading: isLoadingUser, profileError: userError, user } = useAuthUser();
  const createAgendamentoMutation = useCreateAgendamento();
  const updateAgendamentoMutation = useUpdateAgendamento();

  const [isNovoCliente, setIsNovoCliente] = useState(false);

  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      data_inicio: selectedDate || new Date(),
      data_fim: selectedDate || new Date(),
      status: 'agendado' as const, // Garante que é do tipo correto
      cliente_id: '',
      valor: 0,
      clinica_id: clinicaAtiva?.id || '',
      usuario_id: userProfile?.id || '',
    },
  });

  useEffect(() => {
    if (agendamento) {
      form.reset({
        titulo: agendamento.titulo || '',
        descricao: agendamento.descricao || '',
        data_inicio: agendamento.data_inicio ? new Date(agendamento.data_inicio) : selectedDate || new Date(),
        data_fim: agendamento.data_fim ? new Date(agendamento.data_fim) : selectedDate || new Date(),
        status: agendamento.status as 'agendado' | 'confirmado' | 'realizado' | 'cancelado', // Cast para tipo correto
        cliente_id: agendamento.cliente_id || '',
        valor: agendamento.valor || 0,
        clinica_id: clinicaAtiva?.id || '',
        usuario_id: userProfile?.id || '',
      });
    } else {
      form.reset({
        titulo: '',
        descricao: '',
        data_inicio: selectedDate || new Date(),
        data_fim: selectedDate || new Date(),
        status: 'agendado' as const,
        cliente_id: '',
        valor: 0,
        clinica_id: clinicaAtiva?.id || '',
        usuario_id: userProfile?.id || '',
      });
    }
  }, [agendamento, selectedDate, clinicaAtiva, userProfile, form]);

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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" type="text" {...form.register('titulo')} />
              {form.formState.errors.titulo && (
                <p className="text-red-500 text-sm">{form.formState.errors.titulo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" {...form.register('descricao')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio">Data de Início</Label>
                <Input
                  id="data_inicio"
                  type="datetime-local"
                  {...form.register('data_inicio', {
                    valueAsDate: true,
                  })}
                  defaultValue={form.getValues('data_inicio')?.toISOString().slice(0, 16)}
                />
                {form.formState.errors.data_inicio && (
                  <p className="text-red-500 text-sm">{form.formState.errors.data_inicio.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="data_fim">Data de Fim</Label>
                <Input
                  id="data_fim"
                  type="datetime-local"
                  {...form.register('data_fim', {
                    valueAsDate: true,
                  })}
                  defaultValue={form.getValues('data_fim')?.toISOString().slice(0, 16)}
                />
                {form.formState.errors.data_fim && (
                  <p className="text-red-500 text-sm">{form.formState.errors.data_fim.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select {...form.register('status')}>
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

          {/* Cliente Selector */}
          <ClienteSelector
            form={form as any}
            leads={[]}
            clienteBuscaInput=""
            setClienteBuscaInput={() => {}}
            setRegistrandoNovoCliente={setIsNovoCliente}
            loadingLeads={false}
            registrandoNovoCliente={isNovoCliente}
          />

          {/* Campos de novo cliente */}
          {isNovoCliente && (
            <NovoClienteFields
              form={form as any}
              setRegistrandoNovoCliente={setIsNovoCliente}
              setClienteBuscaInput={() => {}}
              leads={[]}
            />
          )}

          {/* Serviço Selector */}
          <ServicoSelector
            form={form as any}
            servicos={servicosSeguro}
            loadingServices={loadingServices}
            modoServico={modoServico}
            setModoServico={setModoServico}
            servicoSelecionadoId={servicoSelecionadoIdHook}
            setServicoSelecionadoId={setServicoSelecionadoIdHook}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAgendamentoMutation.isPending || updateAgendamentoMutation.isPending}>
              {agendamento ? 'Atualizar' : 'Criar'} Agendamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
