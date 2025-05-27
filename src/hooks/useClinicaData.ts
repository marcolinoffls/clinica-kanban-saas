// src/hooks/useClinicaData.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Ajuste o caminho se necessário
import { useAuthUser } from './useAuthUser'; // Ajuste o caminho se necessário

/**
 * @interface Clinica
 * Define a estrutura dos dados esperados para uma clínica.
 * É crucial que esta interface corresponda exatamente às colunas da sua tabela 'public.clinicas'.
 */
interface Clinica {
  id: string; 
  nome: string; 
  email: string; 
  telefone: string | null;
  // endereco: string | null; // Considerado obsoleto no comentário original
  endereco_completo: string | null; 
  cnpj: string | null;
  razao_social: string | null;
  status: string | null; 
  plano_contratado: string | null; 
  webhook_usuario: string | null; 
  integracao_instance_id: string | null; 
  evolution_instance_name: string | null; 
  admin_prompt: string | null; 
  created_at: string | null; 
  updated_at: string | null; 
}

/**
 * Hook `useClinicaData`
 * Responsável por buscar os dados completos da clínica associada ao usuário autenticado.
 * Utiliza o `userProfile` (que contém `clinica_id`) do hook `useAuthUser`.
 * Emprega `@tanstack/react-query` para uma gestão eficiente de dados assíncronos,
 * incluindo caching, estados de carregamento e tratamento de erros.
 */
export const useClinicaData = () => {
  // 1. Obtém o perfil do usuário (`userProfile`) e o estado de carregamento da autenticação (`authLoading`)
  //    do hook `useAuthUser`. O `userProfile` é essencial pois contém o `clinica_id`.
  const { userProfile, loading: authLoading } = useAuthUser();

  // Log de desenvolvimento: Informa o estado inicial ao executar o hook, mostrando
  // o que foi recebido de `useAuthUser`. Útil para diagnosticar se `userProfile` está chegando corretamente.
  if (process.env.NODE_ENV === 'development') {
    console.log('[useClinicaData DEV_LOG] Iniciando. Auth Loading:', authLoading, 'UserProfile recebido:', userProfile);
    if (userProfile) {
      console.log('[useClinicaData DEV_LOG] Detalhe do UserProfile.clinica_id:', userProfile.clinica_id);
    } else if (!authLoading) {
      // Este aviso é importante se o perfil não for encontrado após a autenticação ter carregado.
      console.warn('[useClinicaData DEV_LOG] UserProfile é nulo e autenticação não está carregando. Usuário pode não estar logado ou perfil não encontrado na tabela user_profiles.');
    }
  }

  // 2. Determina se a query para buscar os dados da clínica deve ser executada.
  //    Condições:
  //    a) `authLoading` deve ser `false` (o hook `useAuthUser` terminou de carregar o perfil básico).
  //    b) `userProfile` deve existir.
  //    c) `userProfile.clinica_id` deve existir (ser uma string não vazia).
  const queryEnabled = !!userProfile?.clinica_id && !authLoading;
  if (process.env.NODE_ENV === 'development') {
    console.log('[useClinicaData DEV_LOG] A query para buscar dados da clínica está habilitada (queryEnabled)? ->', queryEnabled);
  }

  // 3. Utiliza `useQuery` para buscar os dados da clínica de forma declarativa.
  const { 
    data: clinica, // Dados da clínica. `undefined` enquanto carrega ou se desabilitado/erro.
    isLoading: clinicaLoading, // Estado de carregamento específico desta query.
    error // Objeto de erro se a `queryFn` falhar.
  } = useQuery<Clinica | null, Error>({
    // Chave da query: Identificador único para esta busca.
    // Inclui o `clinica_id` para que, se ele mudar, a query seja refeita automaticamente.
    queryKey: ['clinicaData', userProfile?.clinica_id], 
    
    // Função assíncrona que realiza a busca dos dados no Supabase.
    queryFn: async (): Promise<Clinica | null> => {
      // Verificação de segurança dentro da queryFn, embora 'enabled' deva prevenir isso.
      // Se por algum motivo a query rodar sem clinica_id, retorna null e loga um aviso.
      if (!userProfile?.clinica_id) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useClinicaData DEV_LOG - queryFn] Tentativa de executar queryFn, mas userProfile.clinica_id é nulo/indefinido. Retornando null.');
        }
        return null; 
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[useClinicaData DEV_LOG - queryFn] Buscando dados da clínica com ID: ${userProfile.clinica_id}`);
      }

      // Executa a query no Supabase.
      const { data, error: dbError } = await supabase
        .from('clinicas') 
        .select('*') 
        .eq('id', userProfile.clinica_id) 
        .single(); 

      // Tratamento de erro da chamada ao Supabase.
      if (dbError) {
        if (process.env.NODE_ENV === 'development') {
          // Loga o erro detalhado do Supabase apenas em desenvolvimento.
          console.error('[useClinicaData DEV_LOG - queryFn] Erro ao buscar dados da clínica no Supabase:', dbError);
        }
        // Lança um erro que será capturado pelo React Query e populado no hook `error`.
        // Evita expor a mensagem dbError.message diretamente ao usuário em produção, se desejado.
        throw new Error('Falha ao carregar dados da clínica.'); 
      }

      // Log de sucesso e dos dados encontrados (apenas em desenvolvimento).
      if (process.env.NODE_ENV === 'development') {
        if (data) {
          console.log('[useClinicaData DEV_LOG - queryFn] Dados da clínica encontrados:', data);
        } else {
          // Este caso pode ocorrer se o clinica_id do perfil não existir na tabela 'clinicas'
          // ou se a RLS bloquear a leitura (embora a RLS de usuário para sua própria clínica devesse permitir).
          console.warn(`[useClinicaData DEV_LOG - queryFn] Nenhum dado de clínica encontrado para o ID: ${userProfile.clinica_id}. Verifique a RLS da tabela 'clinicas' e se o ID existe.`);
        }
      }
      
      return data as Clinica | null; // Faz o cast para Clinica ou null.
    },
    enabled: queryEnabled, // A query só é executada se queryEnabled for true.
    staleTime: 5 * 60 * 1000, // Dados são considerados "frescos" por 5 minutos.
    retry: 1, // Tenta novamente 1 vez em caso de erro.
    // Adicionar um placeholderData ou initialData pode ser útil para evitar undefined
    // initialData: null, // Por exemplo
  });

  // Log de desenvolvimento: Mostra o estado final do hook após a execução da query.
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[useClinicaData DEV_LOG] Estado final do hook -> clinica:', clinica, 
      'clinicaLoading:', clinicaLoading, 
      'authLoading (do useAuthUser):', authLoading,
      'error:', error
    );
  }

  // 4. Retorna os dados da clínica, estados de carregamento e erro, e algumas funções utilitárias.
  const isLoadingOverall = authLoading || clinicaLoading;

  return {
    clinica: clinica || null, // Garante que o retorno seja Clinica | null.
    loading: isLoadingOverall, // Estado de carregamento combinado.
    error: error || null, // Garante que o erro seja Error | null.
    
    hasClinica: !!clinica && !isLoadingOverall && !error, // Verdadeiro se 'clinica' tem dados e não está carregando/com erro.
    clinicaId: clinica?.id || null,
    // Retorna undefined para clinicaNome se não houver clínica, para ser mais explícito do que uma string padrão.
    clinicaNome: clinica?.nome || undefined, 
  };
};