
/**
 * Página de Detalhes da Clínica no Painel Administrativo
 * 
 * O que faz:
 * Esta página é responsável por buscar o ID da clínica da URL (o endereço no navegador)
 * e renderizar o componente `AdminClinicDetails` com os dados corretos da clínica selecionada.
 * 
 * Onde é usada no app:
 * É acessada quando um administrador clica no botão "Detalhes" de uma clínica
 * na tabela do painel administrativo.
 * 
 * Como se conecta com outras partes:
 * - Usa o hook `useParams` do React Router para obter o `clinicaId` da URL.
 * - Renderiza o componente `AdminClinicDetails`, passando o `clinicaId` e uma função `onBack`.
 * - Usa o hook `useNavigate` para criar a função de "Voltar" (`onBack`), que leva o usuário
 *   de volta para a lista de clínicas em `/admin`.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { AdminClinicDetails } from '@/components/admin/AdminClinicDetails';

const AdminClinicDetailsPage = () => {
  // Extrai o ID da clínica dos parâmetros da URL. Ex: /admin/clinicas/ID_DA_CLINICA
  const { clinicaId } = useParams<{ clinicaId: string }>();
  const navigate = useNavigate();

  // Se o ID da clínica não for encontrado na URL, redireciona de volta para o painel de admin.
  // Isso é uma medida de segurança para evitar erros se a URL for acessada incorretamente.
  if (!clinicaId) {
    navigate('/admin');
    return null;
  }

  // Função para ser chamada quando o usuário clica no botão "Voltar" dentro de AdminClinicDetails.
  // A função usa o `navigate` para levar o usuário de volta à página principal do painel.
  const handleBack = () => {
    navigate('/admin');
  };

  // Renderiza o componente que mostra os detalhes da clínica, passando as props necessárias.
  return <AdminClinicDetails clinicaId={clinicaId} onBack={handleBack} />;
};

export default AdminClinicDetailsPage;
