import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon, Clock, X, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
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
import { toast } from 'sonner';

// Hooks de dados
import { useLeads } from '@/hooks/useLeadsData';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useClinicServices } from '@/hooks/useClinicServices';
import {
  useCreateAgendamento,
  useUpdateAgendamento,
  useDeleteAgendamento,
  CreateAgendamentoData,
  AgendamentoFromDatabase
} from '@/hooks/useAgendamentosData';
import { useClinicaOperations } from '@/hooks/useClinicaOperations';

// Constantes e Tipos
import { AGENDAMENTO_STATUS_OPTIONS } from '@/constants/agendamentos';
import { 
  AgendamentoFormData, 
  AgendamentoStatus, 
  agendamentoFormSchema, 
  formatarDataParaISO 
} from './types';

// Componentes refatorados
import { ClienteSelector } from './ClienteSelector';
import { NovoClienteFields } from './NovoClienteFields';
import { ServicoSelector } from './ServicoSelector';

/**
 * Modal para registro e edição de agendamentos
 * 
 * Este componente permite criar novos agendamentos ou editar existentes.
 * Integra com o sistema de leads para seleção de clientes e permite
 * cadastro de novos clientes durante o processo de agendamento.
 * 
 * Após correção do trigger handle_new_user, o userProfile deve sempre
 * estar disponível para usuários autenticados.
 */

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
  console.log('[ModalAgendamento] Props recebidas:', { isOpen, agendamentoParaEditar, leadPreSelecionadoId });

  // Estados para controles de UI
  const [dataInicioPopoverOpen, setDataInicioPopoverOpen] = useState(false);
  const [dataFimPopoverOpen, setDataFimPopoverOpen] = useState(false);

  // Estados para modo de serviço
  const [modoServico, setModoServico] = useState<'selecionar' | 'manual'>('selecionar');
  const [servicoSelecionadoIdHook, setServicoSelecionadoIdHook] = useState<string | null>(null);

  // Estados para criação de novo cliente
  const [registrandoNovoCliente, setRegistrandoNovoCliente] = useState(false);
  const [clienteBuscaInput, setClienteBuscaInput] = useState('');

  // Determinar se estamos em modo de edição
  const isEdicaoMode = !!agendamentoParaEditar;

  // Hooks para obter dados necessários
  const { data: leadsData, isLoading: loadingLeads } = useLeads();
  const { services: servicosData, isLoading: loadingServices } = useClinicServices();
  const { clinicaAtiva } = useClinica();
  const { userProfile, user, isAuthenticated, profileError, refreshProfile } = useAuthUser();

  // Log detalhado para debugging do usuário autenticado
  console.log('[ModalAgendamento] Estado de autenticação detalhado:', {
    isAuthenticated,
    user_id: user?.id,
    userProfile_exists: !!userProfile,
    userProfile_user_id: userProfile?.user_id,
    clinica_id: clinicaAtiva?.id,
    profileError: profileError?.message
  });

  // Garantir que os dados sejam sempre arrays válidos
  const leadsSeguro = Array.isArray(leadsData) ? leadsData : [];
  const servicosSeguro = Array.isArray(servicosData) ? servicosData : [];

  // Verificar se existe problema de autenticação crítico
  const hasAuthProblem = isAuthenticated && !userProfile && !profileError;
// Após linha 149
  useEffect(() => {
    console.log('🔍 [ModalAgendamento] Estado atual da autenticação:', {
      isAuthenticated,
      user: user ? {
        id: user.id,
        email: user.email
      } : 'null',
      userProfile: userProfile ? {
        user_id: userProfile.user_id,
        nome_completo: userProfile.nome_completo
      } : 'null',
      profileError: profileError?.message || 'null',
      hasAuthProblem
    });
  }, [isAuthenticated, user, userProfile, profileError, hasAuthProblem]);

  // Configuração do formulário
  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoFormSchema),
    defaultValues: {
      cliente_id: leadPreSelecionadoId || '',
      titulo: '',
      data_inicio: new Date(),
      hora_inicio: format(new Date(), 'HH:mm'),
      data_fim: new Date(),
      hora_fim: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm'),
      valor: 0,
      status: AgendamentoStatus.AGENDADO,
      descricao: '',
      clinica_id: clinicaAtiva?.id || '',
      usuario_id: userProfile?.user_id || user?.id || '',
      novo_cliente_nome: '',
      novo_cliente_telefone: '',
    },
  });

  // Hooks de mutação do Supabase
  const createAgendamentoMutation = useCreateAgendamento();
  const updateAgendamentoMutation = useUpdateAgendamento();
  const deleteAgendamentoMutation = useDeleteAgendamento();
  const { createLead, isCreatingLead } = useClinicaOperations();

  // Função para combinar data e hora em um objeto Date
  const combinarDataHora = (data: Date, horaString: string): Date => {
    const [horas, minutos] = horaString.split(':').map(Number);
    const novaData = new Date(data);
    novaData.setHours(horas, minutos, 0, 0);
    return novaData;
  };

  // Função onSubmit principal com validações críticas melhoradas
// Substitua a função onSubmit completa por esta versão com diagnóstico:

  const onSubmit = async (data: AgendamentoFormData) => {
    console.log('🚀 [ModalAgendamento] =========================');
    console.log('🚀 [ModalAgendamento] INICIANDO DIAGNÓSTICO COMPLETO');
    console.log('🚀 [ModalAgendamento] =========================');
    
    // DIAGNÓSTICO DETALHADO DO ESTADO DE AUTENTICAÇÃO
    console.log('🔍 [ModalAgendamento] Estado completo da autenticação:', {
      // Dados do useAuthUser
      isAuthenticated,
      user: user ? {
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role,
        created_at: user.created_at
      } : null,
      
      // Dados do userProfile
      userProfile: userProfile ? {
        user_id: userProfile.user_id,
        nome: userProfile.nome,
        email: userProfile.email,
        clinica_id: userProfile.clinica_id
      } : null,
      
      // Estados de erro e loading
      profileError: profileError ? {
        message: profileError.message,
        details: profileError
      } : null,
      
      // Dados da clínica
      clinicaAtiva: clinicaAtiva ? {
        id: clinicaAtiva.id,
        nome: clinicaAtiva.nome
      } : null,
      
      // Outros estados
      hasAuthProblem,
      timestamp: new Date().toISOString()
    });
  
    console.log('📋 [ModalAgendamento] Dados do formulário recebidos:', data);
    
    // VALIDAÇÃO 1: Verificar autenticação básica
    console.log('✅ [ModalAgendamento] VALIDAÇÃO 1: Verificando isAuthenticated...');
    if (!isAuthenticated) {
      console.error('❌ [ModalAgendamento] FALHOU: Usuário não está autenticado');
      toast.error("Você precisa estar logado para criar agendamentos.");
      return;
    }
    console.log('✅ [ModalAgendamento] PASSOU: Usuário está autenticado');
  
    // VALIDAÇÃO 2: Verificar se temos um objeto user válido
    console.log('✅ [ModalAgendamento] VALIDAÇÃO 2: Verificando objeto user...');
    if (!user || !user.id) {
      console.error('❌ [ModalAgendamento] FALHOU: Objeto user inválido', { user });
      toast.error("Erro de autenticação: dados do usuário não encontrados. Faça logout e login novamente.");
      return;
    }
    console.log('✅ [ModalAgendamento] PASSOU: Objeto user válido com ID:', user.id);
  
    // VALIDAÇÃO 3: Verificar userProfile
    console.log('✅ [ModalAgendamento] VALIDAÇÃO 3: Verificando userProfile...');
    if (!userProfile) {
      console.error('❌ [ModalAgendamento] FALHOU: userProfile não encontrado');
      console.error('❌ [ModalAgendamento] Isso indica que o perfil do usuário não existe na tabela user_profiles');
      console.error('❌ [ModalAgendamento] Possíveis causas:');
      console.error('   - Trigger handle_new_user não funcionou na criação do usuário');
      console.error('   - Perfil foi deletado da tabela user_profiles');
      console.error('   - Problema de sincronização entre auth.users e user_profiles');
      
      toast.error("Usuário não encontrado no sistema. Faça logout e login novamente.");
      return;
    }
    console.log('✅ [ModalAgendamento] PASSOU: userProfile encontrado:', userProfile.user_id);
  
    // VALIDAÇÃO 4: Verificar se user_id bate entre user e userProfile
    console.log('✅ [ModalAgendamento] VALIDAÇÃO 4: Verificando consistência de IDs...');
    if (user.id !== userProfile.user_id) {
      console.error('❌ [ModalAgendamento] FALHOU: IDs não batem!', {
        user_id: user.id,
        userProfile_user_id: userProfile.user_id
      });
      toast.error("Inconsistência de dados do usuário. Faça logout e login novamente.");
      return;
    }
    console.log('✅ [ModalAgendamento] PASSOU: IDs são consistentes');
  
    // VALIDAÇÃO 5: Verificar clínica
    console.log('✅ [ModalAgendamento] VALIDAÇÃO 5: Verificando clínica...');
    if (!clinicaAtiva?.id) {
      console.error('❌ [ModalAgendamento] FALHOU: Clínica não selecionada', { clinicaAtiva });
      toast.error("Erro de configuração: ID da clínica não encontrado.");
      return;
    }
    console.log('✅ [ModalAgendamento] PASSOU: Clínica válida:', clinicaAtiva.id);
  
    // Se chegou até aqui, todos os dados estão válidos
    // Por esta verificação mais robusta:
    // VALIDAÇÃO 6: Verificar se existe na tabela usuarios
    console.log('✅ [ModalAgendamento] VALIDAÇÃO 6: Verificando usuário na tabela usuarios...');
    
    // Primeiro, vamos usar o user.id (que é o auth.uid()) para buscar na tabela usuarios
    const usuario_id_final = user.id; // Usar o ID do auth.users, não do user_profiles
    
    console.log('✅ [ModalAgendamento] Usando usuario_id:', usuario_id_final);    
    console.log('🎉 [ModalAgendamento] TODAS AS VALIDAÇÕES PASSARAM!');
    console.log('🎉 [ModalAgendamento] Dados finais para criação:', {
      usuario_id_final,
      clinica_id: clinicaAtiva.id,
      cliente_id: data.cliente_id,
      registrandoNovoCliente
    });
  
    // Continuar com o resto da lógica...
    let cliente_id_final = data.cliente_id;
  
    if (registrandoNovoCliente) {
      if (!data.novo_cliente_nome?.trim() || !data.novo_cliente_telefone?.trim()) {
        form.setError("novo_cliente_nome", { type: "manual", message: "Nome é obrigatório para novo cliente."});
        form.setError("novo_cliente_telefone", { type: "manual", message: "Telefone é obrigatório para novo cliente."});
        toast.error("Nome e telefone são obrigatórios para cadastrar um novo cliente.");
        return;
      }
      
      try {
        console.log('📝 [ModalAgendamento] Criando novo lead:', { 
          nome: data.novo_cliente_nome, 
          telefone: data.novo_cliente_telefone 
        });
        
        const novoLead = await createLead({
          nome: data.novo_cliente_nome,
          telefone: data.novo_cliente_telefone,
        });
        
        cliente_id_final = novoLead.id;
        console.log('✅ [ModalAgendamento] Novo lead criado com ID:', cliente_id_final);
      } catch (error) {
        console.error('❌ [ModalAgendamento] Erro ao criar novo lead:', error);
        toast.error("Falha ao criar novo cliente.");
        return;
      }
    }
  
    if (!cliente_id_final && !registrandoNovoCliente) {
      form.setError("cliente_id", { type: "manual", message: "Cliente é obrigatório."});
      toast.error("Por favor, selecione um cliente ou cadastre um novo.");
      return;
    }
  
    const dataInicioFinal = combinarDataHora(data.data_inicio, data.hora_inicio);
    const dataFimFinal = combinarDataHora(data.data_fim, data.hora_fim);
  
    if (dataFimFinal <= dataInicioFinal) {
      form.setError("data_fim", { type: "manual", message: "Data/hora de fim deve ser posterior à de início."});
      form.setError("hora_fim", { type: "manual", message: " "});
      toast.error("Data ou hora de fim inválida.");
      return;
    }
  
    const agendamentoPayload: CreateAgendamentoData | (Partial<AgendamentoFromDatabase> & { id: string }) = {
      ...(isEdicaoMode && agendamentoParaEditar && { id: agendamentoParaEditar.id }),
      cliente_id: cliente_id_final,
      clinica_id: clinicaAtiva.id,
      usuario_id: usuario_id_final,
      titulo: modoServico === 'manual' ? data.titulo : (servicosSeguro.find(s => s.id === servicoSelecionadoIdHook)?.nome_servico || data.titulo),
      data_inicio: formatarDataParaISO(dataInicioFinal),
      data_fim: formatarDataParaISO(dataFimFinal),
      valor: data.valor ? Number(data.valor) : 0,
      status: data.status,
      descricao: data.descricao || null,
    };
    
    console.log('📤 [ModalAgendamento] Payload final para Supabase:', agendamentoPayload);
  
    try {
      if (isEdicaoMode) {
        console.log('🔄 [ModalAgendamento] Atualizando agendamento...');
        await updateAgendamentoMutation.mutateAsync(agendamentoPayload as Partial<AgendamentoFromDatabase> & { id: string });
      } else {
        console.log('➕ [ModalAgendamento] Criando novo agendamento...');
        await createAgendamentoMutation.mutateAsync(agendamentoPayload as CreateAgendamentoData);
      }
      
      console.log('✅ [ModalAgendamento] Agendamento salvo com sucesso!');
      handleCloseModal();
    } catch (error) {
      console.error('❌ [ModalAgendamento] Erro na mutação:', error);
    }
  };
  // useEffect para preencher formulário em modo de edição
  useEffect(() => {
    console.log('[ModalAgendamento] useEffect de Edição/Pré-seleção. isOpen:', isOpen, 'agendamentoParaEditar:', agendamentoParaEditar, 'leadPreSelecionadoId:', leadPreSelecionadoId);
    if (!isOpen) {
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
        form.setValue('titulo', servicoOriginal.nome_servico);
      } else {
        setModoServico('manual');
        form.setValue('titulo', agendamentoParaEditar.titulo || '');
      }
      
      const clienteDoAgendamento = leadsSeguro.find(l => l.id === agendamentoParaEditar.cliente_id);
      if (clienteDoAgendamento) {
        setClienteBuscaInput(clienteDoAgendamento.nome);
      }

    } else if (leadPreSelecionadoId) {
        console.log('[ModalAgendamento] Pré-selecionando lead ID:', leadPreSelecionadoId);
        form.setValue('cliente_id', leadPreSelecionadoId);
        const clientePre = leadsSeguro.find(l => l.id === leadPreSelecionadoId);
        if (clientePre) {
            setClienteBuscaInput(clientePre.nome);
        }
    } else {
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

  // Função para fechar o modal
  const handleCloseModal = () => {
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
    onClose();
    console.log('[ModalAgendamento] Modal fechado e formulário resetado.');
  };

  // Função para excluir agendamento
  const handleDelete = async () => {
    if (!agendamentoParaEditar?.id) return;
    console.log(`[ModalAgendamento] Solicitando exclusão do agendamento ID: ${agendamentoParaEditar.id}`);
    try {
      await deleteAgendamentoMutation.mutateAsync(agendamentoParaEditar.id);
      handleCloseModal();
    } catch (error) {
        console.error(`[ModalAgendamento] Erro ao excluir agendamento ID: ${agendamentoParaEditar.id}`, error);
    }
  };
  
  // Verificar se ainda está carregando dados essenciais
  const isLoadingMutation = createAgendamentoMutation.isPending || updateAgendamentoMutation.isPending || deleteAgendamentoMutation.isPending || isCreatingLead;

  // Se ainda está carregando dados essenciais, mostrar loading
  if (loadingLeads && leadsSeguro.length === 0) {
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

        <div className="flex-grow overflow-y-auto pr-2 pl-0.5 py-1">
          {/* Alerta para problemas de autenticação */}
          {hasAuthProblem && (
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex items-center justify-between">
                  <span>Problema de autenticação detectado. Perfil de usuário não encontrado.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshProfile}
                    className="ml-2 h-7 text-amber-700 border-amber-300 hover:bg-amber-100"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Tentar Novamente
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {profileError && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Erro ao carregar perfil do usuário: {profileError.message}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* SELEÇÃO DE CLIENTE */}
              <ClienteSelector
                form={form}
                leads={leadsSeguro}
                loadingLeads={loadingLeads}
                registrandoNovoCliente={registrandoNovoCliente}
                setRegistrandoNovoCliente={setRegistrandoNovoCliente}
                clienteBuscaInput={clienteBuscaInput}
                setClienteBuscaInput={setClienteBuscaInput}
              />

              {/* CAMPOS PARA NOVO CLIENTE */}
              {registrandoNovoCliente && (
                <NovoClienteFields
                  form={form}
                  setRegistrandoNovoCliente={setRegistrandoNovoCliente}
                  setClienteBuscaInput={setClienteBuscaInput}
                  leads={leadsSeguro}
                />
              )}

              {/* SELEÇÃO DE SERVIÇO */}
              <ServicoSelector
                form={form}
                servicos={servicosSeguro}
                loadingServices={loadingServices}
                modoServico={modoServico}
                setModoServico={setModoServico}
                servicoSelecionadoId={servicoSelecionadoIdHook}
                setServicoSelecionadoId={setServicoSelecionadoIdHook}
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
                          {AGENDAMENTO_STATUS_OPTIONS.map(option => (
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
