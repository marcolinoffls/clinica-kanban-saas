
import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * Componente para gerenciar o prompt administrativo da clínica
 * 
 * Permite ao administrador configurar prompts específicos
 * para a IA da clínica, personalizando o comportamento
 * do assistente virtual conforme as necessidades da clínica.
 */

interface AdminPromptSectionProps {
  clinica: any;
  onSave: (prompt: string) => Promise<void>;
  saving: boolean;
}

export const AdminPromptSection = ({ clinica, onSave, saving }: AdminPromptSectionProps) => {
  const [adminPrompt, setAdminPrompt] = useState(clinica.admin_prompt || '');

  const handleSave = async () => {
    await onSave(adminPrompt);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt Administrativo</CardTitle>
        <CardDescription>
          Configurações específicas de IA para esta clínica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="admin-prompt">
            Prompt para IA (Configurações específicas desta clínica)
          </Label>
          <Textarea
            id="admin-prompt"
            placeholder="Digite o prompt específico para a IA desta clínica..."
            value={adminPrompt}
            onChange={(e) => setAdminPrompt(e.target.value)}
            rows={6}
            className="mt-2"
          />
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Prompt'}
        </Button>
      </CardContent>
    </Card>
  );
};
