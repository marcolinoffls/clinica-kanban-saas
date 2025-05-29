
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AISettings, UpdateSettingFunction } from './types';

/**
 * Seção de Ativação da IA
 * 
 * Permite configurar quando e para quais leads a IA deve ser ativada
 * automaticamente, incluindo configurações de sugestões de chat
 */

interface AIActivationSectionProps {
  settings: AISettings;
  updateSetting: UpdateSettingFunction;
}

export const AIActivationSection = ({ settings, updateSetting }: AIActivationSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ativação da IA</CardTitle>
        <CardDescription>
          Configure quando e para quais leads a IA deve ser ativada automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="ai-all-leads" className="flex flex-col gap-1">
            <span>Ativar IA para todos os novos leads</span>
            <span className="text-sm text-gray-500">A IA será ativada automaticamente para todos os novos leads que chegarem</span>
          </Label>
          <Switch
            id="ai-all-leads"
            checked={settings.ai_active_for_all_new_leads}
            onCheckedChange={(checked) => updateSetting('ai_active_for_all_new_leads', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ai-ad-leads" className="flex flex-col gap-1">
            <span>Ativar IA apenas para leads de anúncios</span>
            <span className="text-sm text-gray-500">A IA será ativada apenas para leads que vieram de campanhas de anúncios</span>
          </Label>
          <Switch
            id="ai-ad-leads"
            checked={settings.ai_active_for_ad_leads_only}
            onCheckedChange={(checked) => updateSetting('ai_active_for_ad_leads_only', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ai-suggestions" className="flex flex-col gap-1">
            <span>Sugestões de chat da IA</span>
            <span className="text-sm text-gray-500">A IA sugere respostas automáticas durante conversas</span>
          </Label>
          <Switch
            id="ai-suggestions"
            checked={settings.ai_chat_suggestions_active}
            onCheckedChange={(checked) => updateSetting('ai_chat_suggestions_active', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
