
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TrialBanner } from '@/components/subscription/TrialBanner';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {/* Banner de Trial - exibido apenas durante o período de teste */}
          <TrialBanner />
          
          {/* Conteúdo principal da página */}
          {children}
        </main>
      </div>
    </div>
  );
};
