
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

  // Função que renderiza o conteúdo principal baseado na página ativa
  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'kanban':
        return <KanbanBoard />;
      case 'clients':
        return <ClientsPage />;
      case 'chat':
        return <ChatPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Barra lateral fixa com navegação */}
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      
      <div className="flex-1 flex">
        {/* Conteúdo principal da aplicação */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
        
        {/* Barra lateral direita para gerenciamento de tags */}
        <aside className="w-80 bg-white border-l border-gray-200 p-4">
          <TagManager />
        </aside>
      </div>
    </div>
  );
};

export default Index;
