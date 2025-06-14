
/**
 * Componente para as Configurações de Integração com o Instagram
 *
 * O que faz:
 * - Permite ao administrador configurar como o webhook do Instagram será enviado.
 * - Oferece duas opções: 'Padrão' (usando uma URL de webhook fixa) e 'Personalizado' (construindo a URL a partir do nome de usuário do Instagram).
 * - Salva as configurações diretamente no banco de dados (tabela 'clinicas').
 *
 * Onde é usado:
 * - Renderizado dentro de `AdminClinicDetails`.
 *
 * Como se conecta com outras partes:
 * - Recebe o objeto `clinica` para exibir os valores atuais.
 * - Utiliza o cliente Supabase para salvar as alterações diretamente, contornando limitações de componentes pais somente leitura.
 * - Usa 'sonner' para exibir notificações de sucesso ou erro.
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Instagram } from "lucide-react";

interface InstagramSettingsProps {
  clinica: {
    id: string; // ID é necessário para salvar
    instagram_user_handle?: string | null;
    instagram_webhook_type?: string | null;
    instagram_webhook_url?: string | null;
  };
  onSave: (userHandle: string) => Promise<void>; // Mantido por compatibilidade
  saving: boolean; // Mantido por compatibilidade
}

export const InstagramSettings = ({ clinica, saving: parentSaving }: InstagramSettingsProps) => {
  // Estados locais para gerenciar o formulário
  const [webhookType, setWebhookType] = useState('personalizado');
  const [userHandle, setUserHandle] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Efeito para popular os estados quando os dados da clínica são carregados
  useEffect(() => {
    if (clinica) {
      setWebhookType(clinica.instagram_webhook_type || 'personalizado');
      setUserHandle(clinica.instagram_user_handle || '');
      setWebhookUrl(clinica.instagram_webhook_url || '');
    }
  }, [clinica]);

  // Função para lidar com o envio do formulário e salvar os dados
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const updates = {
      instagram_webhook_type: webhookType,
      instagram_user_handle: webhookType === 'personalizado' ? userHandle : null,
      instagram_webhook_url: webhookType === 'padrao' ? webhookUrl : null,
      updated_at: new Date().toISOString(),
    };

    // Log para depuração
    console.log("Salvando configurações do Instagram:", { clinicaId: clinica.id, ...updates });

    const { error } = await supabase
      .from('clinicas')
      .update(updates)
      .eq('id', clinica.id);

    if (error) {
      toast.error("Ocorreu um erro ao salvar as configurações do Instagram.");
      console.error("Erro ao salvar no Supabase:", error);
    } else {
      toast.success("Configurações do Instagram salvas com sucesso!");
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Instagram className="w-6 h-6 text-pink-600" />
          <CardTitle>Integração com Instagram Direct</CardTitle>
        </div>
        <CardDescription>
          Configure como o sistema enviará webhooks para o Instagram.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="font-semibold">Tipo de Webhook</Label>
            <RadioGroup
              value={webhookType}
              onValueChange={setWebhookType}
              className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label htmlFor="tipo-personalizado" className="flex flex-col items-start space-y-2 rounded-md border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="personalizado" id="tipo-personalizado" />
                  <span className="font-medium">Personalizado</span>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  Gera a URL do webhook automaticamente a partir do seu nome de usuário do Instagram.
                </p>
              </Label>
              <Label htmlFor="tipo-padrao" className="flex flex-col items-start space-y-2 rounded-md border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="padrao" id="tipo-padrao" />
                  <span className="font-medium">Padrão</span>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  Usa uma URL de webhook fixa que você define. Útil para fluxos centralizados no n8n.
                </p>
              </Label>
            </RadioGroup>
          </div>

          {/* Campo condicional para Webhook Personalizado */}
          {webhookType === 'personalizado' && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="instagram_user_handle">Usuário do Instagram para Webhook</Label>
              <Input
                id="instagram_user_handle"
                name="instagram_user_handle"
                value={userHandle}
                onChange={(e) => setUserHandle(e.target.value)}
                placeholder="Ex: nome_da_sua_clinica"
              />
              <p className="text-sm text-muted-foreground">
                Preencha apenas o nome de usuário, sem o '@'. A URL final será: <code className="text-xs bg-gray-100 p-1 rounded">.../webhook-instagram/{userHandle || '{usuario}'}</code>.
              </p>
            </div>
          )}

          {/* Campo condicional para Webhook Padrão */}
          {webhookType === 'padrao' && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="instagram_webhook_url">URL do Webhook Padrão</Label>
              <Input
                id="instagram_webhook_url"
                name="instagram_webhook_url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://seu.n8n.url/webhook/instagram-geral"
              />
              <p className="text-sm text-muted-foreground">
                Cole a URL completa do seu webhook do n8n que receberá as mensagens do Instagram.
              </p>
            </div>
          )}
          
          <Button type="submit" disabled={isSaving || parentSaving} className="mt-4">
            {isSaving ? 'Salvando...' : 'Salvar Configuração do Instagram'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
