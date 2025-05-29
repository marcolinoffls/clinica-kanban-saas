import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClinicaProvider } from "@/contexts/ClinicaContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import ContatosPage from "./pages/ContatosPage";
import ChatPageWrapper from "./pages/ChatPageWrapper";
import AgendaPage from "./pages/AgendaPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import AdminPage from "./pages/AdminPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import WelcomePage from "./pages/WelcomePage";
import NotFound from "./pages/NotFound";
import ConfiguracoesIAPage from "./pages/ConfiguracoesIAPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ClinicaProvider>
          <BrowserRouter>
            <Routes>
              {/* Página pública de boas-vindas */}
              <Route path="/welcome" element={<WelcomePage />} />
              
              {/* Rotas públicas de autenticação */}
              <Route path="/login" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              
              {/* Redirecionar raiz para dashboard */}
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
              
              {/* Rotas protegidas com layout principal */}
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                {/* Rotas das páginas principais */}
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="contatos" element={<ContatosPage />} />
                <Route path="chat" element={<ChatPageWrapper />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="ia" element={<ConfiguracoesIAPage />} />
                <Route path="configuracoes" element={<ConfiguracoesPage />} />
              </Route>
              
              {/* Rota do admin (sem layout principal pois tem seu próprio layout) */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Página 404 para rotas não encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ClinicaProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
