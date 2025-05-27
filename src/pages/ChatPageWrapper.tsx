
import { ChatPage } from '@/components/chat/ChatPage';
import { useSearchParams } from 'react-router-dom';

/**
 * Página do Chat (Wrapper)
 * 
 * Interface de chat para comunicação com leads.
 * Lê o leadId dos parâmetros da URL para manter
 * a funcionalidade de navegação direta para um chat específico.
 */
const ChatPageWrapper = () => {
  const [searchParams] = useSearchParams();
  const selectedLeadId = searchParams.get('leadId') || undefined;

  return <ChatPage selectedLeadId={selectedLeadId} />;
};

export default ChatPageWrapper;
