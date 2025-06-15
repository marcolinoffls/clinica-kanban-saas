
import { useState } from 'react';
import { MessageSquare, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFollowupCampaigns, useFollowupTemplates } from '@/hooks/useFollowupData';
import { useSendManualFollowup } from '@/hooks/useFollowupWebhook';
import { useAuthUser } from '@/hooks/useAuthUser';

/**
 * Componente de Botão de Follow-up Manual
 * 
 * O que faz:
 * - Exibe botão para envio manual de follow-up
 * - Permite seleção de campanha e template específicos
 * - Mostra prévia do conteúdo antes do envio
 * - Integra com sistema de webhook de follow-up
 * 
 * Onde é usado:
 * - Cards do Kanban/Pipeline como ação rápida
 * - Interface do chat para follow-up direto
 * - Modal de detalhes do lead
 * 
 * Como se conecta:
 * - Usa useFollowupCampaigns para listar campanhas disponíveis
 * - Usa useFollowupTemplates para carregar templates da campanha
 * - Dispara useSendManualFollowup para executar o envio
 */

interface FollowupButtonProps {
  leadId: string;
  leadNome?: string | null;
  leadTelefone?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const FollowupButton = ({
  leadId,
  leadNome,
  leadTelefone,
  variant = 'outline',
  size = 'sm',
  showLabel = false,
  className = '',
}: FollowupButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Hooks para dados
  const { data: user } = useAuthUser();
  const { data: campaigns = [], isLoading: campaignsLoading } = useFollowupCampaigns();
  const { data: templates = [], isLoading: templatesLoading } = useFollowupTemplates(selectedCampaignId || null);
  const sendManualFollowup = useSendManualFollowup();

  // Filtrar apenas campanhas manuais ou que permitem envio manual
  const availableCampaigns = campaigns.filter(campaign => campaign.ativo);

  // Template selecionado
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Processar conteúdo do template com variáveis
  const processTemplateContent = (content: string) => {
    const variaveis = {
      '{nome}': leadNome || 'Cliente',
      '{telefone}': leadTelefone || '',
    };

    let processedContent = content;
    Object.entries(variaveis).forEach(([variavel, valor]) => {
      processedContent = processedContent.replace(new RegExp(variavel, 'g'), valor);
    });

    return processedContent;
  };

  // Handler para envio
  const handleSendFollowup = async () => {
    if (!selectedCampaignId || !selectedTemplateId) {
      return;
    }

    try {
      await sendManualFollowup.mutateAsync({
        leadId,
        campaignId: selectedCampaignId,
        templateId: selectedTemplateId,
        userId: user?.id,
      });

      // Fechar modal e resetar seleções
      setIsOpen(false);
      setSelectedCampaignId('');
      setSelectedTemplateId('');
    } catch (error) {
      console.error('Erro ao enviar follow-up:', error);
    }
  };

  // Verificar se há campanhas disponíveis
  if (!campaignsLoading && availableCampaigns.length === 0) {
    return null; // Não mostrar botão se não há campanhas
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`gap-2 ${className}`}
          disabled={campaignsLoading || availableCampaigns.length === 0}
        >
          <MessageSquare className="w-4 h-4" />
          {showLabel && 'Follow-up'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Enviar Follow-up Manual
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Lead */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900">Lead:</h4>
            <p className="text-sm text-gray-600">
              {leadNome || 'Nome não informado'}
            </p>
            {leadTelefone && (
              <p className="text-xs text-gray-500">{leadTelefone}</p>
            )}
          </div>

          {/* Seleção da Campanha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Campanha de Follow-up:
            </label>
            <Select
              value={selectedCampaignId}
              onValueChange={(value) => {
                setSelectedCampaignId(value);
                setSelectedTemplateId(''); // Reset template selection
              }}
              disabled={campaignsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma campanha..." />
              </SelectTrigger>
              <SelectContent>
                {availableCampaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex items-center gap-2">
                      <span>{campaign.nome}</span>
                      <Badge variant={campaign.tipo === 'automatico' ? 'default' : 'secondary'}>
                        {campaign.tipo}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção do Template */}
          {selectedCampaignId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Template da Mensagem:
              </label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={templatesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.sequencia}</Badge>
                        <span>{template.titulo}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Prévia do Conteúdo */}
          {selectedTemplate && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Prévia da Mensagem:
              </label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {processTemplateContent(selectedTemplate.conteudo)}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Botões de Ação */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={sendManualFollowup.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendFollowup}
              disabled={
                !selectedCampaignId || 
                !selectedTemplateId || 
                sendManualFollowup.isPending
              }
              className="gap-2"
            >
              {sendManualFollowup.isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Follow-up
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
