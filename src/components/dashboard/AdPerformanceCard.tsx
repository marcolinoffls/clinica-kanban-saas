
/**
 * Componente para exibir performance de anúncios no dashboard
 * 
 * O que faz:
 * - Exibe ranking dos anúncios por número de leads gerados
 * - Mostra taxa de conversão de cada anúncio
 * - Permite visualizar ROI e performance comparativa
 * - Inclui rolagem interna para visualizar muitos anúncios
 * - NOVO: Permite editar apelidos dos anúncios para facilitar identificação
 * 
 * Onde é usado:
 * - No dashboard principal para análise de campanias publicitárias
 * 
 * Como se conecta:
 * - Recebe dados processados pelo dashboardService
 * - Utiliza dados da coluna 'ad_name' da tabela leads
 * - Utiliza hook useAdAliases para gerenciar apelidos personalizados
 */

import { useState } from 'react';
import { TrendingUp, Target, Edit2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdAliases } from '@/hooks/useAdAliases';

interface AdPerformanceData {
  anuncio: string;
  leads: number;
  conversoes: number;
}

interface AdPerformanceCardProps {
  data: AdPerformanceData[];
}

export const AdPerformanceCard = ({ data }: AdPerformanceCardProps) => {
  const { getAliasForAd, saveAlias, isSaving } = useAdAliases();
  const [editingAd, setEditingAd] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Se não houver dados, exibir mensagem informativa
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Performance de Anúncios
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Ranking dos anúncios por leads gerados no período
          </p>
        </div>
        
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              Nenhum lead com anúncio identificado no período
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Função para iniciar edição do apelido
  const handleStartEdit = (adName: string) => {
    const currentAlias = getAliasForAd(adName);
    setEditingAd(adName);
    setEditValue(currentAlias || adName);
  };

  // Função para salvar o apelido
  const handleSaveAlias = async (adName: string) => {
    if (editValue.trim() === '') return;
    
    try {
      await saveAlias({
        adNameOriginal: adName,
        alias: editValue.trim()
      });
      setEditingAd(null);
      setEditValue('');
    } catch (error) {
      console.error('Erro ao salvar apelido:', error);
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingAd(null);
    setEditValue('');
  };

  // Função para obter o nome a ser exibido (apelido ou nome original)
  const getDisplayName = (adName: string) => {
    const alias = getAliasForAd(adName);
    return alias || adName;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 flex flex-col">
      {/* Header do card */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Performance de Anúncios
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Top {data.length} anúncios por leads gerados no período
        </p>
        <p className="text-xs text-gray-500 mt-1">
          💡 Clique no nome do anúncio para adicionar um apelido personalizado
        </p>
      </div>

      {/* Lista de anúncios com rolagem interna */}
      <div className="flex-1 overflow-y-auto max-h-64 space-y-4 pr-2">
        {data.map((item, index) => {
          const taxaConversao = item.leads > 0 ? (item.conversoes / item.leads) * 100 : 0;
          const isEditing = editingAd === item.anuncio;
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                {/* Posição no ranking */}
                <div className="flex items-center gap-3">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                    ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'}
                  `}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Nome do anúncio editável */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm"
                          placeholder="Digite o apelido do anúncio"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveAlias(item.anuncio);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveAlias(item.anuncio)}
                          disabled={isSaving}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <h4 
                          className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                          title={`Clique para editar. Nome original: ${item.anuncio}`}
                          onClick={() => handleStartEdit(item.anuncio)}
                        >
                          {getDisplayName(item.anuncio)}
                        </h4>
                        <Edit2 
                          className="h-3 w-3 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleStartEdit(item.anuncio)}
                        />
                        {getAliasForAd(item.anuncio) && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Apelido
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">
                        {item.leads} lead{item.leads !== 1 ? 's' : ''}
                      </span>
                      <span className="text-sm text-gray-600">
                        {item.conversoes} conversõe{item.conversoes !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Taxa de conversão */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <TrendingUp className={`h-4 w-4 ${taxaConversao > 10 ? 'text-green-600' : taxaConversao > 5 ? 'text-yellow-600' : 'text-red-600'}`} />
                <span className={`text-sm font-medium ${
                  taxaConversao > 10 ? 'text-green-600' : taxaConversao > 5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {taxaConversao.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo estatístico */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {data.reduce((total, item) => total + item.leads, 0)}
            </p>
            <p className="text-xs text-gray-500">Total de Leads</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {data.reduce((total, item) => total + item.conversoes, 0)}
            </p>
            <p className="text-xs text-gray-500">Total de Conversões</p>
          </div>
        </div>
      </div>
    </div>
  );
};
