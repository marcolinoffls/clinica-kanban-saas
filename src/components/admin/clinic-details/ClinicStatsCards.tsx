
import { Building2, Clock, MessageSquare, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Componente que exibe cartões de estatísticas da clínica
 * 
 * Mostra métricas importantes como:
 * - Número de leads de anúncios
 * - Tempo médio de resposta
 * - Status da integração Evolution
 */

interface ClinicStatsCardsProps {
  clinica: any;
}

export const ClinicStatsCards = ({ clinica }: ClinicStatsCardsProps) => {
  // Função para formatar tempo em minutos para texto legível
  const formatarTempoResposta = (minutos: number) => {
    if (minutos === 0) return 'Sem dados disponíveis';
    
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = Math.floor(minutos % 60);
    
    if (horas > 0) {
      return `${horas}h ${minutosRestantes}min`;
    }
    return `${minutosRestantes}min`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads de Anúncios</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clinica.leads_anuncios_count || 0}</div>
          <p className="text-xs text-muted-foreground">
            Leads originados de anúncios
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
            {formatarTempoResposta(clinica.tempo_medio_resposta_minutos || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Primeira resposta aos leads
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status da Integração</CardTitle>
          <Link2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={clinica.evolution_instance_name ? "default" : "secondary"}>
            {clinica.evolution_instance_name ? "Configurada" : "Não Configurada"}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            Evolution API
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
