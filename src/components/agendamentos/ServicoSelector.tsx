
import { UseFormReturn } from 'react-hook-form';
import { Edit3, ListPlus } from 'lucide-react';
import {
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClinicaServico } from '@/hooks/useClinicServices';
import { AgendamentoFormData } from './types';

/**
 * Componente para seleção ou digitação manual de serviço
 * 
 * Permite alternar entre selecionar um serviço da lista
 * de serviços cadastrados na clínica ou digitar manualmente
 * o título do agendamento.
 * 
 * Props:
 * - form: Hook do react-hook-form
 * - servicos: Lista de serviços da clínica
 * - loadingServices: Indica se os serviços estão carregando
 * - modoServico: Modo atual ('selecionar' ou 'manual')
 * - setModoServico: Função para alterar o modo
 * - servicoSelecionadoId: ID do serviço selecionado
 * - setServicoSelecionadoId: Função para alterar serviço selecionado
 */

interface ServicoSelectorProps {
  form: UseFormReturn<AgendamentoFormData>;
  servicos: ClinicaServico[];
  loadingServices: boolean;
  modoServico: 'selecionar' | 'manual';
  setModoServico: (modo: 'selecionar' | 'manual') => void;
  servicoSelecionadoId: string | null;
  setServicoSelecionadoId: (id: string | null) => void;
}

export const ServicoSelector = ({
  form,
  servicos,
  loadingServices,
  modoServico,
  setModoServico,
  servicoSelecionadoId,
  setServicoSelecionadoId,
}: ServicoSelectorProps) => {
  // Garantir que servicos seja sempre um array
  const servicosSeguro = Array.isArray(servicos) ? servicos : [];

  // CORREÇÃO: As funções de alternância de modo foram ajustadas
  // para limpar o valor do campo 'titulo' e garantir que o formulário
  // não mantenha um estado inconsistente.
  const alternarParaManual = () => {
    setModoServico('manual');
    form.setValue('titulo', ''); // Limpa o título ao mudar para digitação manual
    setServicoSelecionadoId(null);
  };

  const alternarParaSelecionar = () => {
    setModoServico('selecionar');
    form.setValue('titulo', '', { shouldValidate: true }); // Limpa e valida o título ao voltar para seleção
    setServicoSelecionadoId(null);
  };

  return (
    <FormField
      control={form.control}
      name="titulo"
      // A prop 'rules' foi removida porque a validação agora é controlada
      // exclusivamente pelo schema do Zod no componente do modal, que é a prática correta.
      render={({ field }) => (
        <FormItem>
          <FormLabel>Título/Serviço *</FormLabel>
          {modoServico === 'selecionar' ? (
            <>
              <Select
                // CORREÇÃO: A lógica foi movida para o `onValueChange` do Select.
                // Agora, usamos `field.onChange` que é a função fornecida pelo react-hook-form
                // para atualizar o valor do campo 'titulo'. Isso garante que o formulário
                // e a validação (Zod) funcionem de forma integrada e correta.
                onValueChange={(servicoIdValue: string) => {
                  const servico = servicosSeguro.find(s => s.id === servicoIdValue);
                  if (servico) {
                    setServicoSelecionadoId(servicoIdValue);
                    // Atualiza o campo 'titulo' do formulário com o nome do serviço
                    field.onChange(servico.nome_servico);
                  } else {
                    setServicoSelecionadoId(null);
                    // Limpa o campo 'titulo' se nenhum serviço for encontrado
                    field.onChange('');
                  }
                }}
                value={servicoSelecionadoId || ""}
                disabled={loadingServices}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingServices && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                  {servicosSeguro.map((servico) => (
                    <SelectItem key={servico.id} value={servico.id}>
                      {servico.nome_servico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-xs" 
                onClick={alternarParaManual}
              >
                <Edit3 className="mr-1 h-3 w-3" /> Digitar manualmente
              </Button>
            </>
          ) : (
            <>
              <FormControl>
                {/* Quando em modo manual, o input é conectado diretamente ao formulário via `...field` */}
                <Input placeholder="Ex: Consulta de Retorno, Venda Produto X" {...field} />
              </FormControl>
              <Button 
                type="button" 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-xs" 
                onClick={alternarParaSelecionar}
              >
                <ListPlus className="mr-1 h-3 w-3" /> Selecionar da lista
              </Button>
            </>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
