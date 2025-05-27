
import { useState, useEffect } from 'react';
import { Shield, Building2, MessageSquare, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { AdminClinicDetails } from './AdminClinicDetails';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Componente principal do Painel Administrativo
 * 
 * Funcionalidades:
 * - Lista todas as clínicas com estatísticas
 * - Exibe contagem de leads de anúncios
 * - Permite acessar detalhes de cada clínica
 * - Controle de acesso apenas para administradores
 */

export const AdminPanel = () => {
  const {
    loading,
    clinicas,
    verificarPermissaoAdmin,
    buscarEstatisticasClinicas
  } = useSupabaseAdmin();

  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  // Verificar permissões e carregar dados iniciais
  useEffect(() => {
    const inicializar = async () => {
      const temPermissao = await verificarPermissaoAdmin();
      setIsAdmin(temPermissao);
      
      if (temPermissao) {
        await buscarEstatisticasClinicas();
      }
    };
    
    inicializar();
  }, []);

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

  // Se o usuário não for admin, mostrar acesso negado
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar o painel administrativo.
            </CardDescription>
          </CardHeader>
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
      <div className="max-w-7xl mx-auto">
        {/* Header do painel administrativo */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-gray-600">
            Gerenciamento e estatísticas das clínicas no sistema CRM
          </p>
        </div>

        {/* Card com resumo geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clínicas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clinicas.length}</div>
              <p className="text-xs text-muted-foreground">
                Clientes ativos no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads de Anúncios</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clinicas.reduce((total, clinica) => total + (clinica.leads_anuncios_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de leads de anúncios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatarTempoResposta(
                  clinicas.reduce((total, clinica) => total + (clinica.tempo_medio_resposta_minutos || 0), 0) / 
                  clinicas.filter(clinica => clinica.tempo_medio_resposta_minutos > 0).length || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Média geral do sistema
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de clínicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Clínicas Cadastradas
            </CardTitle>
            <CardDescription>
              Lista de todas as clínicas com estatísticas de performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Clínica</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Leads de Anúncios</TableHead>
                    <TableHead>Tempo Médio de Resposta</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinicas.map((clinica) => (
                    <TableRow key={clinica.id}>
                      <TableCell className="font-medium">
                        {clinica.nome}
                      </TableCell>
                      <TableCell>{clinica.email}</TableCell>
                      <TableCell>{clinica.telefone || 'Não informado'}</TableCell>
                      <TableCell>
                        <Badge variant={clinica.leads_anuncios_count > 0 ? "default" : "secondary"}>
                          {clinica.leads_anuncios_count || 0} leads
                        </Badge>
                      </TableCell>
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
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
