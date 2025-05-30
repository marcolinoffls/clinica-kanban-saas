
import { useState } from 'react';
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

  // Função para lidar com seleção de serviço
  const handleServicoChange = (servicoIdValue: string) => {
    const servico = servicosSeguro.find(s => s.id === servicoIdValue);
    if (servico) {
      setServicoSelecionadoId(servicoIdValue);
      form.setValue('titulo', servico.nome_servico, { shouldValidate: true });
      console.log(`[ServicoSelector] Serviço selecionado: ${servico.nome_servico}, ID: ${servicoIdValue}`);
    } else {
      setServicoSelecionadoId(null);
      if(modoServico === 'selecionar') form.setValue('titulo', '', { shouldValidate: true });
    }
  };

  const alternarParaManual = () => {
    setModoServico('manual');
    form.setValue('titulo', '');
    setServicoSelecionadoId(null);
  };

  const alternarParaSelecionar = () => {
    setModoServico('selecionar');
  };

  return (
    <FormField
      control={form.control}
      name="titulo"
      rules={{ required: "Título ou serviço é obrigatório." }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Título/Serviço *</FormLabel>
          {modoServico === 'selecionar' ? (
            <>
              <Select
                onValueChange={handleServicoChange}
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
