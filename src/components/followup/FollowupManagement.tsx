
import { useState } from 'react';
import { Plus, Settings, Play, Pause, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useFollowupCampaigns, 
  useCreateFollowupCampaign 
} from '@/hooks/useFollowupData';

/**
 * Componente de Gestão de Follow-up
 * 
 * O que faz:
 * - Interface principal para gerenciar campanhas de follow-up
 * - Permite criar, editar e ativar/desativar campanhas
 * - Mostra métricas de performance de cada campanha
 * - Configura templates e sequências de mensagens
 * 
 * Onde é usado:
 * - Página dedicada de follow-up no menu de configurações
 * - Modal de configuração rápida no painel administrativo
 * 
 * Como se conecta:
 * - Usa useFollowupCampaigns para listar campanhas existentes
 * - Integra com useCreateFollowupCampaign para criar novas
 * - Conecta com Edge Functions para processamento automático
 */

export const FollowupManagement = () => {
  const [selectedTab, setSelectedTab] = useState<'campaigns' | 'templates' | 'metrics'>('campaigns');

  // Hooks para dados
  const { data: campaigns = [], isLoading: campaignsLoading } = useFollowupCampaigns();
  const createCampaign = useCreateFollowupCampaign();

  // Separar campanhas por tipo
  const automaticCampaigns = campaigns.filter(c => c.tipo === 'automatico');
  const manualCampaigns = campaigns.filter(c => c.tipo === 'manual');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Follow-up</h1>
          <p className="text-gray-600 mt-1">
            Configure campanhas automáticas e manuais para manter contato com seus leads
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Tabs de Navegação */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('campaigns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'campaigns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campanhas ({campaigns.length})
          </button>
          <button
            onClick={() => setSelectedTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setSelectedTab('metrics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Métricas
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {selectedTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Campanhas Automáticas */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Campanhas Automáticas
              </h2>
              <Badge variant="secondary">{automaticCampaigns.length}</Badge>
            </div>

            {automaticCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {automaticCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{campaign.nome}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {campaign.descricao || 'Sem descrição'}
                          </p>
                        </div>
                        <Badge 
                          variant={campaign.ativo ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {campaign.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Inatividade:</span>
                          <span className="font-medium">
                            {campaign.dias_inatividade} dias
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Horário:</span>
                          <span className="font-medium">
                            {campaign.horario_envio || '09:00'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Dias úteis:</span>
                          <span className="font-medium">
                            {campaign.apenas_dias_uteis ? 'Sim' : 'Não'}
                          </span>
                        </div>

                        <Separator />

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-1">
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 gap-1">
                            <Settings className="w-3 h-3" />
                            Templates
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="p-2"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Play className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma campanha automática
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    Crie campanhas automáticas para engajar leads inativos automaticamente
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Campanha Automática
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Campanhas Manuais */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Campanhas Manuais
              </h2>
              <Badge variant="secondary">{manualCampaigns.length}</Badge>
            </div>

            {manualCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {manualCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{campaign.nome}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {campaign.descricao || 'Sem descrição'}
                          </p>
                        </div>
                        <Badge 
                          variant={campaign.ativo ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {campaign.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                          Disponível para envio manual nos cards dos leads
                        </div>

                        <Separator />

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-1">
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 gap-1">
                            <Settings className="w-3 h-3" />
                            Templates
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="p-2"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma campanha manual
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    Crie campanhas manuais para ter templates prontos para envio rápido
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Campanha Manual
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'templates' && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Gestão de Templates
          </h3>
          <p className="text-gray-600">
            Em desenvolvimento - Interface para gerenciar templates de mensagens
          </p>
        </div>
      )}

      {selectedTab === 'metrics' && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Métricas de Follow-up
          </h3>
          <p className="text-gray-600">
            Em desenvolvimento - Dashboard com métricas de performance
          </p>
        </div>
      )}
    </div>
  );
};
