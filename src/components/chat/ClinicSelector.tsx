
/**
 * Componente seletor de clínicas para usuários Admin
 * 
 * Este componente:
 * - Permite que Admin selecione uma clínica específica ou todas
 * - Só é visível para usuários Admin
 * - Integra com o sistema de filtragem do ChatPage
 * - Usa Select do shadcn/ui para interface consistente
 * 
 * Props:
 * - selectedClinicaId: ID da clínica selecionada ou 'all'
 * - onClinicaChange: Callback quando clínica é alterada
 * - clinicas: Lista de clínicas disponíveis
 * - loading: Se está carregando clínicas
 */

import { Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ClinicaBasica } from '@/hooks/useAllClinicas';

interface ClinicSelectorProps {
  selectedClinicaId: string;
  onClinicaChange: (clinicaId: string) => void;
  clinicas: ClinicaBasica[];
  loading: boolean;
}

export const ClinicSelector = ({ 
  selectedClinicaId, 
  onClinicaChange, 
  clinicas, 
  loading 
}: ClinicSelectorProps) => {
  return (
    <div className="mb-4 space-y-2">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Building className="w-4 h-4" />
        Visualizar clínica
      </Label>
      
      <Select 
        value={selectedClinicaId} 
        onValueChange={onClinicaChange}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue 
            placeholder={loading ? "Carregando clínicas..." : "Selecionar clínica"} 
          />
        </SelectTrigger>
        <SelectContent>
          {/* Opção para visualizar todas as clínicas */}
          <SelectItem value="all" className="font-medium">
            📊 Todas as clínicas
          </SelectItem>
          
          {/* Lista de clínicas específicas */}
          {clinicas.map((clinica) => (
            <SelectItem key={clinica.id} value={clinica.id}>
              🏥 {clinica.nome}
            </SelectItem>
          ))}
          
          {/* Estado vazio */}
          {!loading && clinicas.length === 0 && (
            <SelectItem value="empty" disabled>
              Nenhuma clínica encontrada
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {/* Indicador de seleção atual */}
      {selectedClinicaId && selectedClinicaId !== 'all' && (
        <p className="text-xs text-gray-500">
          Visualizando: {clinicas.find(c => c.id === selectedClinicaId)?.nome || 'Clínica selecionada'}
        </p>
      )}
      {selectedClinicaId === 'all' && (
        <p className="text-xs text-gray-500">
          Visualizando: Todas as clínicas do sistema
        </p>
      )}
    </div>
  );
};
