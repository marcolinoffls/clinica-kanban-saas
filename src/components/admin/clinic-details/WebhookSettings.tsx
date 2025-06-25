
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, Check, Globe, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente de Configurações de Webhook
 * 
 * O que faz:
 * - Permite configurar o tipo de webhook para a clínica (padrão ou personalizado)
 * - Salva a URL personalizada do webhook quando necessário
 * - Interface similar ao InstagramSettings para manter consistência
 * 
 * Onde é usado no app:
 * - Na página de detalhes da clínica no painel administrativo
 * - Aba "Webhook" junto com outras configurações
 * 
 * Como se conecta com outras partes:
 * - Recebe dados da clínica via props
 * - Chama função onSave para atualizar configurações no Supabase
 * - A edge function send-webhook usa essas configurações para determinar onde enviar os webhooks
 */

interface WebhookSettingsProps {
  clinica: {
    id: string;
    nome: string;
    webhook_type?: string;
    webhook_url?: string;
  };
  onSave: (webhookType: string, webhookUrl?: string) => Promise<void>;
  saving: boolean;
}

export const WebhookSettings = ({ clinica, onSave, saving }: WebhookSettingsProps) => {
  // Estados locais para controlar os valores do formulário
  const [webhookType, setWebhookType] = useState(clinica.webhook_type || 'padrao');
  const [webhookUrl, setWebhookUrl] = useState(clinica.webhook_url || '');
  const [isValidUrl, setIsValidUrl] = useState(true);
  const { toast } = useToast();

  // Função para validar se a URL está no formato correto
  const validateUrl = (url: string): boolean => {
    if (webhookType === 'padrao') return true; // URL não é necessária para webhook padrão
    if (!url.trim()) return false; // URL é obrigatória para webhook personalizado
    
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // Handler para mudanças na URL personalizada
  const handleUrlChange = (value: string) => {
    setWebhookUrl(value);
    setIsValidUrl(validateUrl(value));
  };

  // Handler para mudanças no tipo de webhook
  const handleTypeChange = (value: string) => {
    setWebhookType(value);
    if (value === 'padrao') {
      setIsValidUrl(true); // Reset validação quando volta para padrão
    } else {
      setIsValidUrl(validateUrl(webhookUrl));
    }
  };

  // Handler para salvar as configurações
  const handleSave = async () => {
    try {
      // Validar antes de salvar
      if (webhookType === 'personalizado' && !validateUrl(webhookUrl)) {
        toast({
          title: 'URL inválida',
          description: 'Por favor, insira uma URL válida para o webhook personalizado.',
          variant: 'destructive',
        });
        return;
      }

      // Chamar função de save passada via props
      await onSave(
        webhookType,
        webhookType === 'personalizado' ? webhookUrl : undefined
      );

      toast({
        title: 'Configurações salvas',
        description: 'As configurações de webhook foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de webhook:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Verificar se houve mudanças nos dados
  const hasChanges = 
    webhookType !== (clinica.webhook_type || 'padrao') ||
    (webhookType === 'personalizado' && webhookUrl !== (clinica.webhook_url || ''));

  // Verificar se pode salvar (tem mudanças e dados válidos)
  const canSave = hasChanges && isValidUrl && !saving;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <CardTitle>Configurações de Webhook</CardTitle>
        </div>
        <CardDescription>
          Configure como os eventos de chat serão enviados para sistemas externos.
          O webhook padrão funciona com n8n multi-tenant, enquanto o personalizado permite integração direta.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tipo de Webhook */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo de Webhook</Label>
          <RadioGroup value={webhookType} onValueChange={handleTypeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="padrao" id="padrao" />
              <Label htmlFor="padrao" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Webhook Padrão (Recomendado)</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  URL: https://webhooks.marcolinofernades.site/webhook/crm
                </p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personalizado" id="personalizado" />
              <Label htmlFor="personalizado" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>Webhook Personalizado</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Configure sua própria URL para receber os eventos
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* URL Personalizada */}
        {webhookType === 'personalizado' && (
          <div className="space-y-2">
            <Label htmlFor="webhook-url" className="text-sm font-medium">
              URL do Webhook Personalizado *
            </Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://exemplo.com/webhook"
              value={webhookUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={!isValidUrl ? 'border-red-500' : ''}
            />
            {!isValidUrl && (
              <p className="text-xs text-red-600">
                Por favor, insira uma URL válida (deve começar com http:// ou https://)
              </p>
            )}
            <p className="text-xs text-gray-600">
              Esta URL receberá todos os eventos de chat da clínica no formato JSON
            </p>
          </div>
        )}

        {/* Informações sobre o formato do webhook */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Formato dos dados:</strong> Os webhooks enviam dados no formato da Evolution API, 
            incluindo informações da mensagem, remetente, e metadados da clínica para multi-tenancy.
          </AlertDescription>
        </Alert>

        {/* Status atual */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600" />
            <span className="font-medium">Status Atual:</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {clinica.webhook_type === 'personalizado' ? (
              <>Webhook personalizado configurado: {clinica.webhook_url}</>
            ) : (
              <>Usando webhook padrão do sistema</>
            )}
          </p>
        </div>

        {/* Botão de salvar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
