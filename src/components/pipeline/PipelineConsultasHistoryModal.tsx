
import React from 'react';
import { X, Calendar, FileText } from 'lucide-react';
import { LeadPipeline } from './types';

/**
 * Modal para exibir histórico de consultas de um lead no Pipeline
 * 
 * Mostra o histórico de consultas/atendimentos do lead selecionado.
 * Por enquanto é um placeholder - implementar conforme necessário.
 */

interface PipelineConsultasHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: LeadPipeline | null;
  consultas: any[];
}

export const PipelineConsultasHistoryModal = ({
  isOpen,
  onClose,
  lead,
  consultas
}: PipelineConsultasHistoryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Histórico de Consultas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {lead?.nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {consultas && consultas.length > 0 ? (
            <div className="space-y-4">
              {consultas.map((consulta, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Calendar className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {consulta.titulo || 'Consulta'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {consulta.data || 'Data não informada'}
                        </span>
                      </div>
                      {consulta.descricao && (
                        <p className="text-sm text-gray-600 mt-1">
                          {consulta.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <FileText className="text-gray-300" size={48} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma consulta encontrada
              </h3>
              <p className="text-gray-600">
                Este lead ainda não possui histórico de consultas.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
