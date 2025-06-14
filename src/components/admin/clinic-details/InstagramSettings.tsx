
/**
 * Componente para as Configurações de Integração com o Instagram
 *
 * O que faz:
 * - Exibe um formulário para o administrador inserir ou editar o nome de usuário do Instagram da clínica.
 * - Este nome de usuário será usado para construir a URL do webhook que receberá as mensagens do Instagram Direct.
 *
 * Onde é usado:
 * - É renderizado dentro do componente `AdminClinicDetails`.
 *
 * Como se conecta com outras partes:
 * - Recebe o objeto `clinica` para exibir o valor atual do campo `instagram_user_handle`.
 * - Recebe a função `onSave` (que é a `salvarInstagramUserHandle` de `AdminClinicDetails`) para salvar o dado.
 * - Recebe o estado `saving` para desabilitar o botão de salvar durante a operação.
 */
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram } from "lucide-react";

interface InstagramSettingsProps {
  clinica: { instagram_user_handle?: string | null };
  onSave: (userHandle: string) => Promise<void>;
  saving: boolean;
}

export const InstagramSettings = ({ clinica, onSave, saving }: InstagramSettingsProps) => {
  // Função para lidar com o envio do formulário
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userHandle = formData.get('instagram_user_handle') as string;
    onSave(userHandle);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Instagram className="w-6 h-6 text-pink-600" />
          <CardTitle>Integração com Instagram Direct</CardTitle>
        </div>
        <CardDescription>
          Configure o webhook para receber mensagens do Instagram Direct.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="instagram_user_handle">Usuário do Instagram para Webhook</Label>
            <Input
              id="instagram_user_handle"
              name="instagram_user_handle"
              defaultValue={clinica?.instagram_user_handle || ''}
              placeholder="Ex: nome_da_sua_clinica"
            />
            <p className="text-sm text-muted-foreground">
              Preencha apenas o nome de usuário, sem o '@'. O sistema usará este valor para criar a URL final do webhook.
            </p>
          </div>
          <Button type="submit" disabled={saving} className="mt-4">
            {saving ? 'Salvando...' : 'Salvar Usuário Instagram'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
