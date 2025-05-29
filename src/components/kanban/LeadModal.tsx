
import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MessageSquare, Building, Stethoscope, Workflow } from 'lucide-react';
import { Lead, Etapa } from './KanbanBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

/**
 * Modal para criação e edição de leads
 * 
 * Permite definir todas as informações do lead
 * incluindo a etapa inicial no kanban
 */

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  etapas: Etapa[];
  selectedEtapaId?: string | null;
  onSave: (leadData: Partial<Lead>) => void;
  onOpenHistory?: () => void;
}

// Opções para origem do lead
const origensLead = [
  'Indicação',
  'Site',
  'Instagram',
  'Facebook',
  'Google Ads',
  'Meta Ads',
  'WhatsApp',
  'Busca Google',
  'Outros'
];

// Opções para serviços de interesse
const servicosInteresse = [
  'Consulta de Avaliação',
  'Implantes Dentários',
  'Ortodontia',
  'Clareamento Dental',
  'Limpeza e Profilaxia',
  'Restaurações',
  'Próteses',
  'Cirurgia Oral',
  'Endodontia',
  'Periodontia'
];

export const LeadModal = ({ isOpen, onClose, lead, etapas, selectedEtapaId, onSave, onOpenHistory }: LeadModalProps) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    origem_lead: '',
    servico_interesse: '',
    etapa_kanban_id: '',
    anotacoes: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Preenche o formulário quando um lead é selecionado para edição
  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        origem_lead: lead.origem_lead || '',
        servico_interesse: lead.servico_interesse || '',
        etapa_kanban_id: lead.etapa_kanban_id || '',
        anotacoes: lead.anotacoes || ''
      });
    } else {
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        origem_lead: '',
        servico_interesse: '',
        etapa_kanban_id: selectedEtapaId || (etapas.length > 0 ? etapas[0].id : ''),
        anotacoes: ''
      });
    }
    setErrors({});
  }, [lead, isOpen, etapas, selectedEtapaId]);

  // Função para atualizar campos do formulário
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }
    
    if (!formData.origem_lead) {
      newErrors.origem_lead = 'Origem do lead é obrigatória';
    }
    
    if (!formData.servico_interesse) {
      newErrors.servico_interesse = 'Serviço de interesse é obrigatório';
    }

    if (!lead && !formData.etapa_kanban_id) {
      newErrors.etapa_kanban_id = 'Etapa inicial é obrigatória';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter formato válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para salvar o lead
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const leadDataToSave = {
        ...formData,
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

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header do modal */}
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
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* Seção: Informações Básicas */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <User className="w-4 h-4 text-gray-500" />
                <h4 className="text-lg font-medium text-gray-900">Informações do Lead</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                  <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className={`mt-1 ${errors.nome ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Nome completo do lead"
                  />
                  {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
                </div>

                {/* Telefone */}
                <div>
                  <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        handleInputChange('telefone', formatted);
                      }}
                      className={`pl-10 ${errors.telefone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Origem do Lead */}
                <div>
                  <Label htmlFor="origem" className="text-sm font-medium text-gray-700">
                    Origem do Lead <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Select value={formData.origem_lead} onValueChange={(value) => handleInputChange('origem_lead', value)}>
                      <SelectTrigger className={`pl-10 ${errors.origem_lead ? 'border-red-300' : ''}`}>
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {origensLead.map((origem) => (
                          <SelectItem key={origem} value={origem}>
                            {origem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.origem_lead && <p className="text-red-500 text-xs mt-1">{errors.origem_lead}</p>}
                </div>

                {/* Serviço de Interesse */}
                <div>
                  <Label htmlFor="servico" className="text-sm font-medium text-gray-700">
                    Serviço de Interesse <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Select value={formData.servico_interesse} onValueChange={(value) => handleInputChange('servico_interesse', value)}>
                      <SelectTrigger className={`pl-10 ${errors.servico_interesse ? 'border-red-300' : ''}`}>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {servicosInteresse.map((servico) => (
                          <SelectItem key={servico} value={servico}>
                            {servico}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.servico_interesse && <p className="text-red-500 text-xs mt-1">{errors.servico_interesse}</p>}
                </div>
              </div>
            </div>

            {/* Nova seção: Configuração do Kanban */}
            {!lead && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Workflow className="w-4 h-4 text-gray-500" />
                  <h4 className="text-lg font-medium text-gray-900">Posição no Kanban</h4>
                </div>
                
                <div>
                  <Label htmlFor="etapa" className="text-sm font-medium text-gray-700">
                    Etapa Inicial <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.etapa_kanban_id} 
                    onValueChange={(value) => handleInputChange('etapa_kanban_id', value)}
                  >
                    <SelectTrigger className={`mt-1 ${errors.etapa_kanban_id ? 'border-red-300' : ''}`}>
                      <SelectValue placeholder="Selecione a etapa inicial" />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map((etapa) => (
                        <SelectItem key={etapa.id} value={etapa.id}>
                          {etapa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.etapa_kanban_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.etapa_kanban_id}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Esta será a posição inicial do lead no seu funil de vendas
                  </p>
                </div>
              </div>
            )}

            {/* Seção: Detalhes Adicionais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <h4 className="text-lg font-medium text-gray-900">Detalhes Adicionais</h4>
              </div>
              
              <div>
                <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">
                  Observações
                </Label>
                <Textarea
                  id="observacoes"
                  value={formData.anotacoes}
                  onChange={(e) => handleInputChange('anotacoes', e.target.value)}
                  rows={4}
                  className="mt-1 resize-none"
                  placeholder="Anotações sobre o lead, primeiro contato, necessidades específicas..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer do modal */}
        <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            {lead && onOpenHistory && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenHistory}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Ver Histórico
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Salvando...' : (lead ? 'Salvar Alterações' : 'Criar Lead')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
