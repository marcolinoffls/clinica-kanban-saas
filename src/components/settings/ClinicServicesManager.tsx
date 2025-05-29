
import React, { useState } from 'react';
import { Plus, Trash2, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useClinicServices } from '@/hooks/useClinicServices';

/**
 * Componente para gerenciar os serviços/procedimentos da clínica
 * 
 * Funcionalidades:
 * - Exibir lista de serviços cadastrados
 * - Adicionar novos serviços através de campo de entrada
 * - Remover serviços existentes
 * - Interface intuitiva com feedback visual
 * 
 * Utilizado na página de configurações para permitir que a clínica
 * mantenha atualizada sua lista de procedimentos oferecidos.
 */
export const ClinicServicesManager = () => {
  // Estado local para o campo de entrada de novo serviço
  const [newServiceName, setNewServiceName] = useState('');

  // Hook para gerenciar os serviços da clínica
  const {
    services,
    isLoading,
    addService,
    removeService,
    isAddingService,
    isRemovingService,
  } = useClinicServices();

  // Função para adicionar um novo serviço
  const handleAddService = async () => {
    if (!newServiceName.trim()) {
      return; // Não adiciona se o campo estiver vazio
    }

    try {
      await addService(newServiceName);
      setNewServiceName(''); // Limpa o campo após adicionar
    } catch (error) {
      // O erro já é tratado no hook
      console.error('Erro ao adicionar serviço:', error);
    }
  };

  // Função para remover um serviço
  const handleRemoveService = async (serviceId: string) => {
    try {
      await removeService(serviceId);
    } catch (error) {
      // O erro já é tratado no hook
      console.error('Erro ao remover serviço:', error);
    }
  };

  // Função para lidar com Enter no campo de entrada
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddService();
    }
  };

  return (
    <div className="space-y-6">
      {/* Título da seção */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Serviços/Procedimentos da Clínica
        </h3>
        <p className="text-sm text-gray-600">
          Gerencie a lista de serviços e procedimentos oferecidos pela sua clínica.
          Estes dados serão utilizados em outras partes do sistema.
        </p>
      </div>

      {/* Campo para adicionar novo serviço */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Digite o nome do serviço/procedimento..."
          value={newServiceName}
          onChange={(e) => setNewServiceName(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isAddingService}
          className="flex-1"
        />
        <Button
          onClick={handleAddService}
          disabled={!newServiceName.trim() || isAddingService}
          className="flex items-center gap-2"
        >
          {isAddingService ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Adicionar
        </Button>
      </div>

      {/* Lista de serviços existentes */}
      <div className="space-y-3">
        {isLoading ? (
          // Estado de carregamento
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Carregando serviços...</span>
          </div>
        ) : services.length > 0 ? (
          // Lista com serviços
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Serviços Cadastrados ({services.length})
            </h4>
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-gray-900 font-medium">
                    {service.nome_servico}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveService(service.id)}
                    disabled={isRemovingService}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Estado vazio
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">
              <Plus size={32} className="mx-auto text-gray-300" />
            </div>
            <p className="text-sm">
              Nenhum serviço cadastrado ainda.
              <br />
              Adicione o primeiro serviço usando o campo acima.
            </p>
          </div>
        )}
      </div>

      {/* Informação adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Dica
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>
                Os serviços cadastrados aqui poderão ser utilizados em:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Agendamento de consultas</li>
                <li>Relatórios de procedimentos realizados</li>
                <li>Métricas do dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
