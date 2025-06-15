
import { DashboardMetrics } from '@/hooks/dashboard/types';

/**
 * Componente da seção de insights e alertas do Dashboard
 * 
 * O que faz:
 * - Exibe insights automáticos baseados nos dados
 * - Mostra alertas sobre performance e atividade
 * - Calcula percentuais e estatísticas relevantes
 * 
 * Onde é usado:
 * - Componente Dashboard principal
 * 
 * Como se conecta:
 * - Recebe dados processados do Supabase via props
 * - Gera insights dinâmicos baseados nas métricas
 */

interface DashboardInsightsProps {
  dashboardData: DashboardMetrics | null;
}

export const DashboardInsights = ({ dashboardData }: DashboardInsightsProps) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Insights e Alertas
      </h3>
      
      <div className="space-y-3">
        {dashboardData && dashboardData.totalContatos > 0 ? (
          <>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Atividade registrada no período!
                </p>
                <p className="text-sm text-green-700">
                  Você teve {dashboardData.totalContatos} novos contatos no período selecionado.
                </p>
              </div>
            </div>
            
            {/* Insight sobre anúncios usando o campo leadsComAdName */}
            {dashboardData.leadsComAdName > 0 && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Performance de anúncios
                  </p>
                  <p className="text-sm text-purple-700">
                    {dashboardData.leadsComAdName} leads vieram de anúncios específicos ({((dashboardData.leadsComAdName / dashboardData.totalContatos) * 100).toFixed(1)}% do total).
                  </p>
                </div>
              </div>
            )}
            
            {dashboardData.taxaConversao > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Taxa de conversão
                  </p>
                  <p className="text-sm text-blue-700">
                    Sua taxa de conversão no período foi de {dashboardData.taxaConversao}%.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Nenhuma atividade no período
              </p>
              <p className="text-sm text-gray-500">
                Não foram encontrados dados para o período selecionado.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
