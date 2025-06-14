import { useState, useEffect } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { useToast } from '@/hooks/use-toast';
import { ClinicStatsCards } from './clinic-details/ClinicStatsCards';
import { ClinicBasicInfo } from './clinic-details/ClinicBasicInfo';
import { AdminPromptSection } from './clinic-details/AdminPromptSection';
import { EvolutionApiSettings } from './clinic-details/EvolutionApiSettings';
import { InstagramSettings } from './clinic-details/InstagramSettings';
import { TimeRangeFilter } from './TimeRangeFilter';
import { endOfDay, startOfDay, subDays } from 'date-fns';

/**
 * Componente principal de detalhes da clínica no painel administrativo
 * 
 * Coordena todos os componentes de detalhes da clínica:
 * - Estatísticas e métricas da clínica
 * - Informações básicas de contato
 * - Configuração do prompt administrativo
 * - Configurações da Evolution API
 * - Configurações do Instagram
 * 
 * Este componente foi refatorado em componentes menores para
 * melhor organização e manutenibilidade do código.
 */

interface AdminClinicDetailsProps {
  clinicaId: string;
  onBack: () => void;
}

export const AdminClinicDetails = ({ clinicaId, onBack }: AdminClinicDetailsProps) => {
  const {
    buscarDetalhesClinica,
    atualizarPromptClinica,
    atualizarNomeInstanciaEvolution,
    atualizarApiKeyEvolution,
    atualizarInstagramUserHandle,
    buscarEstatisticasDeLeadsDaClinica,
  } = useSupabaseAdmin();

  const { toast } = useToast();

  const [clinica, setClinica] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [savingInstagram, setSavingInstagram] = useState(false);

  // Estados para o filtro de tempo e estatísticas de leads
  const [currentFilter, setCurrentFilter] = useState('Últimos 30 Dias');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [leadStats, setLeadStats] = useState({ leadsDeAnuncios: 0, outrosLeads: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Carregar dados da clínica ao inicializar
  useEffect(() => {
    const carregarDetalhes = async () => {
      try {
        setLoading(true);
        const dados = await buscarDetalhesClinica(clinicaId);
        setClinica(dados);
      } catch (error) {
        console.error('Erro ao carregar detalhes da clínica:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da clínica.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    carregarDetalhes();

    // Define o filtro de tempo inicial para "Últimos 30 dias"
    const today = new Date();
    const start = startOfDay(subDays(today, 29));
    const end = endOfDay(today);
    setStartDate(start);
    setEndDate(end);
  }, [clinicaId]);

  // Carrega as estatísticas de leads sempre que a data ou a clínica mudar
  useEffect(() => {
    if (clinicaId && startDate && endDate) {
      const carregarStats = async () => {
        setLoadingStats(true);
        const stats = await buscarEstatisticasDeLeadsDaClinica(clinicaId, startDate, endDate);
        setLeadStats(stats);
        setLoadingStats(false);
      };
      carregarStats();
    }
  }, [clinicaId, startDate, endDate]);

  // Função para lidar com a mudança do filtro de tempo
  const handleFilterChange = (start: Date, end: Date, filterName: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentFilter(filterName);
  };

  // Função para salvar o prompt administrativo
  const salvarPrompt = async (prompt: string) => {
    try {
      setSaving(true);
      await atualizarPromptClinica(clinicaId, prompt);
      
      toast({
        title: "Sucesso",
        description: "Prompt administrativo salvo com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar prompt:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o prompt administrativo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar o nome da instância Evolution
  const salvarEvolutionInstanceName = async (instanceName: string) => {
    try {
      setSaving(true);
      await atualizarNomeInstanciaEvolution(clinicaId, instanceName);
      
      toast({
        title: "Sucesso",
        description: "Nome da instância Evolution salvo com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar nome da instância:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o nome da instância.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar a API Key da Evolution
  const salvarEvolutionApiKey = async (apiKey: string) => {
    try {
      setSavingApiKey(true);
      await atualizarApiKeyEvolution(clinicaId, apiKey);
      
      toast({
        title: "Sucesso",
        description: "API Key da Evolution salva com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar API Key:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a API Key.",
        variant: "destructive",
      });
    } finally {
      setSavingApiKey(false);
    }
  };

  // Função para salvar o user handle do Instagram
  const salvarInstagramUserHandle = async (userHandle: string) => {
    try {
      setSavingInstagram(true);
      await atualizarInstagramUserHandle(clinicaId, userHandle);
      
      // Atualiza o estado local 'clinica' para refletir a mudança imediatamente na UI,
      // sem precisar recarregar os dados do banco.
      setClinica((prev: any) => ({ ...prev, instagram_user_handle: userHandle }));
      
      toast({
        title: "Sucesso",
        description: "Usuário do Instagram salvo com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar usuário do Instagram:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o usuário do Instagram.",
        variant: "destructive",
      });
    } finally {
      setSavingInstagram(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!clinica) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button onClick={onBack} variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="text-center py-12">
            <p className="text-gray-500">Clínica não encontrada.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header com botão de voltar */}
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Lista de Clínicas
          </Button>
          
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {clinica.nome}
              </h1>
              <p className="text-gray-600">
                Detalhes e configurações administrativas
              </p>
            </div>
          </div>
        </div>

        {/* Filtro de Tempo */}
        <div className="my-8">
            <TimeRangeFilter onFilterChange={handleFilterChange} currentFilter={currentFilter} />
        </div>

        {/* Cards com estatísticas da clínica */}
        <div className="mb-8">
          <ClinicStatsCards clinica={clinica} leadsStats={leadStats} loadingStats={loadingStats}/>
        </div>

        {/* Informações básicas da clínica */}
        <div className="mb-6">
          <ClinicBasicInfo clinica={clinica} />
        </div>

        {/* Prompt Administrativo */}
        <div className="mb-6">
          <AdminPromptSection 
            clinica={clinica}
            onSave={salvarPrompt}
            saving={saving}
          />
        </div>

        {/* Configurações da Evolution API */}
        <EvolutionApiSettings 
          clinica={clinica}
          onSaveInstanceName={salvarEvolutionInstanceName}
          onSaveApiKey={salvarEvolutionApiKey}
          saving={saving}
          savingApiKey={savingApiKey}
        />

        {/* Configurações do Instagram */}
        <div className="mt-6">
          <InstagramSettings
            clinica={clinica}
            onSave={salvarInstagramUserHandle}
            saving={savingInstagram}
          />
        </div>
      </div>
    </div>
  );
};
