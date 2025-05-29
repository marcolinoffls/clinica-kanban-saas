
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Bot, Clock, Settings, Zap } from 'lucide-react';
import { useClinicAISettings } from '@/hooks/useClinicAISettings';

/**
 * Componente de formulário para configurações de IA
 * 
 * Permite que o usuário configure:
 * - Ativação automática da IA para leads
 * - Comportamento e personalização da IA
 * - Horários de funcionamento da IA
 * - Funcionalidades futuras (informativo)
 * 
 * Utiliza o hook useClinicAISettings para carregar e salvar as configurações
 */

export const AISettingsForm = () => {
  const { settings, loading, saving, fetchAISettings, saveAISettings } = useClinicAISettings();
  
  // Estados locais para o formulário
  const [formData, setFormData] = useState({
    ai_active_for_all_new_leads: false,
    ai_active_for_ad_leads_only: false,
    ai_chat_suggestions_active: false,
    ai_name: '',
    ai_restricted_topics_prompt: '',
    ai_operating_mode: '24/7',
    ai_business_hours_start_weekday: '',
    ai_business_hours_end_weekday: '',
    ai_active_saturday: false,
    ai_saturday_hours_start: '',
    ai_saturday_hours_end: '',
    ai_active_sunday: false,
    ai_sunday_hours_start: '',
    ai_sunday_hours_end: '',
    ai_clinica_prompt: ''
  });

  // Carregar configurações ao montar o componente
  useEffect(() => {
    fetchAISettings();
  }, []);

  // Atualizar formulário quando configurações forem carregadas
  useEffect(() => {
    if (settings) {
      setFormData({
        ai_active_for_all_new_leads: settings.ai_active_for_all_new_leads || false,
        ai_active_for_ad_leads_only: settings.ai_active_for_ad_leads_only || false,
        ai_chat_suggestions_active: settings.ai_chat_suggestions_active || false,
        ai_name: settings.ai_name || '',
        ai_restricted_topics_prompt: settings.ai_restricted_topics_prompt || '',
        ai_operating_mode: settings.ai_operating_mode || '24/7',
        ai_business_hours_start_weekday: settings.ai_business_hours_start_weekday || '',
        ai_business_hours_end_weekday: settings.ai_business_hours_end_weekday || '',
        ai_active_saturday: settings.ai_active_saturday || false,
        ai_saturday_hours_start: settings.ai_saturday_hours_start || '',
        ai_saturday_hours_end: settings.ai_saturday_hours_end || '',
        ai_active_sunday: settings.ai_active_sunday || false,
        ai_sunday_hours_start: settings.ai_sunday_hours_start || '',
        ai_sunday_hours_end: settings.ai_sunday_hours_end || '',
        ai_clinica_prompt: settings.ai_clinica_prompt || ''
      });
    }
  }, [settings]);

  // Função para atualizar campo do formulário
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para salvar configurações
  const handleSave = async () => {
    const success = await saveAISettings(formData);
    if (success) {
      // Recarregar configurações para sincronizar
      await fetchAISettings();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão de salvar no topo */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Seção: Ativação da IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Ativação da IA
          </CardTitle>
          <CardDescription>
            Configure quando a IA deve ser ativada automaticamente para novos leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="ai-all-leads">Ativar IA para todos os novos leads?</Label>
              <p className="text-sm text-gray-600">
                A IA iniciará conversas automaticamente com todos os novos leads
              </p>
            </div>
            <Switch
              id="ai-all-leads"
              checked={formData.ai_active_for_all_new_leads}
              onCheckedChange={(checked) => updateField('ai_active_for_all_new_leads', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="ai-ad-leads">Ativar IA apenas para leads de anúncios?</Label>
              <p className="text-sm text-gray-600">
                Se ativo, a IA priorizará leads marcados como 'Anúncio' ou de campanhas
              </p>
            </div>
            <Switch
              id="ai-ad-leads"
              checked={formData.ai_active_for_ad_leads_only}
              onCheckedChange={(checked) => updateField('ai_active_for_ad_leads_only', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção: Comportamento e Personalização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Comportamento e Personalização da IA
          </CardTitle>
          <CardDescription>
            Defina como a IA deve se apresentar e se comportar nas conversas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-name">Como a IA deve se apresentar?</Label>
            <Textarea
              id="ai-name"
              placeholder="Ex: Olá! Sou [Nome da IA], sua assistente virtual da Clínica [Nome da Clínica]. Como posso te ajudar hoje?"
              value={formData.ai_name}
              onChange={(e) => updateField('ai_name', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-prompt">Instruções Base para a IA (Prompt Principal)</Label>
            <p className="text-sm text-gray-600">
              Defina o tom de voz, informações da clínica, procedimentos principais e como a IA deve conduzir conversas
            </p>
            <Textarea
              id="ai-prompt"
              placeholder="Ex: Você é um assistente especializado em atendimento de clínicas estéticas. Sempre seja cordial, profissional e empático. Foque em agendar consultas e esclarecer dúvidas básicas sobre procedimentos..."
              value={formData.ai_clinica_prompt}
              onChange={(e) => updateField('ai_clinica_prompt', e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-restrictions">Sobre o que a IA NÃO deve responder?</Label>
            <p className="text-sm text-gray-600">
              Liste tópicos que a IA deve evitar ou encaminhar para um atendente humano
            </p>
            <Textarea
              id="ai-restrictions"
              placeholder="Ex: A IA não deve fornecer diagnósticos médicos, não deve discutir preços de procedimentos complexos sem agendar avaliação, não deve prometer resultados específicos..."
              value={formData.ai_restricted_topics_prompt}
              onChange={(e) => updateField('ai_restricted_topics_prompt', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção: Horário de Atuação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Horário de Atuação da IA
          </CardTitle>
          <CardDescription>
            Configure quando a IA deve estar ativa para responder mensagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Modo de funcionamento da IA:</Label>
            <RadioGroup
              value={formData.ai_operating_mode}
              onValueChange={(value) => updateField('ai_operating_mode', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24/7" id="mode-24-7" />
                <Label htmlFor="mode-24-7">Funcionar 24 horas por dia, 7 dias por semana</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific_hours" id="mode-specific" />
                <Label htmlFor="mode-specific">Funcionar somente em horários específicos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outside_business_hours" id="mode-outside" />
                <Label htmlFor="mode-outside">Funcionar somente FORA do horário comercial</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Configurações de horário (visível se não for 24/7) */}
          {formData.ai_operating_mode !== '24/7' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Definir Horários</h4>
              
              {/* Horário comercial */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Horário Comercial (Segunda a Sexta):</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label htmlFor="business-start" className="text-xs">De:</Label>
                    <Input
                      id="business-start"
                      type="time"
                      value={formData.ai_business_hours_start_weekday}
                      onChange={(e) => updateField('ai_business_hours_start_weekday', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="business-end" className="text-xs">Até:</Label>
                    <Input
                      id="business-end"
                      type="time"
                      value={formData.ai_business_hours_end_weekday}
                      onChange={(e) => updateField('ai_business_hours_end_weekday', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sábado */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="saturday-active"
                    checked={formData.ai_active_saturday}
                    onCheckedChange={(checked) => updateField('ai_active_saturday', checked)}
                  />
                  <Label htmlFor="saturday-active">Ativar IA aos Sábados?</Label>
                </div>
                {formData.ai_active_saturday && (
                  <div className="flex gap-2 items-center ml-6">
                    <div className="flex-1">
                      <Label htmlFor="saturday-start" className="text-xs">De:</Label>
                      <Input
                        id="saturday-start"
                        type="time"
                        value={formData.ai_saturday_hours_start}
                        onChange={(e) => updateField('ai_saturday_hours_start', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="saturday-end" className="text-xs">Até:</Label>
                      <Input
                        id="saturday-end"
                        type="time"
                        value={formData.ai_saturday_hours_end}
                        onChange={(e) => updateField('ai_saturday_hours_end', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Domingo */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sunday-active"
                    checked={formData.ai_active_sunday}
                    onCheckedChange={(checked) => updateField('ai_active_sunday', checked)}
                  />
                  <Label htmlFor="sunday-active">Ativar IA aos Domingos?</Label>
                </div>
                {formData.ai_active_sunday && (
                  <div className="flex gap-2 items-center ml-6">
                    <div className="flex-1">
                      <Label htmlFor="sunday-start" className="text-xs">De:</Label>
                      <Input
                        id="sunday-start"
                        type="time"
                        value={formData.ai_sunday_hours_start}
                        onChange={(e) => updateField('ai_sunday_hours_start', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="sunday-end" className="text-xs">Até:</Label>
                      <Input
                        id="sunday-end"
                        type="time"
                        value={formData.ai_sunday_hours_end}
                        onChange={(e) => updateField('ai_sunday_hours_end', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção: Funcionalidades Futuras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            Funcionalidades Futuras
          </CardTitle>
          <CardDescription>
            Recursos que estarão disponíveis em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-1">
              <Label>Habilitar sugestões de respostas por IA no chat?</Label>
              <p className="text-sm text-gray-600">
                Em breve: A IA analisará conversas e sugerirá respostas para atendentes
              </p>
            </div>
            <Switch disabled checked={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
