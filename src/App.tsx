
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClinicaProvider } from '@/contexts/ClinicaContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';

// Páginas
import WelcomePage from '@/pages/WelcomePage';
import SignInPage from '@/pages/SignInPage';
import SignUpPage from '@/pages/SignUpPage';
import DashboardPage from '@/pages/DashboardPage';
import LeadsPage from '@/pages/LeadsPage';
import ContatosPage from '@/pages/ContatosPage';
import ChatPageWrapper from '@/pages/ChatPageWrapper';
import AgendaPage from '@/pages/AgendaPage';
import ConfiguracoesPage from '@/pages/ConfiguracoesPage';
import ConfiguracoesIAPage from '@/pages/ConfiguracoesIAPage';
import AdminPage from '@/pages/AdminPage';
import NotFound from '@/pages/NotFound';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClinicaProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<WelcomePage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                
                {/* Rotas protegidas com layout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/leads" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <LeadsPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/contatos" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ContatosPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ChatPageWrapper />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/agenda" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AgendaPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/configuracoes" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ConfiguracoesPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />

                <Route path="/ia" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ConfiguracoesIAPage />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                
                {/* Página 404 */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </ClinicaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
