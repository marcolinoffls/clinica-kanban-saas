
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Tags } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { TagManager } from '@/components/tags/TagManager';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/**
 * Layout Principal da Aplicação
 * 
 * Fornece a estrutura básica com sidebar e área de conteúdo
 * para todas as páginas internas do sistema. Mantém a funcionalidade
 * do botão de categorias e controla quando deve ser exibido.
 * 
 * Componentes:
 * - Sidebar fixa com navegação
 * - Área de conteúdo principal (renderizada via Outlet)
 * - Painel deslizante de categorias (TagManager)
 */
const MainLayout = () => {
  const location = useLocation();
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Determina se o botão de categorias deve ser mostrado
  // Esconde em páginas que não fazem sentido ter categorias
  const shouldShowCategoriesButton = !['/chat', '/configuracoes'].includes(location.pathname);

  // Determina se a página atual é o chat (para layout especial)
  const isChatPage = location.pathname === '/chat';

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Barra lateral fixa com navegação */}
      <Sidebar />
      
      {/* Conteúdo principal da aplicação */}
      <div className="flex-1 flex min-w-0">
        {isChatPage ? (
          /* Para a página de chat, não adicionamos padding pois ela controla seu próprio layout */
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        ) : (
          /* Para outras páginas, mantemos o layout com padding */
          <main className="flex-1 p-4 md:p-6 min-w-0 overflow-auto relative">
            <Outlet />
            
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

export default MainLayout;
