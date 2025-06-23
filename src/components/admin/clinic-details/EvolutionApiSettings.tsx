import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Loader2 } from 'lucide-react';

interface EvolutionApiSettingsProps {
  clinicaId: string;
  currentInstanceName?: string; // ✅ CORREÇÃO: Tornar opcional
  onSave: (instanceName: string) => Promise<void>;
}

/**
 * 🔧 Componente para Configurações da Evolution API
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Props opcionais com valores padrão
 * - Proteção contra undefined
 * - Validação adequada de entrada
 */
export const EvolutionApiSettings = ({ 
  clinicaId, 
  currentInstanceName = '', // ✅ VALOR PADRÃO
  onSave 
}: EvolutionApiSettingsProps) => {
  const [instanceName, setInstanceName] = useState(currentInstanceName || ''); // ✅ PROTEÇÃO
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!instanceName.trim()) {
      alert('Por favor, insira um nome para a instância');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(instanceName.trim());
      console.log('✅ [EvolutionApiSettings] Instance name salvo com sucesso');
    } catch (error) {
      console.error('❌ [EvolutionApiSettings] Erro ao salvar:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <CardTitle>Configurações Evolution API</CardTitle>
        </div>
        <CardDescription>
          Configure a integração com a Evolution API para WhatsApp Business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Integração */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Status da Integração</Label>
            <p className="text-sm text-gray-600">
              Status atual da conexão com Evolution API
            </p>
          </div>
          <Badge variant={currentInstanceName ? 'default' : 'secondary'}>
            {currentInstanceName ? 'Configurado' : 'Não configurado'}
          </Badge>
        </div>

        {/* Nome da Instância */}
        <div className="space-y-2">
          <Label htmlFor="instanceName">Nome da Instância</Label>
          <Input
            id="instanceName"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="Digite o nome da instância Evolution API"
            disabled={isSaving}
          />
          <p className="text-sm text-gray-600">
            Nome único da instância na Evolution API para esta clínica
          </p>
        </div>

        {/* Instância Atual */}
        {currentInstanceName && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="text-sm font-medium text-blue-700">
              Instância Atual
            </Label>
            <p className="text-sm text-blue-600 font-mono">
              {currentInstanceName}
            </p>
          </div>
        )}

        {/* Botão Salvar */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !instanceName.trim()}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};