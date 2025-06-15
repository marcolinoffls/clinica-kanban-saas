/**
 * Componente para gerenciar o Horário de Funcionamento da Clínica
 *
 * O que faz:
 * - Permite ao usuário definir os horários de funcionamento para cada dia da semana.
 * - Para cada dia, é possível marcar como "Fechado" ou adicionar um ou mais intervalos de horário (ex: 08:00-12:00 e 14:00-18:00).
 * - As alterações são salvas diretamente no banco de dados, na tabela 'clinicas', campo 'horario_funcionamento' (JSONB).
 *
 * Onde é usado:
 * - Renderizado dentro de uma aba na `SettingsPage`.
 *
 * Como se conecta com outras partes:
 * - Recebe o `clinicaId` para saber qual clínica atualizar.
 * - Utiliza o cliente Supabase para buscar e salvar os horários.
 * - Usa componentes de UI como Card, Button, Input e Checkbox para a interface.
 * - Exibe notificações de sucesso ou erro usando 'sonner'.
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface BusinessHoursSettingsProps {
  clinicaId: string | null;
}

// Tipos para estruturar os dados de horário
type TimeSlot = {
  start: string;
  end: string;
};

type DayHours = {
  isClosed: boolean;
  slots: TimeSlot[];
};

type BusinessHours = {
  [day: string]: DayHours;
};

// Dias da semana em ordem
const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Estrutura inicial para os horários, com todos os dias fechados por padrão
const initialHours: BusinessHours = daysOfWeek.reduce((acc, day) => {
  acc[day] = { isClosed: true, slots: [{ start: '08:00', end: '18:00' }] };
  return acc;
}, {} as BusinessHours);


export const BusinessHoursSettings = ({ clinicaId }: BusinessHoursSettingsProps) => {
  const [hours, setHours] = useState<BusinessHours>(initialHours);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Efeito que busca os horários salvos no banco quando o componente carrega
  useEffect(() => {
    if (!clinicaId) {
      setLoading(false);
      return;
    }

    const fetchHours = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinicas')
        .select('horario_funcionamento')
        .eq('id', clinicaId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar horários:", error);
        toast.error("Não foi possível carregar os horários.");
      } else if (data && (data as any).horario_funcionamento) {
        // Se encontrou dados, mescla com o estado inicial para garantir que todos os dias estejam presentes
        // Usamos 'as any' para acessar 'horario_funcionamento' pois os tipos do Supabase podem estar desatualizados.
        const dbHours = (data as any).horario_funcionamento as BusinessHours;
        const mergedHours = { ...initialHours };
        for (const day in dbHours) {
            if (mergedHours[day]) {
                mergedHours[day] = dbHours[day];
            }
        }
        setHours(mergedHours);
      }
      setLoading(false);
    };

    fetchHours();
  }, [clinicaId]);

  // Função para marcar/desmarcar um dia como fechado
  const handleToggleClosed = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isClosed: !prev[day].isClosed },
    }));
  };

  // Função para atualizar o valor de um campo de horário
  const handleTimeChange = (day: string, slotIndex: number, type: 'start' | 'end', value: string) => {
    const newSlots = [...hours[day].slots];
    newSlots[slotIndex][type] = value;
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: newSlots },
    }));
  };

  // Função para adicionar um novo intervalo de horário para um dia
  const handleAddTimeSlot = (day: string) => {
    const newSlots = [...hours[day].slots, { start: '09:00', end: '18:00' }];
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: newSlots },
    }));
  };

  // Função para remover um intervalo de horário
  const handleRemoveTimeSlot = (day: string, slotIndex: number) => {
    const newSlots = hours[day].slots.filter((_, index) => index !== slotIndex);
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: newSlots },
    }));
  };

  // Função para salvar todas as alterações no banco de dados
  const handleSave = async () => {
    if (!clinicaId) return;
    
    setIsSaving(true);
    // Adicionamos 'as any' para contornar a verificação de tipo do Supabase,
    // que pode estar com tipos desatualizados após a migração do banco.
    const { error } = await supabase
      .from('clinicas')
      .update({ horario_funcionamento: hours } as any)
      .eq('id', clinicaId);

    if (error) {
      toast.error("Erro ao salvar os horários.");
      console.error("Erro no Supabase:", error);
    } else {
      toast.success("Horários de funcionamento salvos com sucesso!");
    }
    setIsSaving(false);
  };

  if (loading) {
    return <div className="text-center p-8">Carregando horários...</div>;
  }
  
  if (!clinicaId) {
    return <div className="text-center p-8 text-muted-foreground">Salve as informações da clínica primeiro para definir os horários.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de Funcionamento</CardTitle>
        <CardDescription>
          Defina os horários em que sua clínica está aberta para atendimento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {daysOfWeek.map(day => (
            <div key={day} className="flex flex-col md:flex-row md:items-start gap-4 py-6">
              <Label className="font-semibold w-full md:w-32 shrink-0 pt-2">{day}</Label>
              <div className="flex-grow space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`closed-${day}`}
                    checked={hours[day]?.isClosed}
                    onCheckedChange={() => handleToggleClosed(day)}
                  />
                  <Label htmlFor={`closed-${day}`} className="font-normal">Fechado</Label>
                </div>

                {!hours[day]?.isClosed && (
                  <div className="space-y-4 pt-2">
                    {hours[day].slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 animate-in fade-in">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={e => handleTimeChange(day, index, 'start', e.target.value)}
                          className="w-[120px]"
                        />
                        <span className="text-sm text-muted-foreground">até</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={e => handleTimeChange(day, index, 'end', e.target.value)}
                          className="w-[120px]"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTimeSlot(day, index)}
                          disabled={hours[day].slots.length <= 1}
                          className="group"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => handleAddTimeSlot(day)} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar horário
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Horários'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};
