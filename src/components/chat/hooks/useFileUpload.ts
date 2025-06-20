
/**
 * Hook para gerenciar upload de arquivos no chat
 * 
 * Responsável por:
 * - Upload de mídias para MinIO via Edge Function
 * - Estados de loading e erro
 * - Validação de arquivos
 * - Integração com sistema de mensagens
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageData } from '@/types';

interface UseFileUploadProps {
  selectedConversation: string | null;
  clinicaId: string | null;
  aiEnabled: boolean;
  onSendMessage: (messageData: MessageData) => Promise<void>;
}

export const useFileUpload = ({
  selectedConversation,
  clinicaId,
  aiEnabled,
  onSendMessage
}: UseFileUploadProps) => {
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * Função para fazer upload de mídia para MinIO via Edge Function
   * Esta função é chamada quando o usuário seleciona um arquivo no MessageInput
   */
  const handleFileUploadAndSend = async (file: File) => {
    if (!selectedConversation) {
      alert('Por favor, selecione uma conversa antes de enviar uma mídia.');
      console.error('[useFileUpload] Tentativa de upload sem conversa selecionada.');
      return;
    }
  
    if (!clinicaId) {
      alert('ID da clínica não está disponível. Não é possível fazer upload.');
      console.error('[useFileUpload] clinicaId não disponível para upload.');
      return;
    }
  
    setIsUploadingMedia(true);
    setUploadError(null);
    console.log(`[useFileUpload] Iniciando upload do CRM para: leadId=${selectedConversation}, clinicaId=${clinicaId}, arquivo=${file.name}`);
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clinicaId', clinicaId);
    formData.append('leadId', selectedConversation);
  
    try {
      // Chama a Edge Function que faz o upload para o MinIO
      const { data: uploadResponse, error: functionError } = await supabase.functions.invoke(
        'send-crm-media-to-minio', // Nome EXATO da Edge Function
        { body: formData }
      );
  
      if (functionError || !uploadResponse?.publicUrl) {
        const errorMessage = functionError?.message || uploadResponse?.error || 'Falha ao obter URL da mídia do MinIO.';
        console.error('[useFileUpload] Erro ao invocar send-crm-media-to-minio ou URL não retornada:', functionError, uploadResponse);
        setUploadError(errorMessage);
        alert(`Erro no upload: ${errorMessage}`);
        setIsUploadingMedia(false);
        return;
      }
  
      const { publicUrl } = uploadResponse;
  
      // Determina o tipo de arquivo baseado no mimetype para enviar para o Supabase
      // e corresponder à constraint do banco de dados.
      let determinedFileType: 'imagem' | 'audio' | 'arquivo' = 'arquivo'; // Valor padrão
      if (file.type.startsWith('image/')) {
        determinedFileType = 'imagem';
      } else if (file.type.startsWith('audio/')) {
        determinedFileType = 'audio';
      }
  
      console.log(`[useFileUpload] Upload do CRM para MinIO bem-sucedido. URL: ${publicUrl}. Tipo: ${determinedFileType}. Chamando handleSendMessage.`);
      
      // Agora, chame handleSendMessage com os dados da mídia
      await onSendMessage({
        type: determinedFileType,
        content: file.name,
        anexoUrl: publicUrl,
        aiEnabled: aiEnabled
      });
  
    } catch (e: any) {
      console.error("[useFileUpload] Erro durante o processo de upload da mídia pelo CRM:", e);
      setUploadError(e.message || 'Erro desconhecido durante o upload.');
      alert(`Erro no upload: ${e.message || 'Erro desconhecido'}`);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  return {
    isUploadingMedia,
    uploadError,
    setUploadError,
    handleFileUploadAndSend
  };
};
