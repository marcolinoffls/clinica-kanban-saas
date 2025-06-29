
/**
 * =================================================================
 * ARQUIVO: stripeEnvironment.ts
 * =================================================================
 *
 * DESCRIÇÃO:
 * Utilitário para gerenciar Price IDs do Stripe baseado no ambiente.
 * Permite alternar entre ambiente de teste e produção de forma consistente
 * com as Edge Functions.
 * 
 * FUNCIONAMENTO:
 * - Detecta ambiente através de variáveis ou configuração
 * - Mapeia Price IDs corretos para cada ambiente
 * - Sincroniza com a lógica das Edge Functions
 */

export type EnvironmentType = 'test' | 'production';

// Função para detectar o ambiente atual
// Agora configurado para produção por padrão
export const getCurrentEnvironment = (): EnvironmentType => {
  // Verifica se há uma configuração específica do ambiente
  return (window as any).__STRIPE_ENVIRONMENT__ || 'production';
};

// Mapeamento de Price IDs por ambiente - ATUALIZADO COM IDS DE PRODUÇÃO
const PRICE_IDS_MAP = {
  test: {
    basic: 'price_1ReLiFQAOfvkgjNZQkB2StTz',
    premium: 'price_1RcAXAQAOfvkgjNZRJA1kxug'
  },
  production: {
    // Price IDs reais de produção fornecidos
    basic: 'price_1RePhVGPYAaRS7MgpBF0h6mT',
    premium: 'price_1ReJriGPYAaRS7MgZVpjvFbT'
  }
};

// Função para obter Price IDs baseado no ambiente
export const getPriceIds = (environment?: EnvironmentType) => {
  const env = environment || getCurrentEnvironment();
  return PRICE_IDS_MAP[env];
};

// Função para obter um Price ID específico
export const getPriceId = (plan: 'basic' | 'premium', environment?: EnvironmentType): string => {
  const priceIds = getPriceIds(environment);
  return priceIds[plan];
};

// Função para verificar se está em ambiente de teste
export const isTestEnvironment = (): boolean => {
  return getCurrentEnvironment() === 'test';
};

// Função para verificar se está em ambiente de produção
export const isProductionEnvironment = (): boolean => {
  return getCurrentEnvironment() === 'production';
};
