
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
  const { buscarEstatisticasClinica } = useSupabaseAdmin();
  const [activeTab, setActiveTab] = useState('info');
  const [clinicaData, setClinicaData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalLeads: 0,
    leadsUltimos30Dias: 0,
    agendamentosUltimos30Dias: 0,
    taxaConversao: 0
  });
  const [loading, setLoading] = useState(true);

  // Carregar dados da clínica e estatísticas
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [clinicaInfo, estatisticas] = await Promise.all([
          buscarEstatisticasClinica(clinicaId),
          buscarEstatisticasClinica(clinicaId) // Buscar stats específicas se houver função separada
        ]);
        
        setClinicaData(clinicaInfo);
        setStats({
          totalLeads: estatisticas?.totalLeads || 0,
          leadsUltimos30Dias: estatisticas?.leadsUltimos30Dias || 0,
          agendamentosUltimos30Dias: estatisticas?.agendamentosUltimos30Dias || 0,
          taxaConversao: estatisticas?.taxaConversao || 0
        });
      } catch (error) {
        console.error('Erro ao carregar dados da clínica:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [clinicaId, buscarEstatisticasClinica]);

  const tabs = [
    { id: 'info', label: 'Informações', icon: Building2 },
    { id: 'ai', label: 'Inteligência Artificial', icon: Users },
    { id: 'stats', label: 'Estatísticas', icon: TrendingUp },
    { id: 'integrations', label: 'Integrações', icon: Calendar }
  ];

  if (loading) {
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
          <ClinicBasicInfo clinicaId={clinicaId} clinicaData={clinicaData} />
        )}

        {activeTab === 'ai' && (
          <div className="p-6">
            <AdminAISettingsSection clinicaId={clinicaId} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6">
            <ClinicStatsCards stats={stats} />
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="p-6 space-y-6">
            <EvolutionApiSettings clinicaId={clinicaId} clinicaData={clinicaData} />
            <AdminPromptSection clinicaId={clinicaId} />
          </div>
        )}
      </div>
    </div>
  );
};
