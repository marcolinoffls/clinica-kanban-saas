
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Seção de Configurações de IA no Painel Administrativo
 * 
 * Permite que administradores configurem as configurações de IA
 * para clínicas específicas diretamente do painel administrativo.
 * 
 * Props:
 * - clinicaId: ID da clínica para configurar
 */

interface AdminAISettingsSectionProps {
  clinicaId: string;
}

interface AISettings {
  ai_active_for_all_new_leads: boolean;
  ai_active_for_ad_leads_only: boolean;
  ai_chat_suggestions_active: boolean;
  ai_business_hours_start_weekday: string;
  ai_business_hours_end_weekday: string;
  ai_active_saturday: boolean;
  ai_saturday_hours_start: string;
  ai_saturday_hours_end: string;
  ai_active_sunday: boolean;
  ai_sunday_hours_start: string;
  ai_sunday_hours_end: string;
  ai_operating_mode: string;
  ai_name: string;
  ai_clinica_prompt: string;
  ai_restricted_topics_prompt: string;
  admin_prompt: string;
}

const defaultSettings: AISettings = {
  ai_active_for_all_new_leads: false,
  ai_active_for_ad_leads_only: false,
  ai_chat_suggestions_active: false,
  ai_business_hours_start_weekday: '08:00',
  ai_business_hours_end_weekday: '18:00',
  ai_active_saturday: false,
  ai_saturday_hours_start: '08:00',
  ai_saturday_hours_end: '12:00',
  ai_active_sunday: false,
  ai_sunday_hours_start: '08:00',
  ai_sunday_hours_end: '12:00',
  ai_operating_mode: '24/7',
  ai_name: '',
  ai_clinica_prompt: '',
  ai_restricted_topics_prompt: '',
  admin_prompt: ''
};

export const AdminAISettingsSection = ({ clinicaId }: AdminAISettingsSectionProps) => {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar configurações da clínica
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('clinicas')
          .select(`
            ai_active_for_all_new_leads,
            ai_active_for_ad_leads_only,
            ai_chat_suggestions_active,
            ai_business_hours_start_weekday,
            ai_business_hours_end_weekday,
            ai_active_saturday,
            ai_saturday_hours_start,
            ai_saturday_hours_end,
            ai_active_sunday,
            ai_sunday_hours_start,
            ai_sunday_hours_end,
            ai_operating_mode,
            ai_name,
            ai_clinica_prompt,
            ai_restricted_topics_prompt,
            admin_prompt
          `)
          .eq('id', clinicaId)
          .single();

        if (error) throw error;

        if (data) {
          setSettings({
            ai_active_for_all_new_leads: data.ai_active_for_all_new_leads ?? false,
            ai_active_for_ad_leads_only: data.ai_active_for_ad_leads_only ?? false,
            ai_chat_suggestions_active: data.ai_chat_suggestions_active ?? false,
            ai_business_hours_start_weekday: data.ai_business_hours_start_weekday ?? '08:00',
            ai_business_hours_end_weekday: data.ai_business_hours_end_weekday ?? '18:00',
            ai_active_saturday: data.ai_active_saturday ?? false,
            ai_saturday_hours_start: data.ai_saturday_hours_start ?? '08:00',
            ai_saturday_hours_end: data.ai_saturday_hours_end ?? '12:00',
            ai_active_sunday: data.ai_active_sunday ?? false,
            ai_sunday_hours_start: data.ai_sunday_hours_start ?? '08:00',
            ai_sunday_hours_end: data.ai_sunday_hours_end ?? '12:00',
            ai_operating_mode: data.ai_operating_mode ?? '24/7',
            ai_name: data.ai_name ?? '',
            ai_clinica_prompt: data.ai_clinica_prompt ?? '',
            ai_restricted_topics_prompt: data.ai_restricted_topics_prompt ?? '',
            admin_prompt: data.admin_prompt ?? ''
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de IA:', error);
        toast.error('Erro ao carregar configurações de IA');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [clinicaId]);

  // Função para atualizar configuração
  const updateSetting = (key: keyof AISettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Função para salvar configurações
  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('clinicas')
        .update({
          ai_active_for_all_new_leads: settings.ai_active_for_all_new_leads,
          ai_active_for_ad_leads_only: settings.ai_active_for_ad_leads_only,
          ai_chat_suggestions_active: settings.ai_chat_suggestions_active,
          ai_business_hours_start_weekday: settings.ai_business_hours_start_weekday,
          ai_business_hours_end_weekday: settings.ai_business_hours_end_weekday,
          ai_active_saturday: settings.ai_active_saturday,
          ai_saturday_hours_start: settings.ai_saturday_hours_start,
          ai_saturday_hours_end: settings.ai_saturday_hours_end,
          ai_active_sunday: settings.ai_active_sunday,
          ai_sunday_hours_start: settings.ai_sunday_hours_start,
          ai_sunday_hours_end: settings.ai_sunday_hours_end,
          ai_operating_mode: settings.ai_operating_mode,
          ai_name: settings.ai_name,
          ai_clinica_prompt: settings.ai_clinica_prompt,
          ai_restricted_topics_prompt: settings.ai_restricted_topics_prompt,
          admin_prompt: settings.admin_prompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicaId);

      if (error) throw error;

      toast.success('Configurações de IA salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações de IA:', error);
      toast.error('Erro ao salvar configurações de IA');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Bot className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Carregando configurações de IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Configurações da Inteligência Artificial
          </h3>
          <p className="text-gray-600 mt-1">
            Configure como a IA deve se comportar para esta clínica
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Ativação da IA */}
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
              <span className="text-sm text-gray-500">A IA será ativada automaticamente para todos os novos leads</span>
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
              <span className="text-sm text-gray-500">A IA será ativada apenas para leads de campanhas</span>
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

      {/* Modo de Operação */}
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
                <span className="text-sm text-gray-500">A IA funcionará apenas nos horários configurados</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Horários (só aparece se não for 24/7) */}
      {settings.ai_operating_mode === 'horario_comercial' && (
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
      )}

      {/* Personalidade da IA */}
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
              placeholder="Descreva como a IA deve se comportar, que informações sobre a clínica ela deve saber..."
              value={settings.ai_clinica_prompt}
              onChange={(e) => updateSetting('ai_clinica_prompt', e.target.value)}
              rows={4}
            />
            <p className="text-sm text-gray-500">
              Instruções específicas sobre como a IA deve se comportar e que informações sobre a clínica ela deve conhecer
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
    </div>
  );
};
