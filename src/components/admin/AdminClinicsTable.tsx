
import { Building2, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Componente da Tabela de Clínicas
 * 
 * Exibe uma tabela com todas as clínicas cadastradas no sistema,
 * incluindo informações como status, leads, taxa de conversão, etc.
 * Inclui funcionalidades de busca, paginação e navegação para detalhes.
 * 
 * Props:
 * - clinicas: array com todas as clínicas
 * - clinicasPaginadas: clínicas da página atual
 * - searchTerm: termo de busca atual
 * - loading: indica se está carregando dados
 * - onSearchChange: função para alterar termo de busca
 * - onSelectClinica: função para selecionar uma clínica para ver detalhes
 */

interface AdminClinicsTableProps {
  clinicas: any[];
  clinicasPaginadas: any[];
  searchTerm: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSelectClinica: (clinicaId: string) => void;
}

export const AdminClinicsTable = ({
  clinicas,
  clinicasPaginadas,
  searchTerm,
  loading,
  onSearchChange,
  onSelectClinica
}: AdminClinicsTableProps) => {
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

  return (
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
            {/* Campo de busca */}
            <Input
              placeholder="Buscar clínicas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          // Indicador de carregamento
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
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
                  {/* Informações básicas da clínica */}
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{clinica.nome}</div>
                      <div className="text-xs text-gray-500">{clinica.email}</div>
                    </div>
                  </TableCell>
                  
                  {/* Status da clínica */}
                  <TableCell>
                    <Badge variant={
                      clinica.status === 'ativo' ? 'default' : 
                      clinica.status === 'inativo' ? 'destructive' : 
                      'secondary'
                    }>
                      {clinica.status || 'ativo'}
                    </Badge>
                  </TableCell>
                  
                  {/* Data de cadastro */}
                  <TableCell>
                    {clinica.created_at ? format(new Date(clinica.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </TableCell>
                  
                  {/* Total de leads */}
                  <TableCell>{clinica.total_leads || 0}</TableCell>
                  
                  {/* Leads de anúncios */}
                  <TableCell>
                    <Badge variant={clinica.leads_anuncios_count > 0 ? "default" : "secondary"}>
                      {clinica.leads_anuncios_count || 0}
                    </Badge>
                  </TableCell>
                  
                  {/* Taxa de conversão com cores condicionais */}
                  <TableCell>
                    <span className={`font-medium ${
                      clinica.taxa_conversao > 30 ? 'text-green-600' :
                      clinica.taxa_conversao > 15 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {clinica.taxa_conversao?.toFixed(1) || '0.0'}%
                    </span>
                  </TableCell>
                  
                  {/* Total de usuários */}
                  <TableCell>{clinica.total_usuarios || 0}</TableCell>
                  
                  {/* Tempo médio de resposta */}
                  <TableCell>
                    {formatarTempoResposta(clinica.tempo_medio_resposta_minutos || 0)}
                  </TableCell>
                  
                  {/* Botão para ver detalhes */}
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectClinica(clinica.id)}
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
        )}
      </CardContent>
    </Card>
  );
};
