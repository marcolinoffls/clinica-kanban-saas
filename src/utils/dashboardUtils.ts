
/**
 * O que aquilo faz: Funções utilitárias para processar e formatar dados do dashboard.
 * Onde ele é usado no app: Usado pelo `dashboardService` para processar dados antes de serem enviados para o frontend.
 * Como ele se conecta com outras partes: Recebe dados brutos do Supabase e os transforma em formato adequado para gráficos e visualizações.
 */
import { format, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa leads para gráfico de linha temporal
 * Agrupa leads por data e retorna array formatado para o gráfico
 */
export const processarLeadsParaGrafico = (
  leads: any[], 
  startDate: Date | null, 
  endDate: Date | null
) => {
  if (!leads || leads.length === 0) return [];

  // Definir período para análise
  const inicio = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
  const fim = endDate || new Date();

  // Gerar array de datas no período
  const diasNoPeriodo = eachDayOfInterval({ start: inicio, end: fim });

  // Agrupar leads por data
  const leadsAgrupados = diasNoPeriodo.map(dia => {
    const leadsNoDia = leads.filter(lead => {
      const dataLead = new Date(lead.created_at);
      return (
        dataLead >= startOfDay(dia) && 
        dataLead <= endOfDay(dia)
      );
    });

    return {
      label: format(dia, 'dd/MM', { locale: ptBR }),
      leads: leadsNoDia.length
    };
  });

  return leadsAgrupados;
};

/**
 * Processa conversões por categoria de serviço
 * Agrupa por tipo de serviço de interesse do lead
 */
export const processarConversoesPorCategoria = (leads: any[], agendamentos: any[]) => {
  if (!leads || leads.length === 0) return [];

  // Agrupar leads por serviço de interesse
  const servicosMap = new Map<string, number>();

  leads.forEach(lead => {
    const servico = lead.servico_interesse || 'Não especificado';
    
    // Contar como conversão se o lead foi convertido
    if (lead.convertido) {
      servicosMap.set(servico, (servicosMap.get(servico) || 0) + 1);
    }
  });

  // Também contar agendamentos realizados por título
  agendamentos
    .filter(ag => ag.status === 'realizado' || ag.status === 'pago')
    .forEach(ag => {
      const servico = ag.titulo || 'Agendamento';
      servicosMap.set(servico, (servicosMap.get(servico) || 0) + 1);
    });

  // Converter para array ordenado
  return Array.from(servicosMap.entries())
    .map(([category, conversions]) => ({ category, conversions }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 10); // Top 10 categorias
};

/**
 * NOVA FUNÇÃO: Processa leads por anúncio específico (ad_name)
 * Agrupa leads por nome do anúncio e calcula métricas de performance
 * CORRIGIDO: Normaliza nomes dos anúncios para resolver problemas de agrupamento
 */
export const processarLeadsPorAnuncio = (leads: any[]) => {
  if (!leads || leads.length === 0) return [];

  // Filtrar apenas leads que possuem ad_name preenchido
  const leadsComAnuncio = leads.filter(lead => lead.ad_name && lead.ad_name.trim() !== '');

  if (leadsComAnuncio.length === 0) return [];

  // Função para normalizar o nome do anúncio (remove espaços extras, padroniza case)
  const normalizarNomeAnuncio = (nome: string): string => {
    return nome.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  // Agrupar por nome do anúncio normalizado
  const anunciosMap = new Map<string, { 
    nomeOriginal: string; 
    leads: number; 
    conversoes: number; 
    variacoes: Set<string> 
  }>();

  leadsComAnuncio.forEach(lead => {
    const nomeAnuncio = lead.ad_name.trim();
    const nomeNormalizado = normalizarNomeAnuncio(nomeAnuncio);
    
    const atual = anunciosMap.get(nomeNormalizado) || { 
      nomeOriginal: nomeAnuncio, 
      leads: 0, 
      conversoes: 0, 
      variacoes: new Set<string>() 
    };
    
    // Adicionar variação do nome à lista
    atual.variacoes.add(nomeAnuncio);
    
    // Se encontramos uma versão mais "limpa" do nome, usar ela como original
    if (nomeAnuncio.length > atual.nomeOriginal.length || 
        (nomeAnuncio.includes('AD') && !atual.nomeOriginal.includes('AD'))) {
      atual.nomeOriginal = nomeAnuncio;
    }
    
    atual.leads += 1;
    if (lead.convertido) {
      atual.conversoes += 1;
    }
    
    anunciosMap.set(nomeNormalizado, atual);
  });

  // Log para debug - mostrar agrupamentos encontrados
  console.log('Agrupamentos de anúncios encontrados:', 
    Array.from(anunciosMap.entries()).map(([chave, dados]) => ({
      chaveNormalizada: chave,
      nomeExibicao: dados.nomeOriginal,
      variacoes: Array.from(dados.variacoes),
      totalLeads: dados.leads
    }))
  );

  // Converter para array e ordenar por número de leads
  return Array.from(anunciosMap.entries())
    .map(([_, dados]) => ({
      anuncio: dados.nomeOriginal,
      leads: dados.leads,
      conversoes: dados.conversoes
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10); // Top 10 anúncios
};
