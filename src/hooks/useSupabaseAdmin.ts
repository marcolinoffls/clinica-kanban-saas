import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para operações administrativas no Supabase
 * 
 * Centraliza todas as operações que requerem privilégios administrativos,
 * incluindo busca de clínicas, usuários, estatísticas e configurações.
 */
export const useSupabaseAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  const obterUserIdAtual = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }, []);

  const verificarPermissaoAdmin = useCallback(async (): Promise<boolean> => {
    const userId = await obterUserIdAtual();
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_type')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Erro ao verificar perfil de admin:", error.message);
        return false;
      }
      
      return data?.profile_type === 'admin';
    } catch (error) {
      console.error("Exceção ao verificar permissão de admin:", error);
      return false;
    }
  }, [obterUserIdAtual]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setAdminCheckLoading(true);
      const adminStatus = await verificarPermissaoAdmin();
      setIsAdmin(adminStatus);
      setAdminCheckLoading(false);
    };
    checkAdminStatus();
  }, [verificarPermissaoAdmin]);

  // ✅ FUNÇÃO DE ATUALIZAÇÃO QUE ESTAVA FALTANDO
  const atualizarConfiguracaoEvolution = async (
    clinicaId: string, 
    instanceName?: string, 
    apiKey?: string
  ) => {
    if (!isAdmin) {
      toast.error("Acesso negado", { description: "Você não tem permissão para realizar esta ação." });
      throw new Error('Acesso negado: usuário não é administrador');
    }
    
    try {
      console.log(`[useSupabaseAdmin] Atualizando config da clínica: ${clinicaId}`);
      
      const updateData: any = {};
      if (instanceName !== undefined) updateData.evolution_instance_name = instanceName;
      if (apiKey !== undefined) updateData.evolution_api_key = apiKey;

      if (Object.keys(updateData).length === 0) {
        toast.warning("Nenhuma alteração para salvar.");
        return null;
      }

      const { data, error } = await supabase
        .from('clinicas')
        .update(updateData)
        .eq('id', clinicaId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar configuração Evolution:', error);
        throw new Error(`Falha ao salvar configuração: ${error.message}`);
      }

      console.log('✅ Configuração Evolution salva com sucesso:', data);
      return data;
    } catch (error: any) {
      toast.error("Erro ao Salvar", { description: error.message });
      throw error;
    }
  };

  const buscarClinicaPorId = async (clinicaId: string) => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .eq('id', clinicaId)
      .single();

    if (error) throw error;
    return data;
  };

  const buscarEstatisticasDeLeadsDaClinica = async (clinicaId: string) => {
    if (!isAdmin) throw new Error('Acesso negado');

    const { data, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('clinica_id', clinicaId);

    if (error) throw error;
    return { totalLeads: data?.length || 0 };
  };

  // ... outras funções de busca podem ser adicionadas aqui ...

  return {
    loading: loading || adminCheckLoading,
    clinicas,
    isAdmin,
    adminCheckLoading,
    buscarClinicaPorId,
    buscarEstatisticasDeLeadsDaClinica,
    // ✅ EXPORTANDO A FUNÇÃO DE ATUALIZAÇÃO
    atualizarConfiguracaoEvolution,
  };
};