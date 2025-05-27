// src/hooks/useClinicaData.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Ajuste o caminho se necessário
import { useAuthUser } from './useAuthUser'; // Ajuste o caminho se necessário

// Definição da interface para os dados da Clínica
// Certifique-se de que esta interface corresponde exatamente à estrutura da sua tabela 'clinicas'
interface Clinica {
  id: string; // UUID da clínica
  nome: string; // Nome da clínica
  email: string; // Email de contato da clínica
  telefone: string | null;
  endereco: string | null; // Campo antigo, pode ser obsoleto
  endereco_completo: string | null; // Endereço completo
  cnpj: string | null;
  razao_social: string | null;
  status: string | null; // ex: 'ativo', 'inativo'
  plano_contratado: string | null; // ex: 'básico', 'premium'
  webhook_usuario: string | null; // Se houver
  integracao_instance_id: string | null; // ID da instância de integração
  evolution_instance_name: string | null; // Nome da instância do Evolution API
  admin_prompt: string | null; // Prompt configurado pelo admin do sistema
  created_at: string | null; // Timestamp de criação
  updated_at: string | null; // Timestamp da última atualização
}

/**
 * Hook para buscar dados da clínica do usuário autenticado.
 *
 * Este hook utiliza o userProfile (que contém clinica_id) do usuário logado
 * para buscar informações completas da clínica à qual ele pertence.
 * Ele usa @tanstack/react-query para gerenciamento de dados, cache e estados.
 */
export const useClinicaData = () => {
  // 1. Obter o perfil do usuário e o estado de carregamento da autenticação do hook useAuthUser.
  //    userProfile deve conter o clinica_id se o usuário estiver associado a uma clínica.
  const { userProfile, loading: authLoading } = useAuthUser();

  // Log inicial para verificar o estado vindo de useAuthUser
  console.log('[useClinicaData] Iniciando. Auth Loading:', authLoading, 'UserProfile recebido:', userProfile);
  if (userProfile) {
    console.log('[useClinicaData] Detalhe do UserProfile.clinica_id:', userProfile.clinica_id);
  } else if (!authLoading) {
    console.warn('[useClinicaData] UserProfile é nulo e autenticação não está carregando. Usuário pode não estar logado ou perfil não encontrado.');
  }

  // 2. Determinar se a query para buscar dados da clínica deve ser habilitada.
  //    A query só deve rodar se:
  //    a) A autenticação não estiver mais carregando (authLoading é false).
  //    b) O userProfile existir.
  //    c) O userProfile.clinica_id existir (não ser null ou undefined).
  const queryEnabled = !!userProfile?.clinica_id && !authLoading;
  console.log('[useClinicaData] A query para buscar dados da clínica está habilitada? ->', queryEnabled);

  // 3. Usar useQuery do @tanstack/react-query para buscar os dados da clínica.
  const { 
    data: clinica, // Os dados da clínica, se a busca for bem-sucedida. Será 'undefined' inicialmente ou se a query estiver desabilitada/falhar.
    isLoading: clinicaLoading, // Booleano indicando se esta query específica está carregando.
    error // Objeto de erro se a queryFn lançar um erro.
  } = useQuery<Clinica | null, Error>({ // Tipagem explícita para data e error
    // Chave da query: Única para esta query. Inclui 'clinica' e o clinica_id do perfil.
    // O React Query usará isso para caching. Se userProfile.clinica_id mudar, a query será refeita.
    queryKey: ['clinica', userProfile?.clinica_id], 
    
    // Função que executa a busca dos dados.
    queryFn: async (): Promise<Clinica | null> => {
      // Esta verificação interna é uma redundância segura, pois 'enabled' já deve cuidar disso.
      // Mas é bom para logar o que acontece dentro da queryFn.
      if (!userProfile?.clinica_id) {
        console.warn('[useClinicaData - queryFn] Tentativa de executar queryFn, mas userProfile.clinica_id ainda é nulo/indefinido. Retornando null.');
        // Isso não deveria acontecer se 'enabled' estiver funcionando corretamente,
        // a menos que userProfile mude para null entre a avaliação de 'enabled' e a execução de 'queryFn'.
        return null; 
      }

      console.log(`[useClinicaData - queryFn] Buscando dados da clínica com ID: ${userProfile.clinica_id}`);

      // Chamada ao Supabase para buscar os dados da clínica.
      const { data, error: dbError } = await supabase
        .from('clinicas') // Nome da sua tabela de clínicas
        .select('*') // Seleciona todas as colunas (certifique-se de que a interface Clinica corresponde)
        .eq('id', userProfile.clinica_id) // Filtra pela ID da clínica do perfil do usuário
        .single(); // Espera um único resultado. Se não encontrar ou encontrar múltiplos, retorna erro.

      // Tratamento de erro da chamada ao Supabase.
      if (dbError) {
        console.error('[useClinicaData - queryFn] Erro ao buscar dados da clínica no Supabase:', dbError);
        // Lançar o erro faz com que o React Query coloque a query no estado 'error'.
        throw new Error(`Erro ao buscar dados da clínica: ${dbError.message}`);
      }

      // Log se os dados forem encontrados.
      if (data) {
        console.log('[useClinicaData - queryFn] Dados da clínica encontrados:', data);
      } else {
        // Isso pode acontecer se o clinica_id no userProfile não corresponder a nenhuma clínica
        // ou se a RLS impedir a leitura (embora a RLS de admin devesse permitir).
        console.warn(`[useClinicaData - queryFn] Nenhum dado da clínica encontrado para o ID: ${userProfile.clinica_id}`);
      }
      
      return data as Clinica | null; // Retorna os dados (ou null se não encontrado).
    },
    // Habilita a query apenas se as condições forem atendidas.
    enabled: queryEnabled,
    // Opcional: Tempo que os dados são considerados "frescos" antes de uma nova busca em background.
    staleTime: 5 * 60 * 1000, // 5 minutos (exemplo)
    // Opcional: Número de tentativas em caso de erro.
    retry: 1 // Tenta 1 vez adicional após a falha inicial (total de 2 tentativas)
  });

  // 4. Logar o resultado final do hook (dados da clínica, loading, erro).
  console.log('[useClinicaData] Estado final do hook -> clinica:', clinica, 'clinicaLoading:', clinicaLoading, 'error:', error);

  // 5. Retornar os dados e estados relevantes.
  return {
    clinica: clinica || null, // Garante que é Clinica ou null, não undefined.
    loading: authLoading || clinicaLoading, // O carregamento geral depende da auth E da busca da clínica.
    error, // Erro da query da clínica.
    
    // Funções utilitárias baseadas nos dados da clínica.
    hasClinica: !!clinica, // Verdadeiro se o objeto clinica tiver dados.
    clinicaId: clinica?.id || null, // Retorna o ID da clínica ou null.
    clinicaNome: clinica?.nome || undefined, // Retorna o nome da clínica ou undefined se não houver clínica.
  };
};