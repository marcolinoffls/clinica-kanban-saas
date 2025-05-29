
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AISettings, UpdateSettingFunction } from './types';

/**
 * Seção de Personalidade da IA
 * 
 * Permite customizar como a IA se apresenta e se comporta nas conversas,
 * incluindo nome, prompts personalizados e tópicos restritos
 */

interface AIPersonalitySectionProps {
  settings: AISettings;
  updateSetting: UpdateSettingFunction;
}

export const AIPersonalitySection = ({ settings, updateSetting }: AIPersonalitySectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalidade da IA</CardTitle>
        <CardDescription>
          Customize como a IA se apresenta e se comporta nas conversas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-name">Nome da IA</Label>
          <Input
            id="ai-name"
            placeholder="Ex: Sofia, Ana, Assistente Virtual..."
            value={settings.ai_name}
            onChange={(e) => updateSetting('ai_name', e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Como a IA deve se apresentar aos leads e pacientes
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-clinic-prompt">Prompt da Clínica</Label>
          <Textarea
            id="ai-clinic-prompt"
            placeholder="Descreva como a IA deve se comportar, que informações sobre a clínica ela deve saber, como deve responder..."
            value={settings.ai_clinica_prompt}
            onChange={(e) => updateSetting('ai_clinica_prompt', e.target.value)}
            rows={4}
          />
          <p className="text-sm text-gray-500">
            Instruções específicas sobre como a IA deve se comportar e que informações sobre sua clínica ela deve conhecer
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-restricted-topics">Tópicos Restritos</Label>
          <Textarea
            id="ai-restricted-topics"
            placeholder="Liste os assuntos que a IA NÃO deve abordar ou responder..."
            value={settings.ai_restricted_topics_prompt}
            onChange={(e) => updateSetting('ai_restricted_topics_prompt', e.target.value)}
            rows={3}
          />
          <p className="text-sm text-gray-500">
            Defina quais assuntos a IA deve evitar ou não responder
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-prompt">Prompt Administrativo</Label>
          <Textarea
            id="admin-prompt"
            placeholder="Instruções técnicas e administrativas para a IA..."
            value={settings.admin_prompt}
            onChange={(e) => updateSetting('admin_prompt', e.target.value)}
            rows={3}
          />
          <p className="text-sm text-gray-500">
            Configurações técnicas e administrativas avançadas para o comportamento da IA
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
