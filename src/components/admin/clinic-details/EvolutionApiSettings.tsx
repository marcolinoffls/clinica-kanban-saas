import { useState } from 'react';
import { Link2, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Badge } from '@/components/ui/badge';

/**
 * 🔧 Componente para configurar integração com Evolution API
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Proteção contra clinica undefined
 * - Validação de entrada adequada
 * - Estados visuais melhorados
 * - Tratamento de erro robusto
 */

interface EvolutionApiSettingsProps {
  clinica: any;
  onSaveInstanceName: (instanceName: string) => Promise<void>;
  onSaveApiKey: (apiKey: string) => Promise<void>;
  saving: boolean;
  savingApiKey: boolean;
}

export const EvolutionApiSettings = ({ 
  clinica, 
  onSaveInstanceName, 
  onSaveApiKey, 
  saving, 
  savingApiKey 
}: EvolutionApiSettingsProps) => {
  // ✅ PROTEÇÃO: Verificar se clinica existe
  const currentInstanceName = clinica?.evolution_instance_name || '';
  const currentApiKey = clinica?.evolution_api_key || '';
  
  const [evolutionInstanceName, setEvolutionInstanceName] = useState(currentInstanceName);
  const [evolutionApiKey, setEvolutionApiKey] = useState('');

  // ✅ CORREÇÃO: Validação e tratamento de erro adequado
  const handleSaveInstanceName = async () => {
    if (!evolutionInstanceName.trim()) {
      alert('Por favor, insira um nome para a instância');
      return;
    }
    
    try {
      console.log(`🔧 [EvolutionApiSettings] Salvando instance name: ${evolutionInstanceName.trim()}`);
      await onSaveInstanceName(evolutionInstanceName.trim());
    } catch (error) {
      console.error('❌ [EvolutionApiSettings] Erro ao salvar nome da instância:', error);
      // Não mostrar alert aqui pois já é tratado no componente pai
    }
  };

  const handleSaveApiKey = async () => {
    if (!evolutionApiKey.trim()) {
      alert('Por favor, insira a API Key');
      return;
    }
    
    try {
      console.log(`🔑 [EvolutionApiSettings] Salvando API Key`);
      await onSaveApiKey(evolutionApiKey.trim());
      setEvolutionApiKey(''); // Limpar campo após salvar com sucesso
    } catch (error) {
      console.error('❌ [EvolutionApiSettings] Erro ao salvar API Key:', error);
      // Não mostrar alert aqui pois já é tratado no componente pai
    }
  };

  // Função para mascarar API Key
  const maskApiKey = (apiKey: string) => {
    if (!apiKey || apiKey.length < 8) return apiKey;
    return `${apiKey.substring(0, 4)}${'*'.repeat(apiKey.length - 8)}${apiKey.substring(apiKey.length - 4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Configurações da Evolution API
        </CardTitle>
        <CardDescription>
          Configure a integração com Evolution API para WhatsApp Business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* ✅ Status das Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Instância:</Label>
            <Badge variant={currentInstanceName ? 'default' : 'secondary'}>
              {currentInstanceName ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurado
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pendente
                </>
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">API Key:</Label>
            <Badge variant={currentApiKey ? 'default' : 'secondary'}>
              {currentApiKey ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurada
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pendente
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* ✅ Nome da Instância Evolution */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="evolution-instance-name">
              Nome da Instância Evolution
            </Label>
            <p className="text-xs text-gray-500">
              Nome único da sua instância na Evolution API
            </p>
          </div>
          
          {/* Valor Atual */}
          {currentInstanceName && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-medium text-blue-700">Instância Atual:</Label>
              <p className="text-sm text-blue-600 font-mono">{currentInstanceName}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              id="evolution-instance-name"
              placeholder="Digite o nome da instância (ex: minha-clinica-instance)"
              value={evolutionInstanceName}
              onChange={(e) => setEvolutionInstanceName(e.target.value)}
              className="flex-1"
              disabled={saving}
            />
            <Button 
              onClick={handleSaveInstanceName} 
              disabled={saving || !evolutionInstanceName.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* ✅ API Key da Evolution */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="evolution-api-key">
              API Key da Evolution
            </Label>
            <p className="text-xs text-gray-500">
              Chave de autenticação para acesso à Evolution API
            </p>
          </div>
          
          {/* Valor Atual (Mascarado) */}
          {currentApiKey && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <Label className="text-sm font-medium text-green-700">API Key Atual:</Label>
              <p className="text-sm text-green-600 font-mono">{maskApiKey(currentApiKey)}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <PasswordInput
              value={evolutionApiKey}
              onChange={setEvolutionApiKey}
              placeholder="Digite a nova API Key da Evolution"
              className="flex-1"
              label=""
              description=""
              disabled={savingApiKey}
            />
            <Button 
              onClick={handleSaveApiKey} 
              disabled={savingApiKey || !evolutionApiKey.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              {savingApiKey ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              {savingApiKey ? 'Salvando...' : 'Salvar API Key'}
            </Button>
          </div>
        </div>

        {/* ✅ Instruções */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            📋 Como obter as configurações:
          </h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• <strong>Nome da Instância:</strong> Configurado no painel da Evolution API</li>
            <li>• <strong>API Key:</strong> Gerada no painel administrativo da Evolution API</li>
            <li>• Ambas são necessárias para integração com WhatsApp Business</li>
            <li>• Certifique-se de que a instância está ativa na Evolution API</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};