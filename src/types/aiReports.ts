
/**
 * Tipos para o sistema de relatórios de IA
 * 
 * Define as interfaces e tipos utilizados em toda a funcionalidade
 * de relatórios, incluindo dados do relatório, requisições de criação
 * e estados de processamento.
 */

export interface AIReport {
  id: string;
  clinica_id: string;
  start_date: string;
  end_date: string;
  delivery_method: 'in_app' | 'whatsapp';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  report_content?: string;
  report_pdf_url?: string;
  phone_number?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  period_start: Date;
  period_end: Date;
  delivery_method: 'in_app' | 'whatsapp';
  recipient_phone_number?: string;
}

export interface PeriodSelection {
  start: Date | null;
  end: Date | null;
  filterName: string;
}

// Payload mínimo para a Edge Function
export interface ReportRequestPayload {
  clinica_id: string;
  start_date: string;
  end_date: string;
  delivery_method: 'in_app' | 'whatsapp';
  recipient_phone_number?: string;
  report_request_id: string;
}

// Payload para cancelar relatório
export interface CancelReportPayload {
  report_id: string;
  clinica_id: string;
}
