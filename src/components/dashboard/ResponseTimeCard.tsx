
/**
 * Card de Tempo Médio de Resposta
 * 
 * O que faz:
 * - Exibe o tempo médio de resposta da clínica
 * - Permite filtrar por tipo de resposta (humano/IA)
 * - Mostra dados para horário comercial vs 24h
 * - Indica performance através de cores
 * 
 * Onde é usado:
 * - Dashboard principal como um card destacado
 * 
 * Como se conecta:
 * - Recebe dados do tempo médio calculados no dashboardService
 * - Usa configurações de horário da clínica
 */

import { useState } from 'react';
import { Clock, TrendingUp, TrendingDown, Users, Bot, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardMetrics } from '@/hooks/dashboard/types';

interface ResponseTimeCardProps {
  tempoMedioResposta: DashboardMetrics['tempoMedioResposta'];
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const ResponseTimeCard = ({ 
  tempoMedioResposta, 
  isExpanded = false, 
  onToggleExpanded 
}: ResponseTimeCardProps) => {
  const [selectedView, setSelectedView] = useState<'geral' | 'humano' | 'ia' | 'comercial'>('geral');

  // Determinar cor baseada na classificação
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'excelente': return 'text-green-600 bg-green-50';
      case 'bom': return 'text-blue-600 bg-blue-50';
      case 'regular': return 'text-yellow-600 bg-yellow-50';
      case 'ruim': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Obter dados baseados na visualização selecionada
  const getCurrentData = () => {
    switch (selectedView) {
      case 'humano':
        return {
          tempo: tempoMedioResposta.detalhes.tempoMedioHumanoFormatado,
          icon: Users,
          label: 'Respostas Humanas'
        };
      case 'ia':
        return {
          tempo: tempoMedioResposta.detalhes.tempoMedioIAFormatado,
          icon: Bot,
          label: 'Respostas da IA'
        };
      case 'comercial':
        return {
          tempo: tempoMedioResposta.detalhes.tempoMedioComercialFormatado,
          icon: Calendar,
          label: 'Horário Comercial'
        };
      default:
        return {
          tempo: tempoMedioResposta.tempoMedioFormatado,
          icon: Clock,
          label: 'Tempo Médio Geral'
        };
    }
  };

  const currentData = getCurrentData();
  const CurrentIcon = currentData.icon;

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
        <div className="flex items-center gap-2">
          {/* Badge de classificação */}
          <Badge 
            variant="secondary" 
            className={getClassificationColor(tempoMedioResposta.classificacao)}
          >
            {tempoMedioResposta.classificacao}
          </Badge>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Valor principal e seletor */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CurrentIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{currentData.tempo}</div>
                <p className="text-xs text-muted-foreground">{currentData.label}</p>
              </div>
            </div>
            
            {/* Seletor de visualização */}
            <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="humano">Humano</SelectItem>
                <SelectItem value="ia">IA</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Indicador de variação */}
          <div className="flex items-center gap-2">
            {tempoMedioResposta.variacao >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
            <span className={`text-sm ${tempoMedioResposta.variacao >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {Math.abs(tempoMedioResposta.variacao)}% vs período anterior
            </span>
          </div>

          {/* Preview da distribuição */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {tempoMedioResposta.detalhes.distribuicao.ate30min}
              </div>
              <div className="text-muted-foreground">≤ 30min</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {tempoMedioResposta.detalhes.distribuicao.de30mina1h}
              </div>
              <div className="text-muted-foreground">30min-1h</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">
                {tempoMedioResposta.detalhes.distribuicao.de1ha4h}
              </div>
              <div className="text-muted-foreground">1h-4h</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">
                {tempoMedioResposta.detalhes.distribuicao.acimaDe4h}
              </div>
              <div className="text-muted-foreground">> 4h</div>
            </div>
          </div>

          {/* Botão para expandir/colapsar detalhes */}
          {onToggleExpanded && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleExpanded}
              className="w-full"
            >
              {isExpanded ? 'Menos detalhes' : 'Ver detalhes'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
