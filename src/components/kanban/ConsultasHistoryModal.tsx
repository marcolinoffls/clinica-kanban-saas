
import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';

/**
 * Modal para exibir histórico de consultas de um lead
 * 
 * Funcionalidades:
 * - Lista todas as consultas do lead
 * - Mostra procedimentos, valores e datas
 * - Calcula e exibe LTV total
 * - Design responsivo e intuitivo
 * 
 * Props:
 * - isOpen: controla visibilidade do modal
 * - onClose: função para fechar o modal
 * - lead: dados do lead
 * - consultas: array de consultas do lead
 */

interface Consulta {
  id: string;
  procedimento: string;
  valor: number;
  data_consulta: string;
  observacoes?: string;
}

interface ConsultasHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  consultas: Consulta[];
}

export const ConsultasHistoryModal = ({ isOpen, onClose, lead, consultas }: ConsultasHistoryModalProps) => {
  // Calcular LTV total somando todas as consultas
  const ltvTotal = consultas.reduce((sum, consulta) => sum + (Number(consulta.valor) || 0), 0);

  // Função para formatar data brasileira
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para formatar valor monetário
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Não renderiza se modal estiver fechado
  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header do modal */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Histórico de Consultas
            </h3>
            <p className="text-gray-600 mt-1">
              {lead.nome} - {lead.telefone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Card com resumo do LTV */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Lifetime Value (LTV)
                </h4>
                <p className="text-sm text-gray-600">
                  Valor total investido pelo cliente
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {formatarValor(ltvTotal)}
              </p>
              <p className="text-sm text-gray-500">
                {consultas.length} consulta{consultas.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de consultas */}
        <div className="overflow-y-auto max-h-96">
          {consultas.length > 0 ? (
            <div className="space-y-4">
              {consultas.map((consulta) => (
                <div
                  key={consulta.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {consulta.procedimento}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={14} className="text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatarData(consulta.data_consulta)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatarValor(Number(consulta.valor))}
                      </p>
                    </div>
                  </div>
                  
                  {/* Observações da consulta */}
                  {consulta.observacoes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Observações:</strong> {consulta.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar size={32} className="text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma consulta registrada
              </h4>
              <p className="text-gray-600">
                Este lead ainda não possui histórico de consultas.
              </p>
            </div>
          )}
        </div>

        {/* Botão para fechar */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
