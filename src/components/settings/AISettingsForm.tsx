
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useAISettings } from './ai/hooks/useAISettings';
import { AIActivationSection } from './ai/AIActivationSection';
import { AIOperatingModeSection } from './ai/AIOperatingModeSection';
import { AIBusinessHoursSection } from './ai/AIBusinessHoursSection';
import { AIPersonalitySection } from './ai/AIPersonalitySection';

/**
 * Formulário Principal de Configurações da Inteligência Artificial
 * 
 * Componente refatorado que orquestra todas as seções de configuração da IA.
 * Utiliza o hook useAISettings para gerenciar estado e operações,
 * e delega a renderização das seções para componentes especializados.
 * 
 * Funcionalidades:
 * - Carregamento otimizado com valores padrão
 * - Salvamento de todas as configurações no Supabase
 * - Interface dividida em seções lógicas e focadas
 * - Tratamento de erro e estados de carregamento
 */

export const AISettingsForm = () => {
  const {
    settings,
    updateSetting,
    handleSave,
    isLoading,
    error,
    isSaving,
    queryClient
  } = useAISettings();

  // Mostrar erro se houver falha no carregamento
  if (error) {
    console.error('[AISettingsForm] Erro no carregamento:', error);
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar configurações da IA</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['clinica-ai-settings'] })}
            variant="outline"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicador de carregamento apenas quando necessário */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-gray-600">Carregando configurações...</span>
        </div>
      )}

      {/* Botão de salvar no topo */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Seções do formulário organizadas em componentes especializados */}
      <AIActivationSection 
        settings={settings} 
        updateSetting={updateSetting} 
      />

      <AIOperatingModeSection 
        settings={settings} 
        updateSetting={updateSetting} 
      />

      <AIBusinessHoursSection 
        settings={settings} 
        updateSetting={updateSetting} 
      />

      <AIPersonalitySection 
        settings={settings} 
        updateSetting={updateSetting} 
      />

      {/* Botão de salvar no final também */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};
