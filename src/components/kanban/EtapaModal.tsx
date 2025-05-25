
import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * Modal para criar ou editar etapas do kanban
 * 
 * Funcionalidades:
 * - Criação de novas etapas
 * - Edição de etapas existentes
 * - Validação de duplicatas
 * - Validação de comprimento do texto
 * - Prevenção de nomes vazios
 * 
 * Props:
 * - isOpen: controla visibilidade do modal
 * - onClose: função para fechar modal
 * - onSave: função para salvar etapa
 * - etapa: etapa para edição (null para criação)
 * - etapasExistentes: array de etapas para validar duplicatas
 */

interface EtapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nome: string) => Promise<void>;
  etapa?: any;
  etapasExistentes: any[];
}

export const EtapaModal = ({ isOpen, onClose, onSave, etapa, etapasExistentes }: EtapaModalProps) => {
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Preencher campo quando for edição
  useEffect(() => {
    if (etapa) {
      setNome(etapa.nome);
    } else {
      setNome('');
    }
    setErro('');
  }, [etapa, isOpen]);

  // Validações em tempo real
  const validarNome = (nomeInput: string) => {
    const nomeClean = nomeInput.trim();
    
    // Validar se não está vazio
    if (!nomeClean) {
      return 'Nome da etapa é obrigatório';
    }
    
    // Validar comprimento mínimo e máximo
    if (nomeClean.length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (nomeClean.length > 50) {
      return 'Nome deve ter no máximo 50 caracteres';
    }
    
    // Validar duplicatas (exceto se for a mesma etapa sendo editada)
    const jaExiste = etapasExistentes.some(e => 
      e.nome.toLowerCase() === nomeClean.toLowerCase() && 
      (!etapa || e.id !== etapa.id)
    );
    
    if (jaExiste) {
      return 'Já existe uma etapa com este nome';
    }
    
    return '';
  };

  // Atualizar validação quando nome muda
  useEffect(() => {
    if (nome) {
      const erroValidacao = validarNome(nome);
      setErro(erroValidacao);
    } else {
      setErro('');
    }
  }, [nome, etapasExistentes, etapa]);

  // Função para salvar etapa
  const handleSave = async () => {
    const erroValidacao = validarNome(nome);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    try {
      setSalvando(true);
      await onSave(nome.trim());
      onClose();
    } catch (error) {
      setErro('Erro ao salvar etapa. Tente novamente.');
      console.error('Erro ao salvar etapa:', error);
    } finally {
      setSalvando(false);
    }
  };

  // Não renderiza se modal estiver fechado
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header do modal */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {etapa ? 'Editar Etapa' : 'Nova Etapa'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={salvando}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Etapa *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                erro 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Ex: Primeira Consulta"
              maxLength={50}
              disabled={salvando}
            />
            
            {/* Contador de caracteres */}
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {nome.length}/50 caracteres
              </span>
            </div>
            
            {/* Mensagem de erro */}
            {erro && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{erro}</span>
              </div>
            )}
          </div>

          {/* Dicas de uso */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Dica:</strong> Use nomes claros e descritivos para as etapas do seu funil de vendas, como "Primeira Consulta" ou "Aguardando Aprovação".
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={salvando}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!!erro || !nome.trim() || salvando}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando...' : (etapa ? 'Atualizar' : 'Criar')}
          </button>
        </div>
      </div>
    </div>
  );
};
