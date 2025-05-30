
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lead } from '@/hooks/useLeadsData';
import { AgendamentoFormData } from './types';

/**
 * Componente para campos de cadastro de novo cliente
 * 
 * Renderiza os campos nome e telefone quando o usuário
 * opta por cadastrar um novo cliente durante o agendamento.
 * 
 * Props:
 * - form: Hook do react-hook-form
 * - setRegistrandoNovoCliente: Função para cancelar o cadastro
 * - setClienteBuscaInput: Função para resetar o input de busca
 * - leads: Lista de leads para encontrar cliente pelo ID
 */

interface NovoClienteFieldsProps {
  form: UseFormReturn<AgendamentoFormData>;
  setRegistrandoNovoCliente: (value: boolean) => void;
  setClienteBuscaInput: (value: string) => void;
  leads: Lead[];
}

export const NovoClienteFields = ({
  form,
  setRegistrandoNovoCliente,
  setClienteBuscaInput,
  leads,
}: NovoClienteFieldsProps) => {
  // Garantir que leads seja sempre um array
  const leadsSeguro = Array.isArray(leads) ? leads : [];

  const handleCancelarNovoCliente = () => {
    setRegistrandoNovoCliente(false);
    form.setValue('novo_cliente_nome', '');
    form.setValue('novo_cliente_telefone', '');
    const clienteId = form.getValues('cliente_id');
    const clienteNome = clienteId ? leadsSeguro.find(l => l.id === clienteId)?.nome || '' : '';
    setClienteBuscaInput(clienteNome);
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-gray-50 my-4">
      <h4 className="font-medium text-gray-800 text-sm">Detalhes do Novo Cliente</h4>
      
      <FormField
        control={form.control}
        name="novo_cliente_nome"
        rules={{ required: 'Nome do novo cliente é obrigatório.' }}
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
        rules={{ required: 'Telefone do novo cliente é obrigatório.' }}
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
        onClick={handleCancelarNovoCliente}
      >
        Cancelar Novo Cliente
      </Button>
    </div>
  );
};
