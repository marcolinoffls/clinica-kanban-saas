
import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

/**
 * Página de gerenciamento de clientes
 * 
 * Funcionalidades:
 * - Lista todos os clientes cadastrados
 * - Busca e filtros
 * - CRUD completo (criar, visualizar, editar, excluir)
 * - Exibição de informações como LTV e histórico
 * 
 * Os dados dos clientes incluem:
 * - Informações básicas (nome, telefone, email)
 * - Histórico de consultas
 * - LTV (Lifetime Value)
 * - Anotações importantes
 */

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: Date;
  totalVisits: number;
  ltv: number;
  notes: string;
  status: 'active' | 'inactive';
}

export const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados de clientes (em produção viriam do Supabase)
  const [clients] = useState<Client[]>([
    {
      id: '1',
      name: 'Maria Silva',
      phone: '(11) 99999-9999',
      email: 'maria@email.com',
      lastVisit: new Date('2024-01-15'),
      totalVisits: 8,
      ltv: 2400,
      notes: 'Paciente com implante realizado',
      status: 'active'
    },
    {
      id: '2',
      name: 'João Santos',
      phone: '(11) 88888-8888',
      email: 'joao@email.com',
      lastVisit: new Date('2024-01-10'),
      totalVisits: 3,
      ltv: 850,
      notes: 'Acompanhamento ortodôntico',
      status: 'active'
    },
    {
      id: '3',
      name: 'Ana Costa',
      phone: '(11) 77777-7777',
      email: 'ana@email.com',
      lastVisit: new Date('2023-12-20'),
      totalVisits: 12,
      ltv: 3600,
      notes: 'Paciente VIP - tratamento completo',
      status: 'active'
    }
  ]);

  // Filtra clientes baseado na busca
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para formatar data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-600 mt-1">
            Gerencie todos os seus clientes e acompanhe o histórico
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus size={20} />
          Novo Cliente
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
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>

      {/* Tabela de clientes */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Visita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consultas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LTV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {client.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {client.notes}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.phone}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(client.lastVisit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.totalVisits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(client.ltv)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit2 size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
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
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {/* Resumo estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total de Clientes
          </h3>
          <p className="text-3xl font-bold text-blue-600">{clients.length}</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            LTV Médio
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(clients.reduce((acc, client) => acc + client.ltv, 0) / clients.length)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Consultas Total
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {clients.reduce((acc, client) => acc + client.totalVisits, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};
