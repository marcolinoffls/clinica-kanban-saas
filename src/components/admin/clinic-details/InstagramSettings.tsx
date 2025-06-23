
import { useState } from 'react';
import { Instagram, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * 📱 Componente para configurar integração com Instagram
 * 
 * RECURSOS:
 * - Configuração do user handle do Instagram
 * - Configuração de webhook personalizado
 * - Validação de entrada
 * - Estados visuais de loading
 * - Feedback visual de sucesso/erro
 */

interface InstagramSettingsProps {
  clinica: any;
  onSave: (userHandle: string) => Promise<void>;
  saving?: boolean;
}

export const InstagramSettings = ({ 
  clinica, 
  onSave, 
  saving = false 
}: InstagramSettingsProps) => {
  // Estados locais
  const [instagramUserHandle, setInstagramUserHandle] = useState(
    clinica?.instagram_user_handle || ''
  );

  const handleSave = async () => {
    if (!instagramUserHandle.trim()) {
      alert('Por favor, insira o user handle do Instagram');
      return;
    }

    try {
      await onSave(instagramUserHandle.trim());
    } catch (error) {
      console.error('Erro ao salvar configurações Instagram:', error);
    }
  };

  const isConfigured = Boolean(clinica?.instagram_user_handle);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="w-5 h-5" />
          Configurações do Instagram
        </CardTitle>
        <CardDescription>
          Configure a integração com Instagram Business para receber leads via Direct Messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status da Configuração */}
        <Alert className={isConfigured ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={isConfigured ? "text-green-700" : "text-yellow-700"}>
              {isConfigured 
                ? "✅ Instagram configurado e pronto para receber leads"
                : "⚠️ Configure o user handle do Instagram para receber leads"
              }
            </AlertDescription>
          </div>
        </Alert>

        {/* Configuração do User Handle */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="instagram-user-handle" className="text-base font-medium">
              User Handle do Instagram
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Seu nome de usuário no Instagram (sem o @)
            </p>
          </div>
          
          {/* Valor Atual */}
          {clinica?.instagram_user_handle && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-medium text-blue-700">User Handle Atual:</Label>
              <p className="text-sm text-blue-600 font-mono mt-1">
                @{clinica.instagram_user_handle}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                @
              </span>
              <Input
                id="instagram-user-handle"
                placeholder="minha_clinica"
                value={instagramUserHandle}
                onChange={(e) => setInstagramUserHandle(e.target.value)}
                className="pl-8"
                disabled={saving}
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving || !instagramUserHandle.trim() || instagramUserHandle === clinica?.instagram_user_handle}
              variant="outline"
              className="flex items-center gap-2 min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-3">
            📋 Como configurar:
          </h4>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <span>Insira o seu nome de usuário do Instagram (sem o @)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span>Certifique-se de que sua conta é do tipo Business ou Creator</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <span>Configure o webhook do Instagram para receber mensagens automaticamente</span>
            </li>
          </ul>
        </div>

        {/* Informações Técnicas */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            🔧 Informações Técnicas:
          </h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Clínica ID:</strong> <code className="bg-gray-100 px-1 rounded">{clinica?.id || 'N/A'}</code></p>
            <p><strong>Status da Integração:</strong> {isConfigured ? '✅ Ativa' : '❌ Inativa'}</p>
            <p><strong>Webhook Type:</strong> {clinica?.instagram_webhook_type || 'personalizado'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
