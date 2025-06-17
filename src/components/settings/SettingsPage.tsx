
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ClinicServicesManager } from './ClinicServicesManager';
import { BusinessHoursSettings } from './BusinessHoursSettings';
import { AISettingsForm } from './AISettingsForm';
import { TagManager } from '@/components/tags/TagManager';
import { useClinica } from '@/contexts/ClinicaContext';
import { useUpdateClinica } from '@/hooks/useClinicaOperations';

/**
 * Página de configurações da clínica
 * 
 * Permite ao usuário configurar:
 * - Dados básicos da clínica
 * - Gerenciamento de serviços
 * - Horários de funcionamento
 * - Configurações de IA
 * - Gerenciamento de tags
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações da Clínica</h1>
        <p className="text-gray-600 mt-1">
          Gerencie as configurações gerais da sua clínica
        </p>
      </div>

      {/* Dados Básicos da Clínica */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dados Básicos</CardTitle>
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome da Clínica</Label>
              <Input
                id="nome"
                value={editedData.nome}
                onChange={(e) => setEditedData(prev => ({ ...prev, nome: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="razao_social">Razão Social</Label>
              <Input
                id="razao_social"
                value={editedData.razao_social}
                onChange={(e) => setEditedData(prev => ({ ...prev, razao_social: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editedData.email}
                onChange={(e) => setEditedData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={editedData.telefone}
                onChange={(e) => setEditedData(prev => ({ ...prev, telefone: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={editedData.cnpj}
                onChange={(e) => setEditedData(prev => ({ ...prev, cnpj: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={editedData.endereco}
                onChange={(e) => setEditedData(prev => ({ ...prev, endereco: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={editedData.cidade}
                  onChange={(e) => setEditedData(prev => ({ ...prev, cidade: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={editedData.estado}
                  onChange={(e) => setEditedData(prev => ({ ...prev, estado: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={editedData.cep}
                  onChange={(e) => setEditedData(prev => ({ ...prev, cep: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={editedData.complemento}
                onChange={(e) => setEditedData(prev => ({ ...prev, complemento: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Serviços */}
      <ClinicServicesManager />

      {/* Horários de Funcionamento */}
      <BusinessHoursSettings clinicaId={clinicaAtiva.id} />

      {/* Configurações de IA */}
      <AISettingsForm />

      {/* Gerenciamento de Tags */}
      <TagManager />
    </div>
  );
};
