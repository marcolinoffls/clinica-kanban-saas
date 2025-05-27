
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Kanban, 
  CalendarDays, 
  Settings,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { LogoutButton } from '@/components/auth/LogoutButton';

/**
 * Componente da barra lateral de navegação
 * 
 * Funcionalidades:
 * - Navegação entre as diferentes seções do CRM
 * - Indicação visual da página ativa
 * - Design responsivo e acessível
 * - Usa o contexto da clínica para exibir informações consistentes
 * - Acesso ao painel administrativo para usuários com permissão
 * - Exibição de informações do usuário logado
 * - Botão de logout integrado
 * 
 * Props:
 * - activePage: string com a página atualmente ativa
 * - onPageChange: função para mudar de página
 */

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

// Array com todas as opções de navegação disponíveis
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Métricas e indicadores'
  },
  {
    id: 'kanban',
    label: 'Leads',
    icon: Kanban,
    description: 'Gerenciamento de leads'
  },
  {
    id: 'clients',
    label: 'Contatos',
    icon: Users,
    description: 'Base de contatos'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    description: 'Comunicação'
  },
  {
    id: 'calendar',
    label: 'Agenda',
    icon: CalendarDays,
    description: 'Agendamentos'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    description: 'Configurações do sistema'
  }
];

export const Sidebar = ({ activePage, onPageChange }: SidebarProps) => {
  // Usar o contexto da clínica para garantir dados consistentes
  const { clinicaAtiva, isLoading } = useClinica();
  
  // Usar o hook customizado de autenticação
  const { user, getDisplayName, getInitials } = useAuthUser();

  // Função para navegar para o painel administrativo
  const navegarParaAdmin = () => {
    window.location.href = '/admin';
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header da sidebar com logo da clínica */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">
          MediCRM
        </h1>
        <p className="text-sm text-gray-500">
          Sistema de Gestão
        </p>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    "hover:bg-blue-50 hover:text-blue-600",
                    isActive 
                      ? "bg-blue-100 text-blue-700 border border-blue-200" 
                      : "text-gray-600"
                  )}
                  title={item.description}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
          
          {/* Separador */}
          <li className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={navegarParaAdmin}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-red-50 hover:text-red-600 text-gray-600"
              title="Painel Administrativo - Acesso restrito"
            >
              <Shield size={20} />
              <span className="font-medium">Admin</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer da sidebar com informações do usuário e logout */}
      <div className="p-4 border-t border-gray-200 space-y-4">
        {/* Informações da clínica */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {clinicaAtiva.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {isLoading ? 'Carregando...' : clinicaAtiva.nome}
            </p>
            <p className="text-xs text-gray-500">Clínica</p>
          </div>
        </div>

        {/* Informações do usuário */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-semibold text-sm">
              {getInitials()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getDisplayName()}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Botão de logout */}
        <LogoutButton 
          variant="outline" 
          size="sm" 
          className="w-full justify-center"
        />
      </div>
    </aside>
  );
};
