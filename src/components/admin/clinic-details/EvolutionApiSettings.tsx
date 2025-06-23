import { useState } from 'react';
import { Link2, Key, Loader2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * 🔧 Componente para configurar integração com Evolution API
 * 
 * RECURSOS:
 * - Configuração do nome da instância Evolution
 * - Configuração da API Key da Evolution
 * - Proteção contra dados undefined
 * - Exibição de status das configurações
 * - Validação de entrada
 * - Estados visuais de loading
 * - Feedback visual de sucesso/erro
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
  // ✅ DEBUG DETALHADO: Verificar se as funções foram passadas corretamente
  console.log('🔍 [EvolutionApiSettings] Props recebidas detalhadas:', {
    clinica: {
      exists: !!clinica,
      id: clinica?.id,
      nome: clinica?.nome,
      evolution_instance_name: clinica?.evolution_instance_name,
      evolution_api_key: clinica?.evolution_api_key ? '[PRESENTE]' : '[AUSENTE]'
    },
    onSaveInstanceName: {
      type: typeof onSaveInstanceName,
      isFunction: typeof onSaveInstanceName === 'function',
      exists: !!onSaveInstanceName
    },
    onSaveApiKey: {
      type: typeof onSaveApiKey,
      isFunction: typeof onSaveApiKey === 'function',
      exists: !!onSaveApiKey
    },
    saving,
    savingApiKey
  });

  // ✅ PROTEÇÃO: Verificar se clinica existe e extrair valores
  const currentInstanceName = clinica?.evolution_instance_name || '';
  const currentApiKey = clinica?.evolution_api_key || '';
  
  // Estados locais
  const [evolutionInstanceName, setEvolutionInstanceName] = useState(currentInstanceName);
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // ✅ PROTEÇÃO MELHORADA: Verificar se as funções existem antes de executar
  const handleSaveInstanceName = async () => {
    console.log('🔧 [EvolutionApiSettings] handleSaveInstanceName chamado');
    console.log('🔧 [EvolutionApiSettings] evolutionInstanceName:', evolutionInstanceName);
    console.log('🔧 [EvolutionApiSettings] onSaveInstanceName type:', typeof onSaveInstanceName);

    if (!evolutionInstanceName.trim()) {
      console.warn('⚠️ [EvolutionApiSettings] Instance name vazio');
      alert('Por favor, insira um nome para a instância');
      return;
    }

    if (typeof onSaveInstanceName !== 'function') {
      console.error('❌ [EvolutionApiSettings] onSaveInstanceName não é uma função:', {
        type: typeof onSaveInstanceName,
        value: onSaveInstanceName
      });
      alert('Erro interno: função de salvar não disponível');
      return;
    }
    
    try {
      console.log(`🔧 [EvolutionApiSettings] Executando onSaveInstanceName com: ${evolutionInstanceName.trim()}`);
      await onSaveInstanceName(evolutionInstanceName.trim());
      console.log('✅ [EvolutionApiSettings] onSaveInstanceName executado com sucesso');
    } catch (error) {
      console.error('❌ [EvolutionApiSettings] Erro ao salvar nome da instância:', error);
    }
  };

  const handleSaveApiKey = async () => {
    console.log('🔑 [EvolutionApiSettings] handleSaveApiKey chamado');
    console.log('🔑 [EvolutionApiSettings] evolutionApiKey length:', evolutionApiKey.length);
    console.log('🔑 [EvolutionApiSettings] onSaveApiKey type:', typeof onSaveApiKey);

    if (!evolutionApiKey.trim()) {
      console.warn('⚠️ [EvolutionApiSettings] API Key vazia');
      alert('Por favor, insira a API Key');
      return;
    }

    if (typeof onSaveApiKey !== 'function') {
      console.error('❌ [EvolutionApiSettings] onSaveApiKey não é uma função:', {
        type: typeof onSaveApiKey,
        value: onSaveApiKey
      });
      alert('Erro interno: função de salvar API Key não disponível');
      return;
    }
    
    try {
      console.log(`🔑 [EvolutionApiSettings] Executando onSaveApiKey`);
      await onSaveApiKey(evolutionApiKey.trim());
      setEvolutionApiKey(''); // Limpar campo após salvar com sucesso
      console.log('✅ [EvolutionApiSettings] onSaveApiKey executado com sucesso');
    } catch (error) {
      console.error('❌ [EvolutionApiSettings] Erro ao salvar API Key:', error);
    }
  };

  // Função para mascarar API Key
  const maskApiKey = (apiKey: string) => {
    if (!apiKey || apiKey.length < 8) return apiKey;
    return `${apiKey.substring(0, 4)}${'*'.repeat(apiKey.length - 8)}${apiKey.substring(apiKey.length - 4)}`;
  };

  // Verificar se a configuração está completa
  const isConfigComplete = currentInstanceName && currentApiKey;

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
        
        {/* ✅ Status Geral da Configuração */}
        <Alert className={isConfigComplete ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <div className="flex items-center gap-2">
            {isConfigComplete ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={isConfigComplete ? "text-green-700" : "text-yellow-700"}>
              {isConfigComplete 
                ? "✅ Evolution API configurada e pronta para uso"
                : "⚠️ Configuração incompleta - configure instância e API Key"
              }
            </AlertDescription>
          </div>
        </Alert>

        {/* ✅ Status Individual das Configurações */}
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

        {/* ✅ Configuração do Nome da Instância */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="evolution-instance-name" className="text-base font-medium">
              Nome da Instância Evolution
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Nome único da sua instância na Evolution API
            </p>
          </div>
          
          {/* Valor Atual da Instância */}
          {currentInstanceName && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-medium text-blue-700">Instância Atual:</Label>
              <p className="text-sm text-blue-600 font-mono mt-1">{currentInstanceName}</p>
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
              disabled={saving || !evolutionInstanceName.trim() || evolutionInstanceName === currentInstanceName}
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

        {/* ✅ Configuração da API Key */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="evolution-api-key" className="text-base font-medium">
              API Key da Evolution
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Chave de autenticação para acesso à Evolution API
            </p>
          </div>
          
          {/* Valor Atual da API Key (Mascarado) */}
          {currentApiKey && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-green-700">API Key Atual:</Label>
                  <p className="text-sm text-green-600 font-mono mt-1">
                    {showApiKey ? currentApiKey : maskApiKey(currentApiKey)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-green-600 hover:text-green-700"
                >
                  {showApiKey ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              id="evolution-api-key"
              type="password"
              placeholder="Digite a nova API Key da Evolution"
              value={evolutionApiKey}
              onChange={(e) => setEvolutionApiKey(e.target.value)}
              className="flex-1"
              disabled={savingApiKey}
            />
            <Button 
              onClick={handleSaveApiKey} 
              disabled={savingApiKey || !evolutionApiKey.trim()}
              variant="outline"
              className="flex items-center gap-2 min-w-[140px]"
            >
              {savingApiKey ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Salvar API Key
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ✅ Instruções de Configuração */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-3">
            📋 Como obter as configurações:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <span><strong>Nome da Instância:</strong> Acesse o painel da Evolution API e encontre o nome da sua instância na seção de instâncias ativas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span><strong>API Key:</strong> No painel administrativo da Evolution API, vá em Configurações → API Keys e gere uma nova chave</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <span>Certifique-se de que a instância está <strong>ativa</strong> e <strong>conectada</strong> ao WhatsApp</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              <span>Após configurar, teste a conexão enviando uma mensagem de teste</span>
            </li>
          </ul>
        </div>

        {/* ✅ Informações Técnicas */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            🔧 Informações Técnicas:
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Clínica ID:</strong> <code className="bg-blue-100 px-1 rounded">{clinica?.id || 'N/A'}</code></p>
            <p><strong>Status da Integração:</strong> {isConfigComplete ? '✅ Ativa' : '❌ Inativa'}</p>
            <p><strong>Última Atualização:</strong> {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};