
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AISettings, UpdateSettingFunction } from './types';

/**
 * Seção de Horários de Funcionamento da IA
 * 
 * Permite configurar os horários específicos em que a IA
 * deve estar ativa durante dias úteis, sábados e domingos
 */

interface AIBusinessHoursSectionProps {
  settings: AISettings;
  updateSetting: UpdateSettingFunction;
}

export const AIBusinessHoursSection = ({ settings, updateSetting }: AIBusinessHoursSectionProps) => {
  // Só renderiza se o modo não for 24/7
  if (settings.ai_operating_mode === '24/7') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários de Funcionamento</CardTitle>
        <CardDescription>
          Configure os horários em que a IA deve estar ativa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dias úteis */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Segunda a Sexta-feira</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weekday-start" className="text-sm">Início</Label>
              <Input
                id="weekday-start"
                type="time"
                value={settings.ai_business_hours_start_weekday}
                onChange={(e) => updateSetting('ai_business_hours_start_weekday', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weekday-end" className="text-sm">Fim</Label>
              <Input
                id="weekday-end"
                type="time"
                value={settings.ai_business_hours_end_weekday}
                onChange={(e) => updateSetting('ai_business_hours_end_weekday', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sábado */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Sábado</Label>
            <Switch
              checked={settings.ai_active_saturday}
              onCheckedChange={(checked) => updateSetting('ai_active_saturday', checked)}
            />
          </div>
          {settings.ai_active_saturday && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="saturday-start" className="text-sm">Início</Label>
                <Input
                  id="saturday-start"
                  type="time"
                  value={settings.ai_saturday_hours_start}
                  onChange={(e) => updateSetting('ai_saturday_hours_start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="saturday-end" className="text-sm">Fim</Label>
                <Input
                  id="saturday-end"
                  type="time"
                  value={settings.ai_saturday_hours_end}
                  onChange={(e) => updateSetting('ai_saturday_hours_end', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Domingo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Domingo</Label>
            <Switch
              checked={settings.ai_active_sunday}
              onCheckedChange={(checked) => updateSetting('ai_active_sunday', checked)}
            />
          </div>
          {settings.ai_active_sunday && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sunday-start" className="text-sm">Início</Label>
                <Input
                  id="sunday-start"
                  type="time"
                  value={settings.ai_sunday_hours_start}
                  onChange={(e) => updateSetting('ai_sunday_hours_start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sunday-end" className="text-sm">Fim</Label>
                <Input
                  id="sunday-end"
                  type="time"
                  value={settings.ai_sunday_hours_end}
                  onChange={(e) => updateSetting('ai_sunday_hours_end', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
