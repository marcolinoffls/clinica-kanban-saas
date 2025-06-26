
/**
 * Utilitários para formatação de números de telefone
 * 
 * O que faz:
 * - Formata números brasileiros no padrão (XX) XXXXX-XXXX
 * - Trata números com 10 e 11 dígitos
 * 
 * Onde é usado:
 * - ChatPage para exibir telefones formatados
 */

/**
 * Função para formatar números de telefone no padrão brasileiro
 * Converte números como "84987759827" para "(84) 98775-9827"
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'Telefone não informado';
  
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
