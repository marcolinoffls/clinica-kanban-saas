
import ChatPage from '@/components/chat/ChatPage';
import { useSearchParams } from 'react-router-dom';

/**
 * Página do Chat (Wrapper)
 * 
 * Interface de chat para comunicação com leads.
 * Lê o leadId dos parâmetros da URL para manter
 * a funcionalidade de navegação direta para um chat específico.
 */
const ChatPageWrapper = () => {
  return <ChatPage />;
};

export default ChatPageWrapper;
