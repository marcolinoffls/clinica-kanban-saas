
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Lead, Etapa, Tag } from '@/types';
import { useTags } from '@/hooks/useTagsData';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Partial<Lead>;
  etapas: Etapa[];
  onSave: (leadData: Partial<Lead>) => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  etapas,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    nome: '',
    email: '',
    telefone: '',
    origem_lead: '',
    servico_interesse: '',
    anotacoes: '',
    etapa_id: '', // CORRIGIDO: usar etapa_id
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: tags = [] } = useTags();

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        email: lead.email || '',
        telefone: lead.telefone || '',
        origem_lead: lead.origem_lead || '',
        servico_interesse: lead.servico_interesse || '',
        anotacoes: lead.anotacoes || '',
        etapa_id: lead.etapas_kanban?.id || lead.etapa_id || '', // CORRIGIDO
      });
      setSelectedTagIds(lead.tag_ids || []); // CORRIGIDO para tag_ids
    } else {
      // Reset form for new lead
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        origem_lead: '',
        servico_interesse: '',
        anotacoes: '',
        etapa_id: etapas.length > 0 ? etapas[0].id : '',
      });
      setSelectedTagIds([]);
    }
  }, [lead, etapas, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.etapa_id) {
      toast.error('Etapa é obrigatória');
      return;
    }

    setIsSubmitting(true);
    try {
      const leadData: Partial<Lead> = {
        ...formData,
        tag_ids: selectedTagIds, // CORRIGIDO para tag_ids
      };

      await onSave(leadData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lead?.id ? 'Editar Lead' : 'Novo Lead'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do lead"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="etapa">Etapa *</Label>
              <Select
                value={formData.etapa_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, etapa_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origem">Origem</Label>
              <Input
                id="origem"
                value={formData.origem_lead || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, origem_lead: e.target.value }))}
                placeholder="Ex: Google Ads, Instagram, etc."
              />
            </div>

            <div>
              <Label htmlFor="servico">Serviço de Interesse</Label>
              <Input
                id="servico"
                value={formData.servico_interesse || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, servico_interesse: e.target.value }))}
                placeholder="Ex: Limpeza de pele, Botox, etc."
              />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  style={{
                    backgroundColor: selectedTagIds.includes(tag.id) ? tag.cor : 'transparent',
                    borderColor: tag.cor,
                    color: selectedTagIds.includes(tag.id) ? 'white' : tag.cor
                  }}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.nome}
                  {selectedTagIds.includes(tag.id) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="anotacoes">Anotações</Label>
            <Textarea
              id="anotacoes"
              value={formData.anotacoes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, anotacoes: e.target.value }))}
              placeholder="Anotações sobre o lead..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
