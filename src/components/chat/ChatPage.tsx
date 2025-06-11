
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, X } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { MessageInput } from './MessageInput';
import { useSupabaseChat } from '@/hooks/useSupabaseChat';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useClinica } from '@/contexts/ClinicaContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: string;
  created_at: string;
  type?: string;
  media_url?: string;
}

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  origem_lead: string;
  status_conversao: string;
  created_at: string;
  updated_at: string;
  clinica_id: string;
  anotacoes?: string;
  ltv?: number;
  ai_conversation_enabled?: boolean;
  avatar_url?: string;
}

export const ChatPage = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { clinicaAtiva } = useClinica();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [aiActive, setAiActive] = useState(false);
  const [messageValue, setMessageValue] = useState('');
  
  const { 
    enviarMensagem,
    buscarMensagensLead,
    marcarMensagensComoLidas
  } = useSupabaseChat();
  
  const { updateLead } = useLeadsData();

  // Função para lidar com upload de arquivo
  const handleFileUpload = async (file: File) => {
    if (!leadId || !clinicaAtiva?.id) {
      toast.error('Erro: Lead ou clínica não encontrada');
      return;
    }

    try {
      setIsUploading(true);
      
      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clinicaId', clinicaAtiva.id);
      formData.append('leadId', leadId);

      // Chamar a Edge Function para fazer upload no MinIO
      const response = await fetch('/functions/v1/send-crm-media-to-minio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload do arquivo');
      }

      const { publicUrl } = await response.json();
      
      // Determinar o tipo de mídia baseado no arquivo
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('audio/') ? 'audio' : 'file';
      
      // Enviar mensagem com a URL do arquivo
      await sendMessage(file.name, fileType, publicUrl);
      
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  // Carregar dados do lead e mensagens
  useEffect(() => {
    const loadLeadAndMessages = async () => {
      if (!leadId) return;
      
      try {
        setLoading(true);
        
        // Carregar mensagens do lead
        const mensagens = await buscarMensagensLead(leadId);
        setMessages(mensagens);
        
        // Marcar mensagens como lidas
        await marcarMensagensComoLidas(leadId);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar conversa');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeadAndMessages();
  }, [leadId, buscarMensagensLead, marcarMensagensComoLidas]);

  // Função para enviar mensagem
  const sendMessage = async (content: string, type: string = 'text', mediaUrl?: string) => {
    if (!leadId || !content.trim()) return;
    
    try {
      await enviarMensagem(leadId, content, type, mediaUrl);
      
      // Atualizar mensagem mais recente
      if (lead) {
        await updateLead({
          id: leadId,
          nome: lead.nome,
          telefone: lead.telefone,
          email: lead.email,
          clinica_id: lead.clinica_id
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  // Função para alternar IA
  const handleToggleAI = async () => {
    if (!leadId) return;
    
    try {
      const newAiState = !aiActive;
      setAiActive(newAiState);
      
      toast.success(`IA ${newAiState ? 'ativada' : 'desativada'} para este lead`);
    } catch (error) {
      console.error('Erro ao alternar IA:', error);
      toast.error('Erro ao alternar IA');
    }
  };

  // Função para voltar à lista de leads
  const handleBack = () => {
    navigate('/leads');
  };

  return (
    <div className="flex h-full">
      {/* Chat principal */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header do chat */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="font-medium">{lead?.nome || 'Carregando...'}</h2>
              <p className="text-sm text-gray-500">{lead?.telefone || ''}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showSidebar ? 'Ocultar detalhes' : 'Mostrar detalhes'}
            </button>
            
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-gray-600">IA:</span>
              <button
                onClick={handleToggleAI}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  aiActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {aiActive ? 'Ativada' : 'Desativada'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Área de mensagens */}
        <ChatWindow 
          mensagens={messages} 
          loading={loading} 
          nomeContato={lead?.nome || 'Lead'}
        />
        
        {/* Input de mensagem */}
        <div className="border-t p-3">
          <MessageInput 
            value={messageValue}
            onChange={setMessageValue}
            onSend={() => sendMessage(messageValue)}
            onFileSelect={handleFileUpload}
            loading={isUploading}
            aiEnabled={aiActive}
            onToggleAI={handleToggleAI}
            leadId={leadId || null}
          />
        </div>
      </div>
      
      {/* Sidebar com informações do lead */}
      {showSidebar && lead && (
        <div className="w-80 border-l h-full overflow-y-auto">
          <LeadInfoSidebar 
            lead={lead}
          />
        </div>
      )}
    </div>
  );
};
