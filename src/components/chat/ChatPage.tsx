import { useState, useEffect } from 'react';
import { Search, Phone, Video, MessageSquare } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { ChatWindow } from './ChatWindow';
import { LeadInfoSidebar } from './LeadInfoSidebar';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useWebhook } from '@/hooks/useWebhook';
import { useClinicaData } from '@/hooks/useClinicaData';
import { useAIConversationControl } from '@/hooks/useAIConversationControl';
import { useUpdateLeadAiConversationStatus } from '@/hooks/useUpdateLeadAiConversationStatus';

interface Message {
  id: string;
  lead_id: string;
  conteudo: string;
  created_at: string;
  enviado_por: 'lead' | 'usuario';
  tipo: 'texto' | 'imagem' | 'arquivo' | 'audio';
  lida: boolean;
}

interface ChatPageProps {
  selectedLeadId?: string;
}

export const ChatPage = ({ selectedLeadId }: ChatPageProps) => {
  // Hook para acesso direto ao clinicaId e dados da clínica
  const { clinicaId: clinicaIdDireto, clinica: clinicaCompleta } = useClinicaData();
  
  const {
    leads,
    tags,
    enviarMensagem,
    respostasProntas,
    mensagensNaoLidas,
    marcarMensagensComoLidas,
    loading
  } = useSupabaseData();

  const { enviarWebhook } = useWebhook();

  // Hook para atualização do status da IA
  const updateLeadAiStatusMutation = useUpdateLeadAiConversationStatus();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedLeadId || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Buscar o lead selecionado
  const selectedLead = leads.find(l => l.id === selectedConversation) || null;

  // Hook para controlar a IA da conversa
  const { aiEnabled, toggleAI, isInitializing, isUpdating } = useAIConversationControl({
    selectedLead,
    updateLeadAiConversationStatus: updateLeadAiStatusMutation.mutateAsync
  });

  // Atualizar conversa selecionada quando selectedLeadId mudar
  useEffect(() => {
    if (selectedLeadId) {
      setSelectedConversation(selectedLeadId);
    }
  }, [selectedLeadId]);

  // Marcar mensagens como lidas quando uma conversa for selecionada
  useEffect(() => {
    if (selectedConversation && mensagensNaoLidas[selectedConversation] > 0) {
      console.log('📖 Marcando mensagens como lidas para conversa selecionada:', selectedConversation);
      marcarMensagensComoLidas(selectedConversation);
    }
  }, [selectedConversation, mensagensNaoLidas, marcarMensagensComoLidas]);

  // Filtrar leads baseado na busca (já ordenados por data_ultimo_contato no hook)
  const leadsComMensagens = leads.filter(lead =>
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.telefone?.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para validar se um clinica_id existe e é válido
  const validarClinicaId = (clinicaId: string | null): boolean => {
    if (!clinicaId) {
      console.error('❌ [ChatPage] clinica_id é nulo ou vazio');
      return false;
    }

    // Verificar formato UUID básico
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinicaId)) {
      console.error('❌ [ChatPage] clinica_id não tem formato UUID válido:', clinicaId);
      return false;
    }

    return true;
  };

  // Função para enviar mensagem com webhook e validação robusta do clinica_id
  const handleSendMessage = async (aiEnabledForMessage?: boolean) => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      // Logs detalhados ANTES do envio para diagnóstico
      console.log('🔍 [ChatPage] DIAGNÓSTICO COMPLETO - Preparando envio de mensagem:');
      console.log('- selectedConversation (leadId):', selectedConversation);
      console.log('- messageInput:', messageInput.substring(0, 50) + '...');
      console.log('- leads.length:', leads.length);
      
      // Buscar o lead selecionado com logs detalhados
      const leadSelecionado = leads.find(l => l.id === selectedConversation);
      console.log('- leadSelecionado encontrado:', !!leadSelecionado);
      if (leadSelecionado) {
        console.log('- leadSelecionado.id:', leadSelecionado.id);
        console.log('- leadSelecionado.nome:', leadSelecionado.nome);
        console.log('- leadSelecionado.clinica_id:', leadSelecionado.clinica_id);
        console.log('- leadSelecionado.clinica_id é válido?', validarClinicaId(leadSelecionado.clinica_id));
      } else {
        console.error('❌ [ChatPage] Lead selecionado não encontrado na lista de leads!');
      }
      
      // Logs dos dados da clínica
      console.log('- clinicaIdDireto (useClinicaData):', clinicaIdDireto);
      console.log('- clinicaIdDireto é válido?', validarClinicaId(clinicaIdDireto));
      console.log('- clinicaCompleta:', clinicaCompleta ? {
        id: clinicaCompleta.id,
        nome: clinicaCompleta.nome,
        evolution_instance_name: clinicaCompleta.evolution_instance_name
      } : 'null');
      
      // Determinação robusta do clinica_id para webhook
      let clinicaIdParaWebhook: string | null = null;
      
      // Prioridade 1: clinica_id do lead se for válido
      if (leadSelecionado?.clinica_id && validarClinicaId(leadSelecionado.clinica_id)) {
        clinicaIdParaWebhook = leadSelecionado.clinica_id;
        console.log('✅ [ChatPage] Usando clinica_id do lead:', clinicaIdParaWebhook);
      }
      // Prioridade 2: clinica_id direto do contexto se for válido
      else if (clinicaIdDireto && validarClinicaId(clinicaIdDireto)) {
        clinicaIdParaWebhook = clinicaIdDireto;
        console.log('✅ [ChatPage] Usando clinica_id direto (fallback):', clinicaIdParaWebhook);
      }
      // Prioridade 3: clinica_id da clínica completa se for válido
      else if (clinicaCompleta?.id && validarClinicaId(clinicaCompleta.id)) {
        clinicaIdParaWebhook = clinicaCompleta.id;
        console.log('✅ [ChatPage] Usando clinica_id da clínica completa (fallback 2):', clinicaIdParaWebhook);
      }
      
      // Validação final antes do envio
      if (!clinicaIdParaWebhook) {
        console.error('❌ [ChatPage] ERRO CRÍTICO: Não foi possível determinar um clinica_id válido para o webhook!');
        console.error('- leadSelecionado?.clinica_id:', leadSelecionado?.clinica_id);
        console.error('- clinicaIdDireto:', clinicaIdDireto);
        console.error('- clinicaCompleta?.id:', clinicaCompleta?.id);
        throw new Error('Não foi possível determinar a clínica para envio do webhook');
      }
      
      console.log('🚀 [ChatPage] clinica_id FINAL para webhook:', clinicaIdParaWebhook);
      console.log('- aiEnabledForMessage:', aiEnabledForMessage || false);
      
      // Enviar mensagem para o Supabase
      const novaMensagemRaw = await enviarMensagem(selectedConversation, messageInput);
      console.log('✅ [ChatPage] Mensagem salva no Supabase:', novaMensagemRaw.id);
      
      // Limpar input
      setMessageInput('');

      // Enviar webhook apenas se for mensagem do usuário e temos clinica_id válido
      if (novaMensagemRaw.enviado_por === 'usuario') {
        console.log('🚀 [ChatPage] Enviando webhook com dados validados:');
        console.log('- mensagem_id:', novaMensagemRaw.id);
        console.log('- lead_id:', novaMensagemRaw.lead_id);
        console.log('- clinica_id:', clinicaIdParaWebhook);
        console.log('- aiEnabled:', aiEnabledForMessage || false);
        
        await enviarWebhook(
          novaMensagemRaw.id,
          novaMensagemRaw.lead_id,
          clinicaIdParaWebhook,
          novaMensagemRaw.conteudo,
          novaMensagemRaw.tipo || 'texto',
          novaMensagemRaw.created_at,
          aiEnabledForMessage || false
        );
      } else {
        console.log('ℹ️ [ChatPage] Webhook não enviado (mensagem não é do usuário)');
      }

    } catch (error) {
      console.error('❌ [ChatPage] Erro completo no envio da mensagem:', error);
      console.error('- Error stack:', error.stack);
    } finally {
      setSendingMessage(false);
    }
  };

  // Função para formatar horário
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getLastMessage = (leadId: string) => {
    return 'Clique para ver a conversa...';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Lista de conversas - Lateral esquerda */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header da lista */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Conversas</h2>
          
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de conversas com rolagem própria */}
        <div className="flex-1 overflow-y-auto">
          {leadsComMensagens.length > 0 ? (
            leadsComMensagens.map((lead) => {
              const mensagensNaoLidasCount = mensagensNaoLidas[lead.id] || 0;
              
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedConversation(lead.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative ${
                    selectedConversation === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 relative">
                      <span className="text-blue-600 font-semibold">
                        {lead.nome.charAt(0).toUpperCase()}
                      </span>
                      
                      {/* Indicador de mensagens não lidas */}
                      {mensagensNaoLidasCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                          {mensagensNaoLidasCount > 99 ? '99+' : mensagensNaoLidasCount}
                        </div>
                      )}
                    </div>

                    {/* Informações da conversa */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-medium truncate ${
                          mensagensNaoLidasCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-900'
                        }`}>
                          {lead.nome}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {lead.data_ultimo_contato ? formatTime(lead.data_ultimo_contato) : formatTime(lead.updated_at)}
                        </span>
                      </div>
                      
                      <p className={`text-sm truncate mt-1 ${
                        mensagensNaoLidasCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-600'
                      }`}>
                        {getLastMessage(lead.id)}
                      </p>
                      
                      {lead.telefone && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {lead.telefone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Indicador extra de conversa não lida (bolinha verde) */}
                  {mensagensNaoLidasCount > 0 && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <MessageSquare size={32} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de mensagens - Centro */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedLead ? (
          <>
            {/* Header da conversa */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">
                    {selectedLead.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {selectedLead.nome}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedLead.telefone}
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 flex-shrink-0">
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Phone size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Video size={20} />
                </button>
              </div>
            </div>

            {/* Área de mensagens com rolagem própria */}
            <div className="flex-1 bg-gray-50 overflow-hidden">
              <ChatWindow leadId={selectedConversation} />
            </div>

            {/* Input de nova mensagem fixo na parte inferior com controle de IA */}
            <div className="border-t border-gray-200 bg-white flex-shrink-0">
              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                loading={sendingMessage}
                respostasProntas={respostasProntas}
                aiEnabled={aiEnabled}
                onToggleAI={toggleAI}
                isAIInitializing={isInitializing || isUpdating}
              />
            </div>
          </>
        ) : (
          /* Estado vazio - nenhuma conversa selecionada */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa para começar a mensagear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Painel de Informações do Lead - Lateral direita */}
      {selectedLead && (
        <LeadInfoSidebar 
          lead={selectedLead}
          tags={tags.filter(tag => tag.id === selectedLead.tag_id)}
          historico={[]}
          onCallLead={() => console.log('Ligar para lead:', selectedLead.id)}
          onScheduleAppointment={() => console.log('Agendar para lead:', selectedLead.id)}
          onEditLead={() => console.log('Editar lead:', selectedLead.id)}
        />
      )}
    </div>
  );
};
