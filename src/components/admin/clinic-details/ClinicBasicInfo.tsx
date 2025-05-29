
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

/**
 * Componente que exibe informações básicas da clínica
 * 
 * Mostra dados de contato e informações gerais:
 * - E-mail da clínica
 * - Telefone de contato
 * - Nome da instância Evolution configurada
 */

interface ClinicBasicInfoProps {
  clinica: any;
}

export const ClinicBasicInfo = ({ clinica }: ClinicBasicInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Clínica</CardTitle>
        <CardDescription>
          Dados básicos de contato e cadastro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">E-mail</Label>
            <p className="text-gray-900">{clinica.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Telefone</Label>
            <p className="text-gray-900">{clinica.telefone || 'Não informado'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Instância Evolution</Label>
            <p className="text-gray-900">{clinica.evolution_instance_name || 'Não configurada'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
