
import { Bot } from 'lucide-react';
import { AISettingsForm } from '@/components/settings/AISettingsForm';

/**
 * Página de Configurações de Inteligência Artificial
 * 
 * Permite que administradores de clínicas configurem:
 * - Ativação automática da IA para leads
 * - Comportamento e personalização da IA
 * - Horários de funcionamento da IA
 * - Funcionalidades futuras relacionadas à IA
 * 
 * Esta página é acessível via rota /ia e possui item dedicado na sidebar
 */
const ConfiguracoesIAPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header da página */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Inteligência Artificial
            </h1>
          </div>
          <p className="text-gray-600">
            Configure o comportamento da IA para atendimento automatizado da sua clínica
          </p>
        </div>

        {/* Formulário de configurações */}
        <AISettingsForm />
      </div>
    </div>
  );
};

export default ConfiguracoesIAPage;
