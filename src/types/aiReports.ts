
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
  delivery_method: 'system' | 'whatsapp';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  report_content?: string;
  report_pdf_url?: string;
  phone_number?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  start_date: Date;
  end_date: Date;
  delivery_method: 'system' | 'whatsapp';
  phone_number?: string;
}

export interface PeriodSelection {
  start: Date | null;
  end: Date | null;
  filterName: string;
}
