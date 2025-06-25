
/**
 * Componente de Configurações de Anúncios Personalizados
 * 
 * O que faz:
 * - Permite configurar anúncios personalizados para identificação automática de leads
 * - Gerencia frases personalizadas, origens e nomes dos anúncios
 * - Interface para criar, editar, deletar e ativar/desativar anúncios
 * 
 * Onde é usado no app:
 * - Na página de detalhes da clínica no painel administrativo
 * - Aba "Anúncios Personalizados" junto com outras configurações
 * 
 * Como se conecta com outras partes:
 * - useCustomAds hook para operações CRUD
 * - Sistema de webhook para integração com n8n
 * - LeadInfoSidebar mostra anúncios detectados
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Plus, Edit, Trash2, Megaphone, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useCustomAds, CustomAd, CreateCustomAdData } from '@/hooks/useCustomAds';

interface CustomAdsSettingsProps {
  clinica: {
    id: string;
    nome: string;
  };
}

// Origens padrão disponíveis para seleção
const DEFAULT_SOURCES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'direct', label: 'Direct (Instagram)' },
  { value: 'google', label: 'Google Ads' },
];

export const CustomAdsSettings = ({ clinica }: CustomAdsSettingsProps) => {
  const { toast } = useToast();
  
  // Hook para gerenciar anúncios personalizados
  const {
    customAds,
    isLoading,
    createCustomAd,
    updateCustomAd,
    deleteCustomAd,
    toggleActiveStatus,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling
  } = useCustomAds(clinica.id);

  // Estados do formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<CustomAd | null>(null);
  const [formData, setFormData] = useState<CreateCustomAdData>({
    ad_name: '',
    ad_phrase: '',
    ad_source: 'whatsapp',
    active: true
  });
  const [customSource, setCustomSource] = useState('');
  const [showCustomSource, setShowCustomSource] = useState(false);

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      ad_name: '',
      ad_phrase: '',
      ad_source: 'whatsapp',
      active: true
    });
    setCustomSource('');
    setShowCustomSource(false);
    setEditingAd(null);
    setIsFormOpen(false);
  };

  // Abrir formulário para criar novo anúncio
  const handleCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Abrir formulário para editar anúncio existente
  const handleEdit = (ad: CustomAd) => {
    setEditingAd(ad);
    setFormData({
      ad_name: ad.ad_name,
      ad_phrase: ad.ad_phrase,
      ad_source: ad.ad_source,
      active: ad.active
    });
    
    // Verificar se é origem customizada
    const isCustomSource = !DEFAULT_SOURCES.some(source => source.value === ad.ad_source);
    if (isCustomSource) {
      setCustomSource(ad.ad_source);
      setShowCustomSource(true);
      setFormData(prev => ({ ...prev, ad_source: 'custom' }));
    }
    
    setIsFormOpen(true);
  };

  // Salvar anúncio (criar ou atualizar)
  const handleSave = async () => {
    try {
      // Validações
      if (!formData.ad_name.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome do anúncio é obrigatório.',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.ad_phrase.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Frase personalizada é obrigatória.',
          variant: 'destructive',
        });
        return;
      }

      if (showCustomSource && !customSource.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Origem personalizada é obrigatória.',
          variant: 'destructive',
        });
        return;
      }

      // Preparar dados para salvar
      const dataToSave: CreateCustomAdData = {
        ...formData,
        ad_source: showCustomSource ? customSource.trim() : formData.ad_source
      };

      // Criar ou atualizar
      if (editingAd) {
        await updateCustomAd(editingAd.id, dataToSave);
      } else {
        await createCustomAd(dataToSave);
      }

      // Fechar formulário em caso de sucesso
      resetForm();
    } catch (error) {
      // Erro já tratado no hook
      console.error('Erro ao salvar anúncio:', error);
    }
  };

  // Deletar anúncio com confirmação
  const handleDelete = async (ad: CustomAd) => {
    if (!confirm(`Tem certeza que deseja deletar o anúncio "${ad.ad_name}"?`)) {
      return;
    }

    try {
      await deleteCustomAd(ad.id);
    } catch (error) {
      // Erro já tratado no hook
      console.error('Erro ao deletar anúncio:', error);
    }
  };

  // Alternar status ativo/inativo
  const handleToggleActive = async (ad: CustomAd) => {
    try {
      await toggleActiveStatus(ad.id, !ad.active);
    } catch (error) {
      // Erro já tratado no hook
      console.error('Erro ao alterar status:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <CardTitle>Anúncios Personalizados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-gray-600">Carregando anúncios...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          <CardTitle>Anúncios Personalizados</CardTitle>
        </div>
        <CardDescription>
          Configure frases e origens personalizadas para identificação automática de leads vindos de anúncios.
          Essas configurações são usadas pelo sistema de webhook para contabilização no n8n.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Botão para adicionar novo anúncio */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Anúncios Configurados ({customAds.length})</h3>
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Anúncio
          </Button>
        </div>

        {/* Lista de anúncios existentes */}
        {customAds.length > 0 ? (
          <div className="space-y-3">
            {customAds.map((ad) => (
              <div
                key={ad.id}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{ad.ad_name}</h4>
                      <Badge variant={ad.active ? 'default' : 'secondary'}>
                        {ad.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">{ad.ad_source}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Frase:</strong> "{ad.ad_phrase}"
                    </p>
                    <p className="text-xs text-gray-500">
                      Criado em: {new Date(ad.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={ad.active}
                      onCheckedChange={() => handleToggleActive(ad)}
                      disabled={isToggling}
                    />
                    <Button
                      onClick={() => handleEdit(ad)}
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(ad)}
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Nenhum anúncio configurado ainda</p>
            <p className="text-sm text-gray-500">
              Crie seu primeiro anúncio personalizado para começar a identificar leads automaticamente.
            </p>
          </div>
        )}

        {/* Formulário para criar/editar anúncio */}
        {isFormOpen && (
          <div className="border rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {editingAd ? 'Editar Anúncio' : 'Novo Anúncio'}
              </h3>
              <Button onClick={resetForm} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Nome do anúncio */}
              <div>
                <Label htmlFor="ad-name">Nome do Anúncio *</Label>
                <Input
                  id="ad-name"
                  placeholder="Ex: Campanha Verão 2024"
                  value={formData.ad_name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ad_name: e.target.value
                  }))}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Nome para identificar o anúncio internamente
                </p>
              </div>

              {/* Frase personalizada */}
              <div>
                <Label htmlFor="ad-phrase">Frase Personalizada *</Label>
                <Textarea
                  id="ad-phrase"
                  placeholder="Ex: Olá, vim do anúncio e gostaria de mais informações"
                  value={formData.ad_phrase}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ad_phrase: e.target.value
                  }))}
                  rows={3}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Frase que identifica leads vindos deste anúncio
                </p>
              </div>

              {/* Origem do anúncio */}
              <div>
                <Label htmlFor="ad-source">Origem do Anúncio *</Label>
                <Select
                  value={showCustomSource ? 'custom' : formData.ad_source}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setShowCustomSource(true);
                      setFormData(prev => ({ ...prev, ad_source: 'custom' }));
                    } else {
                      setShowCustomSource(false);
                      setFormData(prev => ({ ...prev, ad_source: value }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">+ Adicionar nova origem</SelectItem>
                  </SelectContent>
                </Select>

                {/* Campo para origem personalizada */}
                {showCustomSource && (
                  <div className="mt-2">
                    <Input
                      placeholder="Digite a origem personalizada"
                      value={customSource}
                      onChange={(e) => setCustomSource(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Status ativo */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    active: checked
                  }))}
                />
                <Label htmlFor="active">Anúncio ativo para detecção</Label>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={resetForm} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {editingAd ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingAd ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Informações sobre integração */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Como funciona:</strong> O sistema identifica automaticamente leads vindos de anúncios
            comparando mensagens recebidas com as frases configuradas. Os dados são enviados via webhook
            para integração com n8n e contabilização de performance.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
