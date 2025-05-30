
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ChevronDown, Check, UserPlus } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lead } from '@/hooks/useLeadsData';
import { AgendamentoFormData } from './types';

/**
 * Componente para seleção de cliente/lead
 * 
 * Permite selecionar um cliente existente ou iniciar o processo
 * de cadastro de um novo cliente. Usa um combobox com busca.
 * 
 * Props:
 * - form: Hook do react-hook-form para controlar o formulário
 * - leads: Lista de clientes/leads disponíveis
 * - loadingLeads: Indica se os leads estão sendo carregados
 * - registrandoNovoCliente: Estado se está registrando novo cliente
 * - setRegistrandoNovoCliente: Função para alterar estado de novo cliente
 * - clienteBuscaInput: Valor atual da busca
 * - setClienteBuscaInput: Função para alterar a busca
 */

interface ClienteSelectorProps {
  form: UseFormReturn<AgendamentoFormData>;
  leads: Lead[];
  loadingLeads: boolean;
  registrandoNovoCliente: boolean;
  setRegistrandoNovoCliente: (value: boolean) => void;
  clienteBuscaInput: string;
  setClienteBuscaInput: (value: string) => void;
}

export const ClienteSelector = ({
  form,
  leads,
  loadingLeads,
  registrandoNovoCliente,
  setRegistrandoNovoCliente,
  clienteBuscaInput,
  setClienteBuscaInput,
}: ClienteSelectorProps) => {
  const [clienteComboboxOpen, setClienteComboboxOpen] = useState(false);

  // Garantir que leads seja sempre um array
  const leadsSeguro = Array.isArray(leads) ? leads : [];

  // Filtrar leads para o Combobox
  const leadsFiltradosParaCombobox = clienteBuscaInput
    ? leadsSeguro.filter(lead =>
        lead.nome.toLowerCase().includes(clienteBuscaInput.toLowerCase()) ||
        lead.telefone?.includes(clienteBuscaInput)
      )
    : leadsSeguro;

  // Função para lidar com seleção de cliente
  const handleClienteSelect = (value: string) => {
    const leadSelecionado = leadsSeguro.find(l => l.id === value);

    if (leadSelecionado) {
      form.setValue('cliente_id', leadSelecionado.id, { shouldValidate: true });
      form.clearErrors('cliente_id');
      setClienteBuscaInput(leadSelecionado.nome);
      setRegistrandoNovoCliente(false);
      form.setValue('novo_cliente_nome', '');
      form.setValue('novo_cliente_telefone', '');
      console.log(`[ClienteSelector] Cliente existente selecionado: ${leadSelecionado.nome}, ID: ${leadSelecionado.id}`);
    } else if (value.startsWith('criar_novo_cliente:')) {
      const nomeDigitado = value.substring('criar_novo_cliente:'.length);
      setRegistrandoNovoCliente(true);
      form.setValue('cliente_id', '');
      form.setValue('novo_cliente_nome', nomeDigitado);
      setClienteBuscaInput(nomeDigitado);
      console.log(`[ClienteSelector] Iniciando cadastro de novo cliente com nome: ${nomeDigitado}`);
    }
    setClienteComboboxOpen(false);
  };

  return (
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
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Buscar cliente por nome ou telefone..."
                  value={clienteBuscaInput}
                  onValueChange={(search) => {
                    setClienteBuscaInput(search);
                    if (!search && registrandoNovoCliente) {
                      setRegistrandoNovoCliente(false);
                      form.setValue('novo_cliente_nome', '');
                    }
                  }}
                />
                <CommandList>
                  {loadingLeads && <div className="p-2 text-sm text-center">Carregando clientes...</div>}
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
                  {leadsFiltradosParaCombobox && leadsFiltradosParaCombobox.length > 0 && (
                    <CommandGroup>
                      {leadsFiltradosParaCombobox.map((lead) => (
                        <CommandItem
                          key={lead.id}
                          value={`${lead.nome} ${lead.telefone || ''} ${lead.id}`}
                          onSelect={() => handleClienteSelect(lead.id)}
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
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
