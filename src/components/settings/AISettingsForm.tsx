
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { useAISettings } from './ai/hooks/useAISettings';
import { AIActivationSection } from './ai/AIActivationSection';
import { AIOperatingModeSection } from './ai/AIOperatingModeSection';
import { AIBusinessHoursSection } from './ai/AIBusinessHoursSection';
import { AIPersonalitySection } from './ai/AIPersonalitySection';
import { useClinica } from '@/contexts/ClinicaContext';

/**
 * Formulário Principal de Configurações da Inteligência Artificial
 * 
 * Componente refatorado que orquestra todas as seções de configuração da IA.
 * Agora integrado com dados reais da clínica autenticada.
 * Utiliza o hook useAISettings para gerenciar estado e operações,
 * e delega a renderização das seções para componentes especializados.
 * 
 * Funcionalidades:
 * - Carregamento otimizado com valores padrão
 * - Salvamento de todas as configurações no Supabase
 * - Interface dividida em seções lógicas e focadas
 * - Tratamento de erro e estados de carregamento
 * - Integração com autenticação e dados reais da clínica
 */

export const AISettingsForm = () => {
  const { clinicaAtiva, isLoading: clinicaContextLoading, hasClinica, error: clinicaError } = useClinica();
  
  const {
    settings,
    updateSetting,
    handleSave,
    isLoading,
    error,
    isSaving,
    queryClient
  } = useAISettings();

  // Mostrar carregamento enquanto a clínica está sendo carregada
  if (clinicaContextLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da clínica...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se não conseguir carregar a clínica
  if (clinicaError || !hasClinica || !clinicaAtiva) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao carregar dados da clínica
          </h3>
          <p className="text-gray-600 mb-4">
            {clinicaError?.message || 'Não foi possível encontrar os dados da sua clínica. Verifique se você está logado corretamente.'}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver falha no carregamento das configurações
  if (error) {
    console.error('[AISettingsForm] Erro no carregamento:', error);
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-2">Erro ao carregar configurações da IA</p>
          <p className="text-sm text-gray-600 mb-4">{error.message}</p>
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
      {/* Informação da clínica ativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-1">Configurações para:</h4>
        <p className="text-blue-700">{clinicaAtiva.nome}</p>
        {clinicaAtiva.email && (
          <p className="text-sm text-blue-600">{clinicaAtiva.email}</p>
        )}
      </div>

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
