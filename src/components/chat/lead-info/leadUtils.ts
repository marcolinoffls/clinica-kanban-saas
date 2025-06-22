
/**
 * Utilitários para formatação de dados do lead
 */

/**
 * Função para formatar números de telefone no padrão brasileiro
 * Converte números como "84987759827" para "(84) 98775-9827"
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'Não informado';
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (celular com 9 na frente)
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }
  
  // Se tem 10 dígitos (telefone fixo)
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }
  
  // Se não está no padrão esperado, retorna como está
  return phone;
};

/**
 * Função para truncar nomes de anúncios muito longos
 */
export const truncateAdName = (adName: string): string => {
  if (!adName) return '';
  
  // Se o nome é muito longo, truncar de forma inteligente
  if (adName.length > 30) {
    // Tentar pegar as primeiras palavras mais importantes
    const words = adName.split(' ');
    
    // Se tem muitas palavras, pegar as primeiras e últimas
    if (words.length > 5) {
      const firstPart = words.slice(0, 3).join(' ');
      const lastPart = words.slice(-2).join(' ');
      return `${firstPart}...${lastPart}`;
    }
    
    // Se não, apenas truncar no meio
    return adName.substring(0, 27) + '...';
  }
  
  return adName;
};

/**
 * Formatar moeda brasileira
 */
export const formatCurrency = (value: number | null | undefined) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formatar data brasileira
 */
export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Não informado';
  return new Date(dateString).toLocaleDateString('pt-BR');
};
