
import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { LeadModal } from '@/components/kanban/LeadModal';
import { useToast } from '@/hooks/use-toast';

/**
 * Página de gerenciamento de contatos (leads)
 * 
 * Funcionalidades:
 * - Lista todos os contatos (leads) cadastrados
 * - Busca e filtros
 * - CRUD completo (criar, visualizar, editar, excluir)
 * - Exibição de informações como data do último contato
 * - Integração com dados reais do Supabase
 * 
 * Os dados dos contatos incluem:
 * - Informações básicas (nome, telefone, email)
 * - Data do último contato
 * - Anotações importantes
 * - Status ativo/inativo
 */

interface LeadDetalhes {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  data_ultimo_contato: string | null;
  anotacoes: string;
  tag_id: string | null;
  created_at: string;
}

export const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadDetalhes | null>(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [leadDetails, setLeadDetails] = useState<LeadDetalhes | null>(null);
  
  const { leads, tags, salvarLead, excluirLead, loading } = useSupabaseData();
  const { toast } = useToast();

  // Filtra contatos baseado na busca
  const filteredLeads = leads.filter(lead =>
    lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.telefone?.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para obter nome da tag
  const getTagName = (tagId: string | null) => {
    if (!tagId) return '';
    const tag = tags.find(t => t.id === tagId);
    return tag ? tag.nome : '';
  };

  // Função para obter cor da tag
  const getTagColor = (tagId: string | null) => {
    if (!tagId) return '#6B7280';
    const tag = tags.find(t => t.id === tagId);
    return tag ? tag.cor : '#6B7280';
  };

  // Função para abrir modal de novo contato
  const handleNovoContato = () => {
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  // Função para abrir modal de edição
  const handleEditarLead = (lead: any) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Função para excluir lead
  const handleExcluirLead = async (leadId: string, nomeContato: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o contato "${nomeContato}"?`)) {
      try {
        await excluirLead(leadId);
        toast({
          title: "Contato excluído",
          description: `${nomeContato} foi removido com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao excluir contato:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o contato.",
          variant: "destructive",
        });
      }
    }
  };

  // Função para salvar lead
  const handleSalvarLead = async (leadData: any) => {
    try {
      await salvarLead(leadData);
      setIsModalOpen(false);
      toast({
        title: selectedLead ? "Contato atualizado" : "Contato criado",
        description: selectedLead 
          ? "As informações do contato foram atualizadas." 
          : "Novo contato adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o contato.",
        variant: "destructive",
      });
    }
  };

  // Função para mostrar detalhes do contato
  const handleVerDetalhes = (lead: any) => {
    setLeadDetails(lead);
    setShowLeadDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando contatos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contatos</h2>
          <p className="text-gray-600 mt-1">
            Gerencie todos os seus contatos e acompanhe o histórico
          </p>
        </div>
        <button 
          onClick={handleNovoContato}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Contato
        </button>
      </div>

      {/* Barra de busca e filtros */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabela de contatos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <button
                        onClick={() => handleVerDetalhes(lead)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        {lead.nome}
                      </button>
                      {lead.tag_id && (
                        <div className="flex items-center mt-1">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getTagColor(lead.tag_id) }}
                          >
                            {getTagName(lead.tag_id)}
                          </span>
                        </div>
                      )}
                      {lead.anotacoes && (
                        <div className="text-sm text-gray-500 mt-1">
                          {lead.anotacoes.length > 50 
                            ? `${lead.anotacoes.substring(0, 50)}...` 
                            : lead.anotacoes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.telefone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(lead.data_ultimo_contato)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleVerDetalhes(lead)}
                        className="text-green-600 hover:text-green-800"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditarLead(lead)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleExcluirLead(lead.id, lead.nome)}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensagem quando não há resultados */}
        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
            </p>
          </div>
        )}
      </div>

      {/* Resumo estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total de Contatos
          </h3>
          <p className="text-3xl font-bold text-blue-600">{leads.length}</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Com Telefone
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {leads.filter(lead => lead.telefone).length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Com Email
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {leads.filter(lead => lead.email).length}
          </p>
        </div>
      </div>

      {/* Modal de lead */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLead}
        onSave={handleSalvarLead}
      />

      {/* Modal de detalhes do contato */}
      {showLeadDetails && leadDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Detalhes do Contato</h3>
              <button
                onClick={() => setShowLeadDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <p className="text-sm text-gray-900">{leadDetails.nome}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <p className="text-sm text-gray-900">{leadDetails.telefone || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{leadDetails.email || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Último Contato</label>
                <p className="text-sm text-gray-900">{formatDate(leadDetails.data_ultimo_contato)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cadastrado em</label>
                <p className="text-sm text-gray-900">{formatDate(leadDetails.created_at)}</p>
              </div>
              
              {leadDetails.tag_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria</label>
                  <span 
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: getTagColor(leadDetails.tag_id) }}
                  >
                    {getTagName(leadDetails.tag_id)}
                  </span>
                </div>
              )}
              
              {leadDetails.anotacoes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Anotações</label>
                  <p className="text-sm text-gray-900">{leadDetails.anotacoes}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLeadDetails(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowLeadDetails(false);
                  handleEditarLead(leadDetails);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
