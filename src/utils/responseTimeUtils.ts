
/**
 * Utilitários para calcular tempo médio de resposta
 * 
 * O que faz:
 * - Calcula tempo médio de resposta baseado em mensagens de chat
 * - Aplica filtros de horário comercial e tipo de resposta
 * - Formata tempos para exibição
 * 
 * Como funciona:
 * 1. Identifica sequências de mensagem: lead → resposta do sistema/usuário
 * 2. Calcula o tempo entre o envio do lead e a primeira resposta
 * 3. Aplica filtros de horário comercial se solicitado
 * 4. Categoriza respostas por tipo (humano/IA)
 */

import { differenceInMinutes, isWithinInterval, parseISO, getHours, getMinutes, getDay } from 'date-fns';

export interface ChatMessage {
  id: string;
  lead_id: string;
  clinica_id: string;
  conteudo: string;
  enviado_por: 'lead' | 'usuario' | 'ia';
  created_at: string;
}

export interface BusinessHours {
  // Horário de funcionamento durante a semana
  weekdayStart: string; // formato HH:mm
  weekdayEnd: string;
  // Configurações de final de semana
  saturdayActive: boolean;
  saturdayStart?: string;
  saturdayEnd?: string;
  sundayActive: boolean;
  sundayStart?: string;
  sundayEnd?: string;
}

export interface ResponseTimeFilters {
  // Tipos de resposta a considerar
  includeHuman: boolean;    // Respostas de usuários
  includeAI: boolean;       // Respostas da IA
  // Considerar apenas horário comercial
  businessHoursOnly: boolean;
}

/**
 * Formata tempo em minutos para exibição amigável
 */
export const formatResponseTime = (minutes: number): string => {
  if (minutes < 1) {
    return '< 1min';
  }
  
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return `${days}d`;
  }
  return `${days}d ${remainingHours}h`;
};

/**
 * Classifica o tempo de resposta em categorias de performance
 */
export const classifyResponseTime = (minutes: number): 'excelente' | 'bom' | 'regular' | 'ruim' => {
  if (minutes <= 60) return 'excelente';      // Até 1 hora
  if (minutes <= 240) return 'bom';           // Até 4 horas
  if (minutes <= 1440) return 'regular';      // Até 1 dia
  return 'ruim';                              // Mais de 1 dia
};

/**
 * Verifica se um momento está dentro do horário comercial
 */
export const isWithinBusinessHours = (date: Date, businessHours: BusinessHours): boolean => {
  const dayOfWeek = getDay(date); // 0 = domingo, 1 = segunda, etc.
  const currentTime = `${getHours(date).toString().padStart(2, '0')}:${getMinutes(date).toString().padStart(2, '0')}`;
  
  // Verificar finais de semana
  if (dayOfWeek === 6) { // Sábado
    if (!businessHours.saturdayActive) return false;
    if (!businessHours.saturdayStart || !businessHours.saturdayEnd) return false;
    return currentTime >= businessHours.saturdayStart && currentTime <= businessHours.saturdayEnd;
  }
  
  if (dayOfWeek === 0) { // Domingo
    if (!businessHours.sundayActive) return false;
    if (!businessHours.sundayStart || !businessHours.sundayEnd) return false;
    return currentTime >= businessHours.sundayStart && currentTime <= businessHours.sundayEnd;
  }
  
  // Dias úteis (segunda a sexta)
  return currentTime >= businessHours.weekdayStart && currentTime <= businessHours.weekdayEnd;
};

/**
 * Calcula o tempo médio de resposta baseado nas mensagens
 */
export const calculateResponseTime = (
  messages: ChatMessage[],
  businessHours?: BusinessHours,
  filters: ResponseTimeFilters = {
    includeHuman: true,
    includeAI: true,
    businessHoursOnly: false
  }
) => {
  // Agrupar mensagens por lead
  const messagesByLead = messages.reduce((acc, message) => {
    if (!acc[message.lead_id]) {
      acc[message.lead_id] = [];
    }
    acc[message.lead_id].push(message);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  const responseTimes: number[] = [];
  const humanResponseTimes: number[] = [];
  const aiResponseTimes: number[] = [];
  const businessHoursTimes: number[] = [];

  // Analisar cada conversa por lead
  Object.values(messagesByLead).forEach(leadMessages => {
    // Ordenar mensagens por data
    const sortedMessages = leadMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Encontrar sequências: lead envia → sistema responde
    for (let i = 0; i < sortedMessages.length - 1; i++) {
      const currentMessage = sortedMessages[i];
      const nextMessage = sortedMessages[i + 1];

      // Verificar se é uma sequência válida (lead → resposta)
      if (
        currentMessage.enviado_por === 'lead' &&
        (nextMessage.enviado_por === 'usuario' || nextMessage.enviado_por === 'ia')
      ) {
        const leadTime = parseISO(currentMessage.created_at);
        const responseTime = parseISO(nextMessage.created_at);
        
        // Aplicar filtro de horário comercial se necessário
        if (filters.businessHoursOnly && businessHours) {
          if (!isWithinBusinessHours(responseTime, businessHours)) {
            continue; // Pular esta resposta
          }
        }

        // Aplicar filtros de tipo de resposta
        const isHumanResponse = nextMessage.enviado_por === 'usuario';
        const isAIResponse = nextMessage.enviado_por === 'ia';
        
        if (!filters.includeHuman && isHumanResponse) continue;
        if (!filters.includeAI && isAIResponse) continue;

        const timeInMinutes = differenceInMinutes(responseTime, leadTime);
        
        // Ignorar tempos negativos ou muito grandes (outliers)
        if (timeInMinutes >= 0 && timeInMinutes <= 10080) { // Máximo 1 semana
          responseTimes.push(timeInMinutes);

          // Separar por tipo de resposta
          if (isHumanResponse) {
            humanResponseTimes.push(timeInMinutes);
          } else if (isAIResponse) {
            aiResponseTimes.push(timeInMinutes);
          }

          // Horário comercial
          if (businessHours && isWithinBusinessHours(responseTime, businessHours)) {
            businessHoursTimes.push(timeInMinutes);
          }
        }
      }
    }
  });

  // Calcular médias
  const calculateAverage = (times: number[]) => 
    times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;

  const averageTime = calculateAverage(responseTimes);
  const averageHumanTime = calculateAverage(humanResponseTimes);
  const averageAITime = calculateAverage(aiResponseTimes);
  const averageBusinessTime = calculateAverage(businessHoursTimes);

  // Calcular distribuição
  const distribution = {
    ate30min: responseTimes.filter(t => t <= 30).length,
    de30mina1h: responseTimes.filter(t => t > 30 && t <= 60).length,
    de1ha4h: responseTimes.filter(t => t > 60 && t <= 240).length,
    acimaDe4h: responseTimes.filter(t => t > 240).length,
  };

  return {
    tempoMedioMinutos: averageTime,
    tempoMedioFormatado: formatResponseTime(averageTime),
    classificacao: classifyResponseTime(averageTime),
    detalhes: {
      tempoMedioHumano: averageHumanTime,
      tempoMedioHumanoFormatado: formatResponseTime(averageHumanTime),
      tempoMedioIA: averageAITime,
      tempoMedioIAFormatado: formatResponseTime(averageAITime),
      tempoMedioComercial: averageBusinessTime,
      tempoMedioComercialFormatado: formatResponseTime(averageBusinessTime),
      distribuicao: distribution,
    },
    totalRespostas: responseTimes.length,
  };
};
