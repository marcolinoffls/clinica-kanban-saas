/**
 * =================================================================
 * ARQUIVO: LeadModal.tsx
 * =================================================================
 *
 * DESCRIÇÃO:
 * Componente de modal para criar ou editar um lead.
 *
 * CORREÇÃO APLICADA:
 * - A função de máscara de telefone ('formatPhoneNumber') foi corrigida
 * para permitir a digitação completa do número e formatá-lo
 * corretamente no padrão (XX) XXXXX-XXXX.
 * - A funcionalidade de serviços dinâmicos foi mantida.
 * - A interface visual original foi preservada.
 *
 */

import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MessageSquare, Building, Stethoscope, Workflow } from 'lucide-react';
import { Lead } from '@/hooks/useLeadsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useClinicServices } from '@/hooks/useClinicServices';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Partial<Lead> | null;
  etapas: any[];
  onSave: (leadData: Partial<Lead>) => void;
  onOpenHistory?: () => void;
}

const origensLead = [
  'Indicação', 'Site', 'Instagram', 'Facebook', 'Google Ads', 'Meta Ads',
  'WhatsApp', 'Busca Google', 'Outros'
];

// LÓGICA CORRIGIDA: Função para formatar o número de telefone.
const formatPhoneNumber = (value: string) => {
    if (!value) return "";
    
    // 1. Remove todos os caracteres que não são dígitos.
    let digits = value.replace(/\D/g, '');

    // 2. Limita a 11 dígitos.
    if (digits.length > 11) {
        digits = digits.substring(0, 11);
    }

    // 3. Aplica a máscara de acordo com a quantidade de dígitos.
    if (digits.length > 10) {
        // Formato (XX) XXXXX-XXXX para celulares com 9 dígitos.
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    } else if (digits.length > 6) {
        // Formato (XX) XXXX-XXXX para telefones fixos.
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    } else if (digits.length > 2) {
        // CORREÇÃO APLICADA AQUI: Mantém os dois primeiros dígitos como DDD.
        return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    } else {
        // Apenas o início do DDD.
        return digits;
    }
};


export const LeadModal = ({ isOpen, onClose, lead, etapas, onSave, onOpenHistory }: LeadModalProps) => {
  const { services: servicosDaClinica, isLoading: loadingServices } = useClinicServices();
  
  const [formData, setFormData] = useState({
    nome: '', telefone: '', email: '', origem_lead: '',
    servico_interesse: '', etapa_kanban_id: '', anotacoes: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        telefone: formatPhoneNumber(lead.telefone || ''),
        email: lead.email || '',
        origem_lead: lead.origem_lead || '',
        servico_interesse: lead.servico_interesse || '',
        etapa_kanban_id: lead.etapa_kanban_id || (etapas.length > 0 ? etapas[0].id : ''),
        anotacoes: lead.anotacoes || ''
      });
    } else {
      setFormData({
        nome: '', telefone: '', email: '', origem_lead: '',
        servico_interesse: '', etapa_kanban_id: etapas.length > 0 ? etapas[0].id : '',
        anotacoes: ''
      });
    }
    setErrors({});
  }, [lead, isOpen, etapas]);

  const handleInputChange = (field: string, value: string) => {
    const finalValue = field === 'telefone' ? formatPhoneNumber(value) : value;
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    if (formData.telefone.replace(/\D/g, '').length < 10) newErrors.telefone = 'Telefone inválido.';
    if (!formData.servico_interesse) newErrors.servico_interesse = 'Serviço de interesse é obrigatório';
    if (!lead && !formData.etapa_kanban_id) newErrors.etapa_kanban_id = 'Etapa inicial é obrigatória';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email deve ter formato válido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const leadDataToSave = {
        ...formData,
        telefone: formData.telefone.replace(/\D/g, ''),
        ...(lead && { id: lead.id })
      };
      await onSave(leadDataToSave);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                        {lead ? 'Editar Lead' : 'Novo Lead'}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {lead ? 'Atualize as informações do lead' : 'Adicione um novo lead ao sistema'}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <User className="w-4 h-4 text-gray-500" />
                        <h4 className="text-lg font-medium text-gray-900">Informações do Lead</h4>
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
                        <Input id="nome" type="text" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} className={`mt-1 ${errors.nome ? 'border-red-300' : ''}`} placeholder="Nome completo do lead" />
                        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="telefone">Telefone <span className="text-red-500">*</span></Label>
                            <div className="relative mt-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input id="telefone" type="tel" value={formData.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} className={`pl-10 ${errors.telefone ? 'border-red-300' : ''}`} placeholder="(11) 99999-9999" />
                            </div>
                            {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={`pl-10 ${errors.email ? 'border-red-300' : ''}`} placeholder="email@exemplo.com" />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <Label htmlFor="origem">Origem do Lead <span className="text-red-500">*</span></Label>
                            <div className="relative mt-1">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                <Select value={formData.origem_lead} onValueChange={(value) => handleInputChange('origem_lead', value)}>
                                    <SelectTrigger className={`pl-10 ${errors.origem_lead ? 'border-red-300' : ''}`}>
                                        <SelectValue placeholder="Selecione a origem" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {origensLead.map((origem) => <SelectItem key={origem} value={origem}>{origem}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.origem_lead && <p className="text-red-500 text-xs mt-1">{errors.origem_lead}</p>}
                        </div>
                        <div>
                            <Label htmlFor="servico">Serviço de Interesse <span className="text-red-500">*</span></Label>
                            <div className="relative mt-1">
                                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                <Select value={formData.servico_interesse} onValueChange={(value) => handleInputChange('servico_interesse', value)} disabled={loadingServices}>
                                    <SelectTrigger className={`pl-10 ${errors.servico_interesse ? 'border-red-300' : ''}`}>
                                        <SelectValue placeholder={loadingServices ? "Carregando..." : "Selecione o serviço"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {servicosDaClinica.map((servico) => <SelectItem key={servico.id} value={servico.nome_servico}>{servico.nome_servico}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.servico_interesse && <p className="text-red-500 text-xs mt-1">{errors.servico_interesse}</p>}
                        </div>
                    </div>
                </div>
                {!lead && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Workflow className="w-4 h-4 text-gray-500" />
                        <h4 className="text-lg font-medium text-gray-900">Posição no Kanban</h4>
                    </div>
                    <div>
                        <Label htmlFor="etapa">Etapa Inicial <span className="text-red-500">*</span></Label>
                        <Select value={formData.etapa_kanban_id} onValueChange={(value) => handleInputChange('etapa_kanban_id', value)}>
                            <SelectTrigger className={`mt-1 ${errors.etapa_kanban_id ? 'border-red-300' : ''}`}>
                                <SelectValue placeholder="Selecione a etapa inicial" />
                            </SelectTrigger>
                            <SelectContent>
                                {etapas.map((etapa) => <SelectItem key={etapa.id} value={etapa.id}>{etapa.nome}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {errors.etapa_kanban_id && <p className="text-red-500 text-xs mt-1">{errors.etapa_kanban_id}</p>}
                        <p className="text-xs text-gray-500 mt-1">Esta será a posição inicial do lead no seu funil de vendas</p>
                    </div>
                </div>
                )}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <h4 className="text-lg font-medium text-gray-900">Detalhes Adicionais</h4>
                    </div>
                    <div>
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea id="observacoes" value={formData.anotacoes} onChange={(e) => handleInputChange('anotacoes', e.target.value)} rows={4} className="mt-1 resize-none" placeholder="Anotações sobre o lead, primeiro contato, necessidades específicas..." />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button type="button" onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">{isLoading ? 'Salvando...' : (lead ? 'Salvar Alterações' : 'Criar Lead')}</Button>
            </div>
        </div>
      </div>
    </div>
  );
};