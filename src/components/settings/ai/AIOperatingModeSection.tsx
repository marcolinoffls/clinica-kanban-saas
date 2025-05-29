
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AISettings, UpdateSettingFunction } from './types';

/**
 * Seção de Modo de Operação da IA
 * 
 * Permite definir se a IA funcionará 24/7 ou apenas
 * nos horários comerciais configurados
 */

interface AIOperatingModeSectionProps {
  settings: AISettings;
  updateSetting: UpdateSettingFunction;
}

export const AIOperatingModeSection = ({ settings, updateSetting }: AIOperatingModeSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modo de Operação</CardTitle>
        <CardDescription>
          Defina como a IA deve operar em relação aos horários.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={settings.ai_operating_mode}
          onValueChange={(value) => updateSetting('ai_operating_mode', value)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="24/7" id="mode-24-7" />
            <Label htmlFor="mode-24-7" className="flex flex-col gap-1">
              <span>24/7 - Sempre ativo</span>
              <span className="text-sm text-gray-500">A IA funcionará a qualquer hora, todos os dias</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="horario_comercial" id="mode-business" />
            <Label htmlFor="mode-business" className="flex flex-col gap-1">
              <span>Horário comercial</span>
              <span className="text-sm text-gray-500">A IA funcionará apenas nos horários configurados abaixo</span>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
