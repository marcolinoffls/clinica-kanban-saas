/**
 * =================================================================
 * ARQUIVO: LeadModal.tsx
 * =================================================================
 *
 * DESCRIÇÃO:
 * Componente de modal utilizado para criar um novo lead ou editar
 * as informações de um lead existente diretamente do quadro Kanban.
 *
 * FUNCIONALIDADES:
 * - Exibe um formulário com os principais campos de um lead.
 * - Valida os campos obrigatórios.
 * - Carrega dinamicamente a lista de "Serviços de Interesse"
 * cadastrados nas configurações da clínica.
 * - Salva as alterações (criação ou atualização) no banco de dados.
 *
 * MODIFICAÇÕES RECENTES:
 * - A lista estática 'servicosInteresse' foi removida.
 * - O hook 'useClinicServices' foi implementado para buscar
 * os serviços de forma dinâmica.
 * - O campo de seleção de serviços agora reflete os dados
 * cadastrados pela clínica e exibe um estado de carregamento.
 *
 */

// Importações de bibliotecas e componentes
import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MessageSquare, Building, Stethoscope, Workflow } from 'lucide-react';
import { Lead } from '@/hooks/useLeadsData'; // Importa a tipagem do Lead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// =================================================================
// ALTERAÇÃO PRINCIPAL #1: Importar o hook para buscar os serviços.
// =================================================================
import { useClinicServices } from '@/hooks/useClinicServices';

// Define a interface para as propriedades que o modal recebe
interface LeadModalProps {
  isOpen: boolean; // Controla se o modal está visível
  onClose: () => void; // Função para fechar o modal
  lead: Partial<Lead> | null; // Dados do lead (se for edição) ou null (se for criação)
  etapas: any[]; // Lista de etapas do Kanban para o seletor de etapas
  onSave: (leadData: Partial<Lead>) => void; // Função para salvar os dados
  onOpenHistory?: () => void; // Função opcional para abrir histórico de consultas
}

// Lista estática para as origens do lead
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

// =================================================================
// ALTERAÇÃO PRINCIPAL #2: A lista estática de serviços foi removida.
// Os serviços agora são carregados dinamicamente.
// =================================================================

// Declaração do componente LeadModal
export const LeadModal = ({ isOpen, onClose, lead, etapas, onSave, onOpenHistory }: LeadModalProps) => {
  // =================================================================
  // ALTERAÇÃO PRINCIPAL #3: Chamar o hook 'useClinicServices'.
  // - 'services': Conterá a lista de serviços personalizados.
  // - 'isLoading': Booleano que indica se os serviços estão sendo carregados.
  // =================================================================
  const { services: servicosDaClinica, isLoading: loadingServices } = useClinicServices();

  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    origem_lead: '',
    servico_interesse: '',
    etapa_kanban_id: '',
    anotacoes: ''
  });

  // Estado para armazenar os erros de validação do formulário
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  // Efeito que é executado quando o modal é aberto ou o lead muda
  useEffect(() => {
    // Se há um lead (modo de edição), preenche o formulário com seus dados
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        origem_lead: lead.origem_lead || '',
        servico_interesse: lead.servico_interesse || '',
        etapa_kanban_id: lead.etapas_kanban?.id || '',
        anotacoes: lead.anotacoes || ''
      });
    } else {
      // Se não há lead (modo de criação), reseta o formulário
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        origem_lead: '',
        servico_interesse: '',
        etapa_kanban_id: etapas.length > 0 ? etapas[0].id : '', // Define a primeira etapa como padrão
        anotacoes: ''
      });
    }
    // Reseta os erros ao abrir o modal
    setErrors({});
  }, [lead, etapas, isOpen]);

  // Função para lidar com a mudança de valores nos inputs e selects
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpa o erro do campo ao ser modificado
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Função para validar o formulário antes de salvar
  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório.';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório.';
    if (!formData.servico_interesse) newErrors.servico_interesse = 'Serviço de interesse é obrigatório.';
    setErrors(newErrors);
    // Retorna true se não houver erros
    return Object.keys(newErrors).length === 0;
  };

  // Função executada ao clicar no botão de salvar
  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  // Renderização do JSX do componente
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Container principal do modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Cabeçalho do modal */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-800">{lead ? 'Editar Lead' : 'Novo Lead'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        {/* Corpo do modal com scroll */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            
            {/* Seção de Informações do Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <Label htmlFor="nome" className="text-sm font-medium text-gray-700">Nome <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input id="nome" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} placeholder="Nome do Contato" className={`pl-10 ${errors.nome ? 'border-red-300' : ''}`} />
                </div>
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">Telefone <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input id="telefone" value={formData.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} placeholder="(00) 00000-0000" className={`pl-10 ${errors.telefone ? 'border-red-300' : ''}`} />
                </div>
                {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
              </div>
            </div>

            {/* Email (Opcional) */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="email@exemplo.com" className="pl-10" />
              </div>
            </div>

            {/* Seção de Informações do Lead */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origem do Lead */}
              <div>
                <Label htmlFor="origem" className="text-sm font-medium text-gray-700">Origem do Lead</Label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Select value={formData.origem_lead} onValueChange={(value) => handleInputChange('origem_lead', value)}>
                    <SelectTrigger className="pl-10">
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
              </div>

              {/* ================================================================= */}
              {/* ALTERAÇÃO PRINCIPAL #4: Atualizar o seletor de serviços.        */}
              {/* - Agora ele usa 'servicosDaClinica' do hook.                    */}
              {/* - Exibe um placeholder de "Carregando..." enquanto busca dados.   */}
              {/* - Fica desabilitado durante o carregamento.                     */}
              {/* ================================================================= */}
              <div>
                <Label htmlFor="servico" className="text-sm font-medium text-gray-700">Serviço de Interesse <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
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

            {/* Etapa do Kanban */}
            <div>
              <Label htmlFor="etapa" className="text-sm font-medium text-gray-700">Etapa do Kanban</Label>
              <div className="relative mt-1">
                <Workflow className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Select value={formData.etapa_kanban_id} onValueChange={(value) => handleInputChange('etapa_kanban_id', value)}>
                  <SelectTrigger className="pl-10">
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

            {/* Anotações */}
            <div>
              <Label htmlFor="anotacoes" className="text-sm font-medium text-gray-700">Anotações</Label>
              <div className="relative mt-1">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400 z-10" />
                <Textarea id="anotacoes" value={formData.anotacoes} onChange={(e) => handleInputChange('anotacoes', e.target.value)} placeholder="Adicione observações sobre o lead..." className="pl-10 h-28 resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do modal com os botões de ação */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-xl">
          <div>
            {/* O botão de histórico só aparece no modo de edição */}
            {lead && onOpenHistory && (
              <Button variant="outline" onClick={onOpenHistory}>
                Ver Histórico
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Salvar Lead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};