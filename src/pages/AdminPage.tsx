
import { AdminPanel } from '@/components/admin/AdminPanel';

/**
 * Página principal do Painel Administrativo
 * 
 * Esta página é acessível apenas por administradores do sistema.
 * Contém a funcionalidade completa de gerenciamento de clínicas,
 * estatísticas e configurações administrativas.
 * 
 * Funcionalidades principais:
 * - Visualização de todas as clínicas cadastradas
 * - Estatísticas de leads de anúncios por clínica
 * - Configuração de prompts específicos para IA
 * - Gerenciamento de IDs de instância de integração
 * - Controle de acesso baseado em permissões
 */

const AdminPage = () => {
  return <AdminPanel />;
};

export default AdminPage;
