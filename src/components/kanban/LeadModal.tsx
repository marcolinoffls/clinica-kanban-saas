/**
 * =================================================================
 * ARQUIVO: LeadModal.tsx
 * =================================================================
 *
 * DESCRIÇÃO:
 * Componente de modal para criar ou editar um lead.
 *
 * CORREÇÕES APLICADAS:
 * 1.  SERVIÇOS DINÂMICOS: A lista de "Serviços de Interesse" agora é
 * buscada dinamicamente a partir das configurações da clínica,
 * substituindo a lista estática.
 * 2.  MÁSCARA DE TELEFONE: O campo "Telefone" agora formata o número
 * automaticamente no padrão (XX) XXXXX-XXXX para melhorar a
 * experiência do usuário.
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

// NOVO: Importar o hook para buscar os serviços da clínica.
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

// NOVO: Função para formatar o número de telefone com máscara.
const formatPhoneNumber = (value: string) => {
  if (!value) return "";
  
  // 1. Remove todos os caracteres que não são dígitos.
  let digits = value.replace(/\D/g, '');

  // 2. Limita a 11 dígitos (DDD + 9 dígitos).
  if (digits.length > 11) {
    digits = digits.substring(0, 11);
  }

  // 3. Aplica a máscara de acordo com a quantidade de dígitos.
  if (digits.length > 10) {
    // Formato (XX) XXXXX-XXXX
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  } else if (digits.length > 6) {
    // Formato (XX) XXXX-XXXX
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  } else if (digits.length > 2) {
    // Formato (XX) X...
    return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  } else {
    // Apenas o início do DDD
    return digits;
  }
};


export const LeadModal = ({ isOpen, onClose, lead, etapas, onSave, onOpenHistory }: LeadModalProps) => {
  // NOVO: Chamar o hook para buscar os serviços personalizados da clínica.
  const { services: servicosDaClinica, isLoading: loadingServices } = useClinicServices();
  
  const [formData, setFormData] = useState({
    nome: '', telefone: '', email: '', origem_lead: '',
    servico_interesse: '', etapa_kanban_id: '', anotacoes: ''
  });
  
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        // NOVO: Formata o telefone ao carregar os dados de um lead existente.
        telefone: formatPhoneNumber(lead.telefone || ''),
        email: lead.email || '',
        origem_lead: lead.origem_lead || '',
        servico_interesse: lead.servico_interesse || '',
        etapa_kanban_id: lead.etapas_kanban?.id || '',
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
  }, [lead, etapas, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    // NOVO: Aplica a formatação se o campo for o de telefone.
    const finalValue = field === 'telefone' ? formatPhoneNumber(value) : value;

    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório.';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório.';
    if (formData.telefone.replace(/\D/g, '').length < 10) newErrors.telefone = 'Telefone inválido.';
    if (!formData.servico_interesse) newErrors.servico_interesse = 'Serviço de interesse é obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Envia o número de telefone sem a formatação para o banco.
      onSave({
        ...formData,
        telefone: formData.telefone.replace(/\D/g, ''),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-800">{lead ? 'Editar Lead' : 'Novo Lead'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <Label htmlFor="nome">Nome <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="nome" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} placeholder="Nome do Contato" className={`pl-10 ${errors.nome ? 'border-red-300' : ''}`} />
                </div>
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
              </div>

              {/* Telefone com máscara */}
              <div>
                <Label htmlFor="telefone">Telefone <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="telefone" value={formData.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} placeholder="(00) 00000-0000" className={`pl-10 ${errors.telefone ? 'border-red-300' : ''}`} />
                </div>
                {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="email@exemplo.com" className="pl-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origem do Lead */}
              <div>
                <Label htmlFor="origem">Origem do Lead</Label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Select value={formData.origem_lead} onValueChange={(value) => handleInputChange('origem_lead', value)}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {origensLead.map((origem) => <SelectItem key={origem} value={origem}>{origem}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* NOVO: Serviço de Interesse Dinâmico */}
              <div>
                <Label htmlFor="servico">Serviço de Interesse <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Select
                    value={formData.servico_interesse}
                    onValueChange={(value) => handleInputChange('servico_interesse', value)}
                    disabled={loadingServices}
                  >
                    <SelectTrigger className={`pl-10 ${errors.servico_interesse ? 'border-red-300' : ''}`}>
                      <SelectValue placeholder={loadingServices ? "Carregando..." : "Selecione o serviço"} />
                    </SelectTrigger>
                    <SelectContent>
                      {servicosDaClinica.map((servico) => (
                        <SelectItem key={servico.id} value={servico.nome_servico}>
                          {servico.nome_servico}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.servico_interesse && <p className="text-red-500 text-xs mt-1">{errors.servico_interesse}</p>}
              </div>
            </div>
            
            {/* Outros campos... */}
            <div>
              <Label htmlFor="etapa">Etapa do Kanban</Label>
              <div className="relative mt-1">
                <Workflow className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Select value={formData.etapa_kanban_id} onValueChange={(value) => handleInputChange('etapa_kanban_id', value)}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.map((etapa) => <SelectItem key={etapa.id} value={etapa.id}>{etapa.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="anotacoes">Anotações</Label>
              <div className="relative mt-1">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea id="anotacoes" value={formData.anotacoes} onChange={(e) => handleInputChange('anotacoes', e.target.value)} placeholder="Adicione observações sobre o lead..." className="pl-10 h-28 resize-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-xl">
          <div>
            {lead && onOpenHistory && (
              <Button variant="outline" onClick={onOpenHistory}>Ver Histórico</Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Salvar Lead</Button>
          </div>
        </div>
      </div>
    </div>
  );
};