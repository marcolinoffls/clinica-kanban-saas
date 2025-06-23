
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { ClinicBasicInfo } from './clinic-details/ClinicBasicInfo';
import { ClinicStatsCards } from './clinic-details/ClinicStatsCards';
import { ClinicQuickActions } from './clinic-details/ClinicQuickActions';
import { AdminClinicDashboard } from './clinic-details/AdminClinicDashboard';
import { AdminClinicChat } from './clinic-details/AdminClinicChat';
import { AdminAISettings } from './clinic-details/AdminAISettings';
import { EvolutionApiSettings } from './clinic-details/EvolutionApiSettings';
import { InstagramSettings } from './clinic-details/InstagramSettings';

/**
 * Componente de detalhes de uma clínica específica no painel administrativo
 * 
 * Este componente exibe informações completas sobre uma clínica específica,
 * incluindo estatísticas, configurações e dados de performance.
 */
export const AdminClinicDetails = () => {
  const { clinicaId } = useParams<{ clinicaId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Hook para dados administrativos
  const adminHook = useSupabaseAdmin();
  
  // Estados locais para dados específicos da clínica
  const [clinica, setClinica] = useState<any>(null);
  const [leadsStats, setLeadsStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Carregar detalhes da clínica ao montar o componente
  useEffect(() => {
    const carregarDados = async () => {
      if (!clinicaId) return;
      
      try {
        setLoadingStats(true);
        
        // Buscar dados da clínica
        const clinicaData = await adminHook.buscarClinicaPorId(clinicaId);
        setClinica(clinicaData);
        
        // Buscar estatísticas de leads
        const stats = await adminHook.buscarEstatisticasDeLeadsDaClinica(clinicaId);
        setLeadsStats(stats);
        
      } catch (error) {
        console.error('Erro ao carregar dados da clínica:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    carregarDados();
  }, [clinicaId]);

  // Handlers para ações
  const handleOpenChat = () => {
    setActiveTab('chat');
  };

  const handleAddLead = () => {
    // Implementar lógica para adicionar lead
    console.log('Adicionar lead para clínica:', clinicaId);
  };

  // Handlers para salvar configurações (implementação básica)
  const handleSaveInstanceName = async (instanceName: string) => {
    console.log('Salvando instance name:', instanceName);
  };

  const handleSaveApiKey = async (apiKey: string) => {
    console.log('Salvando API key:', apiKey);
  };

  const handleSaveInstagramSettings = async (userHandle: string) => {
    console.log('Salvando configurações Instagram:', userHandle);
  };

  if (adminHook.loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!clinica) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Clínica não encontrada</h2>
          <p className="text-gray-600 mb-4">A clínica solicitada não existe ou você não tem permissão para acessá-la.</p>
          <Button onClick={() => navigate('/admin')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/admin')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{clinica.nome}</h1>
                  <p className="text-sm text-gray-600">{clinica.email}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={clinica.status === 'ativo' ? 'default' : 'secondary'}>
                {clinica.status}
              </Badge>
              <Badge variant="outline">
                {clinica.plano_contratado}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ClinicStatsCards 
            clinica={clinica}
            leadsStats={leadsStats}
            loadingStats={loadingStats}
          />
        </div>

        {/* Informações básicas e ações rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ClinicBasicInfo clinica={clinica} />
          </div>
          <div>
            <ClinicQuickActions 
              clinicaId={clinica.id}
              onOpenChat={handleOpenChat}
              onAddLead={handleAddLead}
            />
          </div>
        </div>

        {/* Tabs de conteúdo detalhado */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <AdminClinicDashboard clinicaId={clinica.id} />
          </TabsContent>
          
          <TabsContent value="chat" className="mt-6">
            <AdminClinicChat clinicaId={clinica.id} />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <AdminAISettings clinicaId={clinica.id} />
            </div>
          </TabsContent>
          
          <TabsContent value="integrations" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EvolutionApiSettings 
                clinica={clinica}
                onSaveInstanceName={handleSaveInstanceName}
                onSaveApiKey={handleSaveApiKey}
                saving={false}
                savingApiKey={false}
              />
              <InstagramSettings 
                clinica={clinica}
                onSave={handleSaveInstagramSettings}
                saving={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
