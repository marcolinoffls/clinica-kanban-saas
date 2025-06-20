
/**
 * Utilitários para o sistema de chat
 * 
 * Funções auxiliares para:
 * - Formatação de telefones
 * - Validação de clinica_id
 * - Formatação de horários
 * - Determinação de ícones de origem
 */

import { MessageSquare, Instagram } from 'lucide-react';

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

/**
 * Função para determinar o ícone da origem do lead
 */
export const getOrigemIcon = (origem: string | null | undefined) => {
  if (!origem) return null;
  
  const origemLower = origem.toLowerCase();
  if (origemLower.includes('whatsapp')) {
    return (
      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
        <MessageSquare size={10} className="text-white" />
      </div>
    );
  }
  
  if (origemLower.includes('instagram')) {
    return (
      <div className="absolute bottom-1 right-1 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Instagram size={10} className="text-white" />
      </div>
    );
  }
  
  return null;
};

/**
 * Função para validar clinica_id no formato UUID
 */
export const validarClinicaId = (clinicaId: string | null | undefined): clinicaId is string => {
  if (!clinicaId) {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(clinicaId)) {
    return false;
  }
  return true;
};

/**
 * Função para formatar horário em formato brasileiro
 */
export const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
