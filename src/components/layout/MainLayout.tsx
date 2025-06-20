
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileSidebar } from './MobileSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="h-screen bg-gray-50">
      {/* Topbar - visível apenas em mobile */}
      <Topbar onMenuClick={toggleMobileSidebar} />
      
      <div className="flex h-full">
        {/* Sidebar desktop - oculta em mobile */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
          <Sidebar />
        </div>

        {/* Mobile Sidebar - off-canvas */}
        <MobileSidebar isOpen={isMobileSidebarOpen} onClose={toggleMobileSidebar} />

        {/* Área de conteúdo principal */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
