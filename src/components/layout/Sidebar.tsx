import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Kanban, 
  CalendarDays, 
  Settings,
  Shield,
  Bot,
  Columns
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { LogoutButton } from '@/components/auth/LogoutButton';

/**
 * Componente da barra lateral de navegação
 * 
 * Funcionalidades:
 * - Navegação entre as diferentes seções do CRM via React Router
 * - Indicação visual da página ativa baseada na URL atual
 * - Design responsivo e acessível
 * - Usa o contexto da clínica para exibir informações consistentes
 * - Acesso ao painel administrativo para usuários com permissão
 * - Exibição de informações do usuário logado
 * - Botão de logout integrado
 * - Item especial de IA com gradiente azul
 * - Verificações de segurança para dados de clínica
 */

// Array com todas as opções de navegação disponíveis
// O item 'Leads' foi removido para centralizar o Kanban no 'Funil'.
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Métricas e indicadores',
    path: '/dashboard'
  },
  {
    id: 'pipeline',
    label: 'Funil',
    icon: Columns,
    description: 'Funil de vendas Kanban',
    path: '/pipeline'
  },
  {
    id: 'contatos',
    label: 'Contatos',
    icon: Users,
    description: 'Base de contatos',
    path: '/contatos'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    description: 'Comunicação',
    path: '/chat'
  },
  {
    id: 'agenda',
    label: 'Agenda',
    icon: CalendarDays,
    description: 'Agendamentos',
    path: '/agenda'
  },
  {
    id: 'ia',
    label: 'Inteligência Artificial',
    icon: Bot,
    description: 'Configurações da IA',
    path: '/ia',
    isSpecial: true // Flag para identificar o item especial
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Settings,
    description: 'Configurações do sistema',
    path: '/configuracoes'
  }
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Usar o contexto da clínica para garantir dados consistentes
  const { clinicaAtiva, isLoading } = useClinica();
  
  // Usar o hook customizado de autenticação
  const { user, getDisplayName, getInitials } = useAuthUser();

  // Função para navegar para o painel administrativo
  const navegarParaAdmin = () => {
    navigate('/admin');
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
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    // Estilo especial para o item de IA
                    item.isSpecial
                      ? "bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 text-white hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 shadow-md"
                      : isActive 
                        ? "bg-blue-100 text-blue-700 border border-blue-200" 
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  )}
                  title={item.description}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
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
        {/* Informações da clínica - com verificações de segurança */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {clinicaAtiva?.nome ? clinicaAtiva.nome.charAt(0).toUpperCase() : 'C'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {isLoading ? 'Carregando...' : (clinicaAtiva?.nome || 'Clínica')}
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
