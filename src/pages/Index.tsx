
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ClientsPage } from '@/components/clients/ClientsPage';
import { ChatPage } from '@/components/chat/ChatPage';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { TagManager } from '@/components/tags/TagManager';

/**
 * Página principal da aplicação CRM para clínicas
 * 
 * Este componente gerencia:
 * - A navegação entre diferentes seções do sistema
 * - O estado da página ativa
 * - A integração entre sidebar e conteúdo principal
 * - Navegação automática para chat quando solicitado
 * 
 * Páginas disponíveis:
 * - dashboard: Métricas e indicadores
 * - kanban: Gerenciamento de leads em formato kanban
 * - clients: Lista e CRUD de clientes
 * - chat: Interface de chat para comunicação
 * - calendar: Agenda de consultas
 * - settings: Configurações do sistema
 */
const Index = () => {
  // Estado que controla qual página está ativa no momento
  const [activePage, setActivePage] = useState('kanban');
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>();

  // Função para navegar para o chat com um lead específico
  const handleNavigateToChat = (leadId: string) => {
    setSelectedLeadId(leadId);
    setActivePage('chat');
  };

  // Função que renderiza o conteúdo principal baseado na página ativa
  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'kanban':
        return <KanbanBoard onNavigateToChat={handleNavigateToChat} />;
      case 'clients':
        return <ClientsPage />;
      case 'chat':
        return <ChatPage selectedLeadId={selectedLeadId} />;
      case 'calendar':
        return <CalendarPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <KanbanBoard onNavigateToChat={handleNavigateToChat} />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Barra lateral fixa com navegação */}
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      
      {/* Conteúdo principal da aplicação */}
      <div className="flex-1 flex min-w-0">
        {activePage === 'chat' ? (
          /* Para a página de chat, não adicionamos padding pois ela controla seu próprio layout */
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        ) : (
          /* Para outras páginas, mantemos o layout com padding e sidebar de tags */
          <>
            <main className="flex-1 p-4 md:p-6 min-w-0 overflow-auto">
              {renderContent()}
            </main>
            
            {/* Barra lateral direita para gerenciamento de tags - Oculta em telas pequenas e na página de chat */}
            <aside className="hidden lg:block w-80 bg-white border-l border-gray-200 p-4 overflow-auto">
              <TagManager />
            </aside>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
