
import { AISettingsForm } from '@/components/settings/AISettingsForm';

/**
 * Página de Configurações da Inteligência Artificial
 * 
 * Permite que as clínicas configurem o comportamento e funcionalidades
 * da IA integrada ao sistema, incluindo horários de funcionamento,
 * prompts personalizados e outras configurações específicas.
 */
const ConfiguracoesIAPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho da página */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🤖</span>
          </div>
          Configurações da Inteligência Artificial
        </h1>
        <p className="text-gray-600 mt-2">
          Configure como a IA deve se comportar e interagir com seus leads e pacientes.
        </p>
      </div>

      {/* Formulário de configurações */}
      <AISettingsForm />
    </div>
  );
};

export default ConfiguracoesIAPage;
