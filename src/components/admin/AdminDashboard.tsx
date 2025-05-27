
import { Building2, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Componente do Dashboard Administrativo
 * 
 * Exibe os principais KPIs (indicadores) do sistema de forma visual
 * através de cards informativos. Inclui métricas como clínicas ativas,
 * total de leads, novos leads no período e usuários do sistema.
 * 
 * Props:
 * - kpisGlobais: objeto com os dados dos KPIs globais do sistema
 */

interface AdminDashboardProps {
  kpisGlobais: {
    clinicasAtivas: number;
    totalLeads: number;
    novosLeads: number;
    totalUsuarios: number;
  };
}

export const AdminDashboard = ({ kpisGlobais }: AdminDashboardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card de Clínicas Ativas */}
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

      {/* Card de Total de Leads */}
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

      {/* Card de Novos Leads no Período */}
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

      {/* Card de Usuários do Sistema */}
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
  );
};
