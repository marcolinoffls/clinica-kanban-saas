
import ClientsPage from '@/components/clients/ClientsPage'; // Corrigir o import

/**
 * Página de Contatos
 * 
 * Lista e gerencia todos os contatos da clínica.
 * Esta página encapsula o componente ClientsPage existente
 * para permitir navegação via rotas distintas.
 */
const ContatosPage = () => {
  return <ClientsPage />;
};

export default ContatosPage;
