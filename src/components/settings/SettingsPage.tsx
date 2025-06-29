
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ClinicServicesManager } from './ClinicServicesManager';
import { BusinessHoursSettings } from './BusinessHoursSettings';
import { AISettingsForm } from './AISettingsForm';
import { TagManager } from '@/components/tags/TagManager';
import BillingPage from '@/components/billing/BillingPage';
import { useClinica } from '@/contexts/ClinicaContext';
import { useUpdateClinica } from '@/hooks/useClinicaOperations';
import { Building2, Clock, Stethoscope, Users, CreditCard } from 'lucide-react';

/**
 * Página de configurações da clínica com layout em abas aprimorado
 * 
 * Organizada em abas laterais com design moderno:
 * - Clínica: dados básicos da clínica
 * - Horário: horários de funcionamento  
 * - Serviços: gerenciamento de serviços/procedimentos
 * - Usuários: gerenciamento de usuários (placeholder)
 * - Planos e Cobrança: gestão de assinaturas e pagamentos
 */

export const SettingsPage = () => {
  // Estados locais para edição
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  
  // Dados da clínica do contexto (isolado por RLS)
  const { clinicaAtiva, isLoading: clinicaLoading } = useClinica();
  const updateClinicaMutation = useUpdateClinica();

  // Inicializar dados de edição quando a clínica carregar
  React.useEffect(() => {
    if (clinicaAtiva && !isEditing) {
      setEditedData({
        nome: clinicaAtiva.nome || '',
        razao_social: clinicaAtiva.razao_social || '',
        email: clinicaAtiva.email || '',
        telefone: clinicaAtiva.telefone || '',
        cnpj: clinicaAtiva.cnpj || '',
        endereco: clinicaAtiva.endereco || '',
        cidade: clinicaAtiva.cidade || '',
        estado: clinicaAtiva.estado || '',
        cep: clinicaAtiva.cep || '',
        complemento: clinicaAtiva.complemento || '',
      });
    }
  }, [clinicaAtiva, isEditing]);

  // Função para salvar alterações
  const handleSave = async () => {
    try {
      console.log('💾 Salvando dados da clínica:', editedData);
      
      if (!clinicaAtiva?.id) {
        toast.error('Erro: Dados da clínica não encontrados');
        return;
      }

      await updateClinicaMutation.mutateAsync({
        id: clinicaAtiva.id,
        ...editedData,
      });

      setIsEditing(false);
      toast.success('Dados da clínica atualizados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      toast.error('Erro ao salvar dados da clínica');
    }
  };

  // Função para cancelar edição
  const handleCancel = () => {
    if (clinicaAtiva) {
      setEditedData({
        nome: clinicaAtiva.nome || '',
        razao_social: clinicaAtiva.razao_social || '',
        email: clinicaAtiva.email || '',
        telefone: clinicaAtiva.telefone || '',
        cnpj: clinicaAtiva.cnpj || '',
        endereco: clinicaAtiva.endereco || '',
        cidade: clinicaAtiva.cidade || '',
        estado: clinicaAtiva.estado || '',
        cep: clinicaAtiva.cep || '',
        complemento: clinicaAtiva.complemento || '',
      });
    }
    setIsEditing(false);
  };

  if (clinicaLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!clinicaAtiva) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Erro: Dados da clínica não encontrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">
          Configure sua clínica e personalize o sistema
        </p>
      </div>

      {/* Layout com abas aprimorado */}
      <Tabs defaultValue="clinica" className="flex gap-8">
        {/* Navegação lateral com design aprimorado */}
        <div className="w-72 flex-shrink-0">
          <TabsList className="flex flex-col h-auto w-full p-2 bg-white border border-gray-200 shadow-sm rounded-xl">
            <TabsTrigger 
              value="clinica" 
              className="w-full justify-start gap-3 p-4 text-left data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 data-[state=active]:shadow-sm hover:bg-gray-50 transition-all duration-200 rounded-lg border border-transparent"
            >
              <Building2 size={20} className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Clínica</div>
                <div className="text-xs text-gray-500">Dados básicos</div>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="horario"
              className="w-full justify-start gap-3 p-4 text-left data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 data-[state=active]:shadow-sm hover:bg-gray-50 transition-all duration-200 rounded-lg border border-transparent"
            >
              <Clock size={20} className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Horário</div>
                <div className="text-xs text-gray-500">Funcionamento</div>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="servicos"
              className="w-full justify-start gap-3 p-4 text-left data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 data-[state=active]:shadow-sm hover:bg-gray-50 transition-all duration-200 rounded-lg border border-transparent"
            >
              <Stethoscope size={20} className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Serviços</div>
                <div className="text-xs text-gray-500">Procedimentos</div>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="usuarios"
              className="w-full justify-start gap-3 p-4 text-left data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 data-[state=active]:shadow-sm hover:bg-gray-50 transition-all duration-200 rounded-lg border border-transparent"
            >
              <Users size={20} className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Usuários</div>
                <div className="text-xs text-gray-500">Gerenciamento</div>
              </div>
            </TabsTrigger>

            <TabsTrigger 
              value="billing"
              className="w-full justify-start gap-3 p-4 text-left data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 data-[state=active]:shadow-sm hover:bg-gray-50 transition-all duration-200 rounded-lg border border-transparent"
            >
              <CreditCard size={20} className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Planos e Cobrança</div>
                <div className="text-xs text-gray-500">Assinaturas</div>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Conteúdo das abas */}
        <div className="flex-1">
          {/* Aba Clínica */}
          <TabsContent value="clinica" className="mt-0">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl">Informações da Clínica</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Gerencie os dados básicos da sua clínica
                  </p>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateClinicaMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateClinicaMutation.isPending}
                    >
                      {updateClinicaMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome da Clínica *</Label>
                    <Input
                      id="nome"
                      value={editedData.nome}
                      onChange={(e) => setEditedData(prev => ({ ...prev, nome: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Digite o nome da clínica"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={editedData.telefone}
                      onChange={(e) => setEditedData(prev => ({ ...prev, telefone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedData.email}
                    onChange={(e) => setEditedData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="contato@clinica.com"
                  />
                </div>

                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={editedData.endereco}
                    onChange={(e) => setEditedData(prev => ({ ...prev, endereco: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Rua, número"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={editedData.complemento}
                      onChange={(e) => setEditedData(prev => ({ ...prev, complemento: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Sala, andar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={editedData.cep}
                      onChange={(e) => setEditedData(prev => ({ ...prev, cep: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={editedData.cidade}
                      onChange={(e) => setEditedData(prev => ({ ...prev, cidade: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={editedData.estado}
                      onChange={(e) => setEditedData(prev => ({ ...prev, estado: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="UF"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={editedData.cnpj}
                      onChange={(e) => setEditedData(prev => ({ ...prev, cnpj: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="razao_social">Razão Social</Label>
                    <Input
                      id="razao_social"
                      value={editedData.razao_social}
                      onChange={(e) => setEditedData(prev => ({ ...prev, razao_social: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Razão social da empresa"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Horário */}
          <TabsContent value="horario" className="mt-0">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Horário de Funcionamento</CardTitle>
                <p className="text-sm text-gray-600">
                  Defina os horários em que sua clínica está aberta para atendimento.
                </p>
              </CardHeader>
              <CardContent>
                <BusinessHoursSettings clinicaId={clinicaAtiva.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Serviços */}
          <TabsContent value="servicos" className="mt-0">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Serviços da Clínica</CardTitle>
                <p className="text-sm text-gray-600">
                  Gerencie a lista de serviços e procedimentos oferecidos pela sua clínica.
                </p>
              </CardHeader>
              <CardContent>
                <ClinicServicesManager />
              
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Usuários */}
          <TabsContent value="usuarios" className="mt-0">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Gerenciamento de Usuários</CardTitle>
                <p className="text-sm text-gray-600">
                  Gerencie os usuários que têm acesso ao sistema da clínica.
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <Users size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gerenciamento de Usuários
                  </h3>
                  <p className="text-gray-600">
                    Esta funcionalidade estará disponível em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Planos e Cobrança */}
          <TabsContent value="billing" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm">
              <BillingPage />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
