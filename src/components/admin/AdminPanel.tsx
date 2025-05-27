
import { useState, useEffect } from 'react';
import { Shield, Building2, MessageSquare, Clock, Settings, UserCog, Users, TrendingUp, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { AdminClinicDetails } from './AdminClinicDetails';
import { TimeRangeFilter } from './TimeRangeFilter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Componente principal do Painel Administrativo
 * 
 * Funcionalidades:
 * - Dashboard com KPIs globais do sistema
 * - Filtro de tempo global para análises
 * - Lista todas as clínicas com estatísticas detalhadas
 * - Permite acessar detalhes de cada clínica
 * - Controle de acesso apenas para administradores
 * - Busca e paginação na tabela de clínicas
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
  
  // Estados do componente
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
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
  
  // Estados da tabela
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
      const [kpis] = await Promise.all([
        buscarKPIsGlobais(startDate || undefined, endDate || undefined),
        buscarEstatisticasClinicas()
      ]);
      
      setKpisGlobais(kpis);
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
    const kpis = await buscarKPIsGlobais(start, end);
    setKpisGlobais(kpis);
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

  // Função para formatar tempo em minutos para texto legível
  const formatarTempoResposta = (minutos: number) => {
    if (minutos === 0) return 'Sem dados';
    
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = Math.floor(minutos % 60);
    
    if (horas > 0) {
      return `${horas}h ${minutosRestantes}min`;
    }
    return `${minutosRestantes}min`;
  };

  // Filtrar clínicas baseado na busca
  const clinicasFiltradas = clinicas.filter(clinica =>
    clinica.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinica.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(clinicasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const clinicasPaginadas = clinicasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Se não tem permissão de admin, mostrar tela de configuração
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-blue-600">Configuração de Administrador</CardTitle>
            <CardDescription>
              Para acessar o painel administrativo, você precisa configurar suas permissões.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentUserId && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Seu User ID:</p>
                <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                  {currentUserId}
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleConfigurarComoAdmin}
              disabled={configuringAdmin || !currentUserId}
              className="w-full flex items-center gap-2"
            >
              <UserCog className="w-4 h-4" />
              {configuringAdmin ? 'Configurando...' : 'Configurar como Administrador'}
            </Button>
            
            {!currentUserId && (
              <p className="text-sm text-red-600 text-center">
                Você precisa estar logado para configurar as permissões.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se uma clínica específica foi selecionada, mostrar os detalhes
  if (selectedClinicId) {
    return (
      <AdminClinicDetails 
        clinicaId={selectedClinicId}
        onBack={() => setSelectedClinicId(null)}
      />
    );
  }

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

        {/* KPIs Globais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clínicas Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{kpisGlobais.clinicasAtivas}</div>
              <p className="text-xs text-muted-foreground">
                Clientes com status ativo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{kpisGlobais.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Leads totais no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Leads no Período</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{kpisGlobais.novosLeads}</div>
              <p className="text-xs text-muted-foreground">
                Leads criados no período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários do Sistema</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{kpisGlobais.totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">
                Equipe das clínicas cadastradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de clínicas com busca */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Clínicas Cadastradas ({clinicas.length})
                </CardTitle>
                <CardDescription>
                  Lista de todas as clínicas com estatísticas detalhadas de performance
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar clínicas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset para primeira página
                  }}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Total de Leads</TableHead>
                      <TableHead>Leads de Anúncios</TableHead>
                      <TableHead>Taxa de Conversão</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Tempo Médio</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clinicasPaginadas.map((clinica) => (
                      <TableRow key={clinica.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{clinica.nome}</div>
                            <div className="text-xs text-gray-500">{clinica.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            clinica.status === 'ativo' ? 'default' : 
                            clinica.status === 'inativo' ? 'destructive' : 
                            'secondary'
                          }>
                            {clinica.status || 'ativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {clinica.created_at ? format(new Date(clinica.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>{clinica.total_leads || 0}</TableCell>
                        <TableCell>
                          <Badge variant={clinica.leads_anuncios_count > 0 ? "default" : "secondary"}>
                            {clinica.leads_anuncios_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            clinica.taxa_conversao > 30 ? 'text-green-600' :
                            clinica.taxa_conversao > 15 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {clinica.taxa_conversao?.toFixed(1) || '0.0'}%
                          </span>
                        </TableCell>
                        <TableCell>{clinica.total_usuarios || 0}</TableCell>
                        <TableCell>
                          {formatarTempoResposta(clinica.tempo_medio_resposta_minutos || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedClinicId(clinica.id)}
                            className="flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, clinicasFiltradas.length)} de {clinicasFiltradas.length} clínicas
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded">
                        {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
