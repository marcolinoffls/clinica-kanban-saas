
import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { AdminConfigSetup } from './AdminConfigSetup';
import { AdminDashboard } from './AdminDashboard';
import { AdminClinicsTable } from './AdminClinicsTable';
import { AdminPagination } from './AdminPagination';
import { TimeRangeFilter } from './TimeRangeFilter';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

/**
 * Componente principal do Painel Administrativo
 * 
 * Coordena todos os componentes do painel admin e gerencia o estado global.
 * Verifica permissões de acesso, carrega dados das clínicas e KPIs,
 * e controla a navegação entre diferentes telas do painel.
 * 
 * Funcionalidades principais:
 * - Verificação de permissões de administrador
 * - Dashboard com KPIs globais do sistema
 * - Filtro de tempo global para análises
 * - Tabela de clínicas com busca e paginação
 * - A navegação para detalhes da clínica agora é feita por rota.
 */

export const AdminPanel = () => {
  const {
    loading,
    clinicas,
    obterUserIdAtual,
    configurarComoAdmin,
    verificarPermissaoAdmin,
    buscarKPIsGlobais,
    buscarEstatisticasClinicas
  } = useSupabaseAdmin();

  const { toast } = useToast();
  // Hook do React Router para permitir a navegação entre páginas.
  const navigate = useNavigate();
  
  // Estados de controle principal
  const [isAdmin, setIsAdmin] = useState(false);
  // O estado 'selectedClinicId' foi removido, pois a navegação agora é controlada por rotas.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [configuringAdmin, setConfiguringAdmin] = useState(false);
  
  // Estados do dashboard
  const [kpisGlobais, setKpisGlobais] = useState({
    clinicasAtivas: 0,
    totalLeads: 0,
    novosLeads: 0,
    totalUsuarios: 0
  });
  
  // Estados do filtro de tempo
  const [currentFilter, setCurrentFilter] = useState('Últimos 30 Dias');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Estados da tabela e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Verificar permissões e carregar dados iniciais
  useEffect(() => {
    const inicializar = async () => {
      // Obter user_id atual
      const userId = await obterUserIdAtual();
      setCurrentUserId(userId);
      
      // Verificar se já é admin
      const temPermissao = await verificarPermissaoAdmin();
      setIsAdmin(temPermissao);
      
      if (temPermissao) {
        await carregarDadosDashboard();
      }
    };
    
    inicializar();
  }, []);

  // Função para carregar dados do dashboard
  const carregarDadosDashboard = async () => {
    try {
      const kpis = await buscarKPIsGlobais();
      
      // Mapear os dados retornados para a estrutura esperada
      const kpisFormatados = {
        clinicasAtivas: kpis.totalClinicas || 0,
        totalLeads: kpis.totalLeads || 0,
        novosLeads: kpis.leadsConvertidos || 0, // Usando leadsConvertidos como novosLeads
        totalUsuarios: kpis.taxaConversao || 0 // Usando taxaConversao como totalUsuarios
      };
      
      setKpisGlobais(kpisFormatados);
      await buscarEstatisticasClinicas();
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  // Função para lidar com mudança de filtro de tempo
  const handleFilterChange = async (start: Date, end: Date, filterName: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentFilter(filterName);
    
    // Recarregar KPIs com novo filtro
    const kpis = await buscarKPIsGlobais();
    const kpisFormatados = {
      clinicasAtivas: kpis.totalClinicas || 0,
      totalLeads: kpis.totalLeads || 0,
      novosLeads: kpis.leadsConvertidos || 0,
      totalUsuarios: kpis.taxaConversao || 0
    };
    setKpisGlobais(kpisFormatados);
  };

  // Função para configurar o usuário atual como administrador
  const handleConfigurarComoAdmin = async () => {
    try {
      setConfiguringAdmin(true);
      await configurarComoAdmin();
      
      toast({
        title: "Sucesso!",
        description: "Usuário configurado como administrador. Recarregue a página para acessar o painel.",
      });
      
      // Recarregar a página para aplicar as novas permissões
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao configurar admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível configurar as permissões de administrador.",
        variant: "destructive",
      });
    } finally {
      setConfiguringAdmin(false);
    }
  };

  // Função para navegar para a página de detalhes da clínica.
  // É passada como prop para a tabela de clínicas.
  const handleSelectClinica = (clinicaId: string) => {
    navigate(`/admin/clinicas/${clinicaId}`);
  };

  // Lógica de busca e paginação
  const clinicasFiltradas = clinicas.filter(clinica =>
    clinica.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinica.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(clinicasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const clinicasPaginadas = clinicasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Função para lidar com mudança na busca
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página
  };

  // Se não tem permissão de admin, mostrar tela de configuração
  if (!isAdmin) {
    return (
      <AdminConfigSetup
        currentUserId={currentUserId}
        configuringAdmin={configuringAdmin}
        onConfigurarComoAdmin={handleConfigurarComoAdmin}
      />
    );
  }

  // O bloco que exibia AdminClinicDetails aqui foi removido, pois agora é uma página separada.

  // Tela principal do painel administrativo
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header do painel administrativo */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-gray-600">
            Dashboard executivo e gerenciamento das clínicas no sistema CRM
          </p>
        </div>

        {/* Filtro de Tempo Global */}
        <TimeRangeFilter 
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
        />

        {/* Dashboard com KPIs */}
        <AdminDashboard kpisGlobais={kpisGlobais} />

        {/* Tabela de clínicas */}
        <AdminClinicsTable
          clinicas={clinicas}
          clinicasPaginadas={clinicasPaginadas}
          searchTerm={searchTerm}
          loading={loading}
          onSearchChange={handleSearchChange}
          onSelectClinica={handleSelectClinica}
        />

        {/* Paginação */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={clinicasFiltradas.length}
          startIndex={startIndex}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
