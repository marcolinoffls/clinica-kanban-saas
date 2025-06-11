
import { AISettingsForm } from './AISettingsForm';

/**
 * Aba de Configurações de IA para a Página de Configurações Principal
 * 
 * Este componente encapsula o AISettingsForm para ser usado na
 * página principal de configurações (SettingsPage.tsx) como uma aba.
 * Permite que as configurações de IA sejam gerenciadas tanto pela
 * página dedicada (/ia) quanto pelo painel administrativo.
 */

export const AISettingsTab = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <p className="text-gray-600">
          Configure como a IA deve se comportar e interagir com seus leads e pacientes.
          Essas configurações também estão disponíveis na página dedicada de Inteligência Artificial.
        </p>
      </div>

      {/* Formulário de configurações da IA */}
      <AISettingsForm />
    </div>
  );
};
