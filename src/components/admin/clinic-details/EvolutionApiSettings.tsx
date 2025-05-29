
import { useState } from 'react';
import { Link2, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';

/**
 * Componente para configurar integração com Evolution API
 * 
 * Permite configurar:
 * - Nome da instância Evolution para WhatsApp
 * - API Key para autenticação na Evolution API
 * 
 * Essas configurações são essenciais para a integração
 * do sistema com o WhatsApp Business via Evolution API.
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
  const [evolutionInstanceName, setEvolutionInstanceName] = useState(clinica.evolution_instance_name || '');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');

  const handleSaveInstanceName = async () => {
    await onSaveInstanceName(evolutionInstanceName);
  };

  const handleSaveApiKey = async () => {
    await onSaveApiKey(evolutionApiKey);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Evolution API</CardTitle>
        <CardDescription>
          Configurações de integração com a Evolution API para WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome da Instância Evolution */}
        <div>
          <Label htmlFor="evolution-instance-name">
            Nome da Instância Evolution
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="evolution-instance-name"
              placeholder="Digite o nome da instância (ex: minha-clinica-instance)"
              value={evolutionInstanceName}
              onChange={(e) => setEvolutionInstanceName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSaveInstanceName} 
              disabled={saving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Nome único da sua instância na Evolution API
          </p>
        </div>

        {/* API Key da Evolution */}
        <div>
          <Label htmlFor="evolution-api-key">
            API Key da Evolution
          </Label>
          <div className="flex gap-2 mt-2">
            <PasswordInput
              value={evolutionApiKey}
              onChange={setEvolutionApiKey}
              placeholder="Digite a API Key da Evolution"
              className="flex-1"
              label=""
              description=""
            />
            <Button 
              onClick={handleSaveApiKey} 
              disabled={savingApiKey}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              {savingApiKey ? 'Salvando...' : 'Salvar API Key'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Chave de autenticação para acesso à Evolution API
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
