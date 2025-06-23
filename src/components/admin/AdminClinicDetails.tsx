import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicStatsCards } from './clinic-details/ClinicStatsCards';
import { ClinicBasicInfo } from './clinic-details/ClinicBasicInfo';
import { ClinicQuickActions } from './clinic-details/ClinicQuickActions';
import { AdminClinicDashboard } from './clinic-details/AdminClinicDashboard';
import { AdminClinicChat } from './clinic-details/AdminClinicChat';
import { AdminAISettings } from './clinic-details/AdminAISettings';
import { EvolutionApiSettings } from './clinic-details/EvolutionApiSettings';
import { InstagramSettings } from './clinic-details/InstagramSettings';

/**
 * Componente de detalhes de uma clínica específica no painel administrativo
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Melhor tratamento de erro na busca da clínica
 * - Logs detalhados para debug
 * - Estados de loading e erro mais robustos
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
  const [error, setError] = useState<string | null>(null);

  // Carregar detalhes da clínica ao montar o componente
  useEffect(() => {
    const carregarDados = async () => {
      if (!clinicaId) {
        setError('ID da clínica não fornecido');
        setLoadingStats(false);
        return;
      }
      
      try {
        console.log(`🔄 [AdminClinicDetails] Carregando dados da clínica: ${clinicaId}`);
        setLoadingStats(true);
        setError(null);
        
        // Verificar se é admin primeiro
        if (!adminHook.isAdmin && !adminHook.adminCheckLoading) {
          throw new Error('Acesso negado: usuário não é administrador');
        }

        // Aguardar verificação de admin se ainda estiver carregando
        if (adminHook.adminCheckLoading) {
          console.log('⏳ [AdminClinicDetails] Aguardando verificação de admin...');
          return;
        }
        
        // Buscar dados da clínica
        console.log('🏥 [AdminClinicDetails] Buscando dados da clínica...');
        const clinicaData = await adminHook.buscarClinicaPorId(clinicaId);
        
        if (!clinicaData) {
          throw new Error('Clínica não encontrada no sistema');
        }
        
        setClinica(clinicaData);
        console.log('✅ [AdminClinicDetails] Dados da clínica carregados:', clinicaData.nome);
        
        // Buscar estatísticas de leads
        console.log('📊 [AdminClinicDetails] Buscando estatísticas...');
        const stats = await adminHook.buscarEstatisticasDeLeadsDaClinica(clinicaId);
        setLeadsStats(stats);
        console.log('✅ [AdminClinicDetails] Estatísticas carregadas:', stats);
        
      } catch (error: any) {
        console.error('❌ [AdminClinicDetails] Erro ao carregar dados:', error);
        setError(error.message || 'Erro desconhecido ao carregar dados da clínica');
        setClinica(null);
        setLeadsStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    carregarDados();
  }, [clinicaId, adminHook.isAdmin, adminHook.adminCheckLoading]);

  // Handlers para ações
  const handleOpenChat = () => {
    setActiveTab('chat');
  };

  const handleAddLead = () => {
    console.log('Adicionar lead para clínica:', clinicaId);
  };

  // Estados de loading e erro
  if (adminHook.adminCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!adminHook.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar o painel administrativo.</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  if (loadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da clínica...</p>
        </div>
      </div>
    );
  }

  if (error || !clinica) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Clínica não encontrada</h2>
          <p className="text-gray-600 mb-4">
            {error || 'A clínica solicitada não existe ou você não tem permissão para acessá-la.'}
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate('/admin')} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Painel
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="ghost" 
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </div>
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
            loadingStats={false}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="ai">IA</TabsTrigger>
            <TabsTrigger value="evolution">Evolution</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminClinicDashboard clinicaId={clinica.id} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <AdminClinicChat clinicaId={clinica.id} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AdminAISettings clinicaId={clinica.id} />
          </TabsContent>

          <TabsContent value="evolution" className="space-y-6">
            <EvolutionApiSettings 
              clinicaId={clinica.id}
              currentInstanceName={clinica.evolution_instance_name || ''} // ✅ Valor padrão
              onSave={async (instanceName) => {
                console.log('Salvando instance name:', instanceName);
              }}
            />
          </TabsContent>

          <TabsContent value="instagram" className="space-y-6">
            <InstagramSettings 
              clinicaId={clinica.id}
              currentUserHandle={clinica.instagram_user_handle}
              onSave={async (userHandle) => {
                console.log('Salvando configurações Instagram:', userHandle);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};