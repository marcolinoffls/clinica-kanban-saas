
import { useState } from 'react';
import { Tags } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ClientsPage } from '@/components/clients/ClientsPage';
import { ChatPage } from '@/components/chat/ChatPage';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { TagManager } from '@/components/tags/TagManager';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/**
 * Página principal da aplicação CRM para clínicas
 * 
 * Este componente gerencia:
 * - A navegação entre diferentes seções do sistema
 * - O estado da página ativa
 * - A integração entre sidebar e conteúdo principal
 * - Navegação automática para chat quando solicitado
 * - Controle da sidebar de categorias (TagManager) como painel deslizante
 * 
 * Páginas disponíveis:
 * - dashboard: Métricas e indicadores
 * - kanban: Gerenciamento de leads em formato kanban
 * - clients: Lista e CRUD de contatos (leads)
 * - chat: Interface de chat para comunicação
 * - calendar: Agenda de consultas
 * - settings: Configurações do sistema
 */
const Index = () => {
  // Estado que controla qual página está ativa no momento
  const [activePage, setActivePage] = useState('kanban');
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>();
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

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

  // Determina se o botão de categorias deve ser mostrado
  const shouldShowCategoriesButton = activePage !== 'chat' && activePage !== 'settings';

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
          /* Para outras páginas, mantemos o layout com padding */
          <main className="flex-1 p-4 md:p-6 min-w-0 overflow-auto relative">
            {renderContent()}
            
            {/* Botão flutuante para abrir categorias - apenas em páginas que fazem sentido */}
            {shouldShowCategoriesButton && (
              <Sheet open={isTagManagerOpen} onOpenChange={setIsTagManagerOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="fixed bottom-6 right-6 z-40 shadow-lg border-gray-300 bg-white hover:bg-gray-50"
                  >
                    <Tags size={16} className="mr-2" />
                    Categorias
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Gerenciar Categorias</SheetTitle>
                  </SheetHeader>
                  <div className="p-4 overflow-auto">
                    <TagManager />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </main>
        )}
      </div>
    </div>
  );
};

export default Index;
