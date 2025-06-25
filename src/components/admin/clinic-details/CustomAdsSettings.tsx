
import React, { useState } from 'react';
import { useCustomAds, CustomAd, CreateCustomAdData, UpdateCustomAdData } from '@/hooks/useCustomAds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

/**
 * Componente para gerenciar Anúncios Personalizados de uma clínica
 * 
 * Este componente permite que administradores configurem regras para identificar
 * automaticamente a origem de leads baseado em frases específicas encontradas
 * nas primeiras mensagens dos leads.
 * 
 * Funcionalidades:
 * - Listar todas as regras de anúncios da clínica
 * - Criar nova regra de anúncio
 * - Editar regra existente
 * - Ativar/desativar regra com switch
 * - Excluir regra de anúncio
 * 
 * Props:
 * - clinicaId: ID da clínica para buscar/gerenciar os anúncios
 * 
 * Utiliza o hook useCustomAds para comunicação com o banco de dados.
 */

interface CustomAdsSettingsProps {
  clinicaId: string;
}

// Opções pré-definidas para origem do anúncio
const AD_SOURCE_OPTIONS = [
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Direct (Instagram)', label: 'Direct (Instagram)' },
  { value: 'Google Ads', label: 'Google Ads' },
  { value: 'other', label: 'Outra (especificar)...' },
];

export const CustomAdsSettings: React.FC<CustomAdsSettingsProps> = ({ clinicaId }) => {
  const {
    customAds,
    isLoading,
    createCustomAd,
    updateCustomAd,
    deleteCustomAd,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCustomAds(clinicaId);

  // Estados do formulário
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<CustomAd | null>(null);
  const [formData, setFormData] = useState({
    ad_name: '',
    ad_phrase: '',
    ad_source: '',
    custom_source: '', // Para quando selecionar "Outra"
  });

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      ad_name: '',
      ad_phrase: '',
      ad_source: '',
      custom_source: '',
    });
    setEditingAd(null);
  };

  // Abrir modal para criar novo anúncio
  const handleCreateNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Abrir modal para editar anúncio existente
  const handleEdit = (ad: CustomAd) => {
    setEditingAd(ad);
    setFormData({
      ad_name: ad.ad_name,
      ad_phrase: ad.ad_phrase,
      ad_source: AD_SOURCE_OPTIONS.some(opt => opt.value === ad.ad_source) ? ad.ad_source : 'other',
      custom_source: AD_SOURCE_OPTIONS.some(opt => opt.value === ad.ad_source) ? '' : ad.ad_source,
    });
    setIsDialogOpen(true);
  };

  // Salvar anúncio (criar ou atualizar)
  const handleSave = () => {
    const finalSource = formData.ad_source === 'other' ? formData.custom_source : formData.ad_source;
    
    if (!formData.ad_name.trim() || !formData.ad_phrase.trim() || !finalSource.trim()) {
      return; // Validação básica
    }

    if (editingAd) {
      // Atualizar anúncio existente
      const updateData: UpdateCustomAdData = {
        ad_name: formData.ad_name.trim(),
        ad_phrase: formData.ad_phrase.trim(),
        ad_source: finalSource.trim(),
      };
      
      updateCustomAd({ id: editingAd.id, data: updateData });
    } else {
      // Criar novo anúncio
      const createData: CreateCustomAdData = {
        clinica_id: clinicaId,
        ad_name: formData.ad_name.trim(),
        ad_phrase: formData.ad_phrase.trim(),
        ad_source: finalSource.trim(),
        active: true,
      };
      
      createCustomAd(createData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  // Alternar status ativo/inativo
  const handleToggleActive = (ad: CustomAd) => {
    updateCustomAd({
      id: ad.id,
      data: { active: !ad.active }
    });
  };

  // Excluir anúncio
  const handleDelete = (id: string) => {
    deleteCustomAd(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando anúncios personalizados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Anúncios Personalizados</h2>
          <p className="text-gray-600">
            Configure regras para identificar automaticamente a origem dos leads
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Anúncio
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAd ? 'Editar Anúncio' : 'Novo Anúncio Personalizado'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Nome do Anúncio */}
              <div>
                <Label htmlFor="ad_name">Nome do Anúncio</Label>
                <Input
                  id="ad_name"
                  placeholder="Ex: Promoção Instagram Dezembro"
                  value={formData.ad_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, ad_name: e.target.value }))}
                />
              </div>

              {/* Frase de Ativação */}
              <div>
                <Label htmlFor="ad_phrase">Frase de Ativação</Label>
                <Textarea
                  id="ad_phrase"
                  placeholder="Ex: Olá, vim do anúncio do Instagram"
                  value={formData.ad_phrase}
                  onChange={(e) => setFormData(prev => ({ ...prev, ad_phrase: e.target.value }))}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Quando esta frase for encontrada na primeira mensagem do lead, a origem será automaticamente definida.
                </p>
              </div>

              {/* Origem do Anúncio */}
              <div>
                <Label htmlFor="ad_source">Origem do Anúncio</Label>
                <Select 
                  value={formData.ad_source} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, ad_source: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Campo customizado quando selecionar "Outra" */}
                {formData.ad_source === 'other' && (
                  <Input
                    className="mt-2"
                    placeholder="Digite a origem personalizada"
                    value={formData.custom_source}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_source: e.target.value }))}
                  />
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isCreating || isUpdating}
                >
                  {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingAd ? 'Salvar Alterações' : 'Criar Anúncio'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Anúncios */}
      {customAds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum anúncio personalizado configurado
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Configure regras para identificar automaticamente a origem dos seus leads.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Anúncio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customAds.map((ad) => (
            <Card key={ad.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{ad.ad_name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ad.active}
                      onCheckedChange={() => handleToggleActive(ad)}
                      disabled={isUpdating}
                    />
                    <Badge variant={ad.active ? 'default' : 'secondary'}>
                      {ad.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Origem: <strong>{ad.ad_source}</strong>
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Frase de Ativação:</Label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                      "{ad.ad_phrase}"
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ad)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o anúncio "{ad.ad_name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(ad.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                          >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>  
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
