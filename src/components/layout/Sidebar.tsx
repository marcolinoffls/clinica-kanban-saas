
/**
 * Componente de Sidebar
 * 
 * DESCRIÇÃO:
 * Barra lateral de navegação principal da aplicação.
 * Contém links para todas as seções principais do sistema,
 * indicadores de status e informações da clínica.
 * 
 * FUNCIONALIDADES:
 * - Navegação entre páginas principais
 * - Indicação da página ativa
 * - Links condicionais baseados em permissões
 * - Responsivo para mobile e desktop
 * 
 * INTEGRAÇÃO:
 * - Usa React Router para navegação
 * - Conecta com contexto de autenticação
 * - Exibe informações da clínica atual
 */

import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Calendar,
  Settings, 
  PlusCircle,
  CreditCard,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Definição dos itens de navegação
const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard", 
    icon: LayoutDashboard,
    description: "Visão geral e métricas"
  },
  {
    name: "Pipeline",
    href: "/pipeline",
    icon: PlusCircle,
    description: "Gerenciar funil de vendas"
  },
  {
    name: "Contatos",
    href: "/contatos",
    icon: Users,
    description: "Lista de leads e clientes"
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageSquare,
    description: "Conversas com leads"
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: Calendar,
    description: "Compromissos e agendamentos"
  },
  {
    name: "IA",
    href: "/ia",
    icon: Brain,
    description: "Configurações de inteligência artificial"
  },
  {
    name: "Cobrança",
    href: "/billing",
    icon: CreditCard,
    description: "Planos e assinaturas"
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    description: "Configurações da clínica"
  },
];

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Header da Sidebar */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          MediCRM
        </h1>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive 
                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer da Sidebar com informações do usuário */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500">
          Logado como: {user?.email}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
