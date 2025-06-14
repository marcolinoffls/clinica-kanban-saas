
/**
 * Componente para gerenciar as configurações de IA de uma clínica específica no painel admin.
 *
 * O que faz:
 * - Utiliza o hook `useAISettings` para buscar e salvar as configurações da IA para a clínica selecionada.
 * - Reutiliza os mesmos componentes de seção (`AIActivationSection`, etc.) da página de configurações do usuário.
 * - Permite ao administrador configurar todos os aspectos da IA de uma clínica diretamente pelo painel.
 *
 * Onde é usado:
 * - Renderizado dentro do componente `AdminClinicDetails`.
 *
 * Como se conecta com outras partes:
 * - Recebe `clinicaId` como prop.
 * - Passa o `clinicaId` para o hook `useAISettings`.
 * - Passa os dados e funções de callback para os sub-componentes de configuração.
 */
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle, Bot } from 'lucide-react';
import { useAISettings } from '@/components/settings/ai/hooks/useAISettings';
import { AIActivationSection } from '@/components/settings/ai/AIActivationSection';
import { AIOperatingModeSection } from '@/components/settings/ai/AIOperatingModeSection';
import { AIBusinessHoursSection } from '@/components/settings/ai/AIBusinessHoursSection';
import { AIPersonalitySection } from '@/components/settings/ai/AIPersonalitySection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminAISettingsProps {
  clinicaId: string;
}

export const AdminAISettings = ({ clinicaId }: AdminAISettingsProps) => {
  // Utiliza o hook de configurações de IA, passando o ID da clínica para operar em modo de administrador.
  const {
    settings,
    updateSetting,
    handleSave,
    isLoading,
    error,
    isSaving,
    queryClient
  } = useAISettings(clinicaId);

  // Estado de carregamento enquanto busca as configurações da clínica.
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Inteligência Artificial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Carregando configurações da IA...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado de erro se não for possível carregar as configurações.
  if (error) {
    console.error('[AdminAISettings] Erro no carregamento:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Inteligência Artificial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-2">Erro ao carregar configurações da IA</p>
              <p className="text-sm text-gray-600 mb-4">{error.message}</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['clinica-ai-settings', clinicaId] })}
                variant="outline"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderiza o formulário completo com todas as seções de configuração da IA.
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-purple-600" />
          <CardTitle>Configurações de Inteligência Artificial</CardTitle>
        </div>
        <CardDescription>
          Gerencie o comportamento, horários e personalidade da IA para esta clínica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Botão de salvar no topo para acesso rápido */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações na IA
          </Button>
        </div>

        {/* Seções do formulário reutilizadas da página de configurações */}
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

        {/* Botão de salvar no final para conveniência */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações na IA
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
