
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MessageSquare, Users, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { useAdminChatData } from '@/hooks/useAdminChatData';
import { AdminClinicDashboard } from './clinic-details/AdminClinicDashboard';
import { AdminClinicChat } from './clinic-details/AdminClinicChat';
import { ClinicBasicInfo } from './clinic-details/ClinicBasicInfo';
import { ClinicStatsCards } from './clinic-details/ClinicStatsCards';
import { ClinicQuickActions } from './clinic-details/ClinicQuickActions';
import { AdminAISettings } from './clinic-details/AdminAISettings';
import { EvolutionApiSettings } from './clinic-details/EvolutionApiSettings';
import { InstagramSettings } from './clinic-details/InstagramSettings';
import { ContactsTable } from '@/components/clients/ContactsTable';
import { AdminClinicLeadModal } from './AdminClinicLeadModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useTags } from '@/hooks/useTagsData';

/**
 * Página de detalhes de uma clínica específica para administradores
 * 
 * CORREÇÃO: Ajustado para trabalhar com os hooks corretos
 * e propriedades disponíveis no useSupabaseAdmin
 */
export const AdminClinicDetails = () => {
  const { id: clinicaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Estados locais
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<any>(null);
  const [clinicaDetails, setClinicaDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Hooks para dados
  const { 
    clinicas,
    loading: loadingAdmin,
    buscarClinicaPorId
  } = useSupabaseAdmin();
  
  const { 
    leads, 
    loading: loadingLeads 
  } = useAdminChatData(clinicaId || null);
  
  const { etapas = [] } = useSupabaseData();
  const { data: tags = [] } = useTags();

  // Carregar detalhes da clínica
  useEffect(() => {
    const carregarDetalhes = async () => {
      if (clinicaId) {
        setLoadingDetails(true);
        try {
          const detalhes = await buscarClinicaPorId(clinicaId);
          setClinicaDetails(detalhes);
        } catch (error) {
          console.error('Erro ao carregar detalhes da clínica:', error);
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    
    carregarDetalhes();
  }, [clinicaId, buscarClinicaPorId]);

  // Função para adicionar novo lead
  const handleAddLead = () => {
    console.log('🆕 [AdminClinicDetails] Abrindo modal para novo lead');
    setSelectedLeadForEdit(null);
    setIsLeadModalOpen(true);
  };

  // Função para editar lead existente
  const handleEditLead = (lead: any) => {
    console.log('✏️ [AdminClinicDetails] Editando lead:', lead.id);
    setSelectedLeadForEdit(lead);
    setIsLeadModalOpen(true);
  };

  // Função para abrir chat do lead
  const handleOpenChat = (lead: any) => {
    console.log('💬 [AdminClinicDetails] Abrindo chat do lead:', lead.id);
    setActiveTab('chat');
  };

  // Função para deletar lead
  const handleDeleteLead = async (leadId: string) => {
    console.log('🗑️ [AdminClinicDetails] Deletando lead:', leadId);
    // TODO: Implementar deleção via admin
  };

  if (!clinicaId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600">ID da clínica não encontrado</p>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel Admin
          </Button>
        </div>
      </div>
    );
  }

  if (loadingDetails || loadingAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>Carregando detalhes da clínica...</p>
        </div>
      </div>
    );
  }

  if (!clinicaDetails) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600">Clínica não encontrada</p>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Painel
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {clinicaDetails.nome}
              </h1>
              <p className="text-gray-600">
                Gerenciamento completo da clínica
              </p>
            </div>
          </div>
          
          <Button onClick={handleAddLead} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Lead
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <ClinicStatsCards 
          clinica={clinicaDetails}
          leadsStats={{
            leadsDeAnuncios: leads.filter(lead => lead.ad_name).length,
            totalLeads: leads.length
          }}
          loadingStats={loadingLeads}
        />

        {/* Informações básicas e ações rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClinicBasicInfo clinica={clinicaDetails} />
          </div>
          <div>
            <ClinicQuickActions 
              clinicaId={clinicaId}
              clinicaNome={clinicaDetails.nome}
            />
          </div>
        </div>

        {/* Abas principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="ai-settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              IA
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <AdminClinicDashboard clinicaId={clinicaId} />
          </TabsContent>

          <TabsContent value="leads" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Leads da Clínica</CardTitle>
                  <Button onClick={handleAddLead} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Lead
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLeads ? (
                  <div className="text-center py-8">
                    <p>Carregando leads...</p>
                  </div>
                ) : leads.length > 0 ? (
                  <ContactsTable
                    leads={leads}
                    tags={tags}
                    sortField="created_at"
                    sortOrder="desc"
                    onSort={() => {}}
                    onEdit={handleEditLead}
                    onChat={handleOpenChat}
                    onDelete={handleDeleteLead}
                    isDeleting={false}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum lead encontrado para esta clínica</p>
                    <Button onClick={handleAddLead} className="mt-4" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Lead
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <AdminClinicChat clinicaId={clinicaId} />
          </TabsContent>

          <TabsContent value="ai-settings" className="mt-6">
            <AdminAISettings clinicaId={clinicaId} />
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <div className="space-y-6">
              <EvolutionApiSettings 
                clinica={clinicaDetails}
                onSaveInstanceName={() => {}}
                onSaveApiKey={() => {}}
                saving={false}
                savingApiKey={false}
              />
              <InstagramSettings 
                clinica={clinicaDetails}
                onSave={() => {}}
                saving={false}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de Lead */}
        {clinicaId && (
          <AdminClinicLeadModal
            isOpen={isLeadModalOpen}
            onClose={() => {
              setIsLeadModalOpen(false);
              setSelectedLeadForEdit(null);
            }}
            lead={selectedLeadForEdit}
            targetClinicaId={clinicaId}
            etapas={etapas}
          />
        )}
      </div>
    </div>
  );
};
