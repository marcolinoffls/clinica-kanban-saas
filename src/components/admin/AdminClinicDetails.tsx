
import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Users, TrendingUp, Calendar } from 'lucide-react';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { ClinicBasicInfo } from './clinic-details/ClinicBasicInfo';
import { ClinicStatsCards } from './clinic-details/ClinicStatsCards';
import { EvolutionApiSettings } from './clinic-details/EvolutionApiSettings';
import { AdminPromptSection } from './clinic-details/AdminPromptSection';
import { AdminAISettingsSection } from './AdminAISettingsSection';

/**
 * Componente de Detalhes da Clínica no Painel Administrativo
 * 
 * Exibe informações detalhadas de uma clínica específica, incluindo:
 * - Informações básicas (nome, contato, etc.)
 * - Estatísticas de leads e agendamentos
 * - Configurações da Evolution API
 * - Prompt administrativo personalizado
 * - Configurações de IA (NOVA SEÇÃO)
 */

interface AdminClinicDetailsProps {
  clinicaId: string;
  onBack: () => void;
}

export const AdminClinicDetails = ({ clinicaId, onBack }: AdminClinicDetailsProps) => {
  const { 
    buscarEstatisticasClinica,
    atualizarPromptClinica,
    atualizarNomeInstanciaEvolution,
    atualizarApiKeyEvolution,
    loading
  } = useSupabaseAdmin();
  
  const [activeTab, setActiveTab] = useState('info');
  const [clinicaData, setClinicaData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Carregar dados da clínica
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoadingData(true);
        const dados = await buscarEstatisticasClinica(clinicaId);
        setClinicaData(dados);
      } catch (error) {
        console.error('Erro ao carregar dados da clínica:', error);
      } finally {
        setLoadingData(false);
      }
    };

    carregarDados();
  }, [clinicaId, buscarEstatisticasClinica]);

  // Função para salvar prompt administrativo
  const handleSavePrompt = async (prompt: string) => {
    try {
      setSaving(true);
      await atualizarPromptClinica(clinicaId, prompt);
      setClinicaData((prev: any) => ({ ...prev, admin_prompt: prompt }));
    } catch (error) {
      console.error('Erro ao salvar prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar nome da instância Evolution
  const handleSaveInstanceName = async (instanceName: string) => {
    try {
      setSaving(true);
      await atualizarNomeInstanciaEvolution(clinicaId, instanceName);
      setClinicaData((prev: any) => ({ ...prev, evolution_instance_name: instanceName }));
    } catch (error) {
      console.error('Erro ao salvar nome da instância:', error);
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar API Key da Evolution
  const handleSaveApiKey = async (apiKey: string) => {
    try {
      setSavingApiKey(true);
      await atualizarApiKeyEvolution(clinicaId, apiKey);
    } catch (error) {
      console.error('Erro ao salvar API Key:', error);
    } finally {
      setSavingApiKey(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Informações', icon: Building2 },
    { id: 'ai', label: 'Inteligência Artificial', icon: Users },
    { id: 'stats', label: 'Estatísticas', icon: TrendingUp },
    { id: 'integrations', label: 'Integrações', icon: Calendar }
  ];

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da clínica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de voltar */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar para o painel
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {clinicaData?.nome || 'Carregando...'}
          </h2>
          <p className="text-gray-600">Gerenciamento detalhado da clínica</p>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das abas */}
      <div className="bg-white rounded-lg">
        {activeTab === 'info' && (
          <ClinicBasicInfo clinica={clinicaData} />
        )}

        {activeTab === 'ai' && (
          <div className="p-6">
            <AdminAISettingsSection clinicaId={clinicaId} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6">
            <ClinicStatsCards clinica={clinicaData} />
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="p-6 space-y-6">
            <EvolutionApiSettings 
              clinica={clinicaData}
              onSaveInstanceName={handleSaveInstanceName}
              onSaveApiKey={handleSaveApiKey}
              saving={saving}
              savingApiKey={savingApiKey}
            />
            <AdminPromptSection 
              clinica={clinicaData}
              onSave={handleSavePrompt}
              saving={saving}
            />
          </div>
        )}
      </div>
    </div>
  );
};
