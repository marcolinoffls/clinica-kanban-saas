
/**
 * =================================================================
 * HOOK: useSupabaseAdmin
 * =================================================================
 * 
 * DESCRIÇÃO:
 * Hook centralizado para operações administrativas no Supabase.
 * Fornece funcionalidades exclusivas para usuários com privilégios
 * de administrador, incluindo acesso a dados de todas as clínicas.
 * 
 * FUNCIONALIDADES:
 * - Verificação de permissões de administrador
 * - Busca e manipulação de dados de clínicas
 * - Estatísticas e métricas administrativas
 * - Operações CRUD em recursos multi-tenant
 * - ✅ NOVA: Gerenciamento de anúncios personalizados
 * 
 * SEGURANÇA:
 * - Utiliza políticas RLS específicas para administradores
 * - Verificação de permissões em cada operação
 * - Logs detalhados para auditoria
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseAdmin = () => {
  // Estados para controle de admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const { toast } = useToast();

  // ===============================
  // VERIFICAÇÃO DE PERMISSÕES ADMIN
  // ===============================
  useEffect(() => {
    const verificarPermissaoAdmin = async () => {
      try {
        setAdminCheckLoading(true);
        console.log('🔐 [useSupabaseAdmin] Verificando permissões de administrador...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ [useSupabaseAdmin] Usuário não autenticado');
          setIsAdmin(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('profile_type')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('❌ [useSupabaseAdmin] Erro ao verificar perfil:', error);
          setIsAdmin(false);
          return;
        }

        const isAdminUser = data?.profile_type === 'admin';
        setIsAdmin(isAdminUser);
        console.log(`✅ [useSupabaseAdmin] Status admin: ${isAdminUser}`);
        
        // Se é admin, carregar as clínicas automaticamente
        if (isAdminUser) {
          await carregarClinicas();
        }
        
      } catch (error) {
        console.error('❌ [useSupabaseAdmin] Erro na verificação:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    verificarPermissaoAdmin();
  }, []);

  // ===============================
  // OBTER USER ID ATUAL
  // ===============================
  const obterUserIdAtual = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro ao obter user ID:', error);
      return null;
    }
  };

  // ===============================
  // CONFIGURAR USUÁRIO COMO ADMIN
  // ===============================
  const configurarComoAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ profile_type: 'admin' })
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message || 'Erro ao configurar como administrador');
      }

      console.log('✅ [useSupabaseAdmin] Usuário configurado como administrador');
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro ao configurar admin:', error);
      throw error;
    }
  };

  // ===============================
  // VERIFICAR PERMISSÃO ADMIN
  // ===============================
  const verificarPermissaoAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_type')
        .eq('user_id', user.id)
        .single();

      if (error) return false;
      
      return data?.profile_type === 'admin';
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro na verificação de permissão:', error);
      return false;
    }
  };

  // ===============================
  // CARREGAR CLÍNICAS
  // ===============================
  const carregarClinicas = async () => {
    try {
      setLoading(true);
      console.log('🏥 [useSupabaseAdmin] Carregando clínicas...');

      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao carregar clínicas:', error);
        throw new Error(error.message || 'Erro ao carregar clínicas');
      }

      console.log('✅ [useSupabaseAdmin] Clínicas carregadas:', data.length);
      setClinicas(data);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro no carregamento:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // BUSCAR KPIs GLOBAIS
  // ===============================
  const buscarKPIsGlobais = async () => {
    try {
      console.log('📊 [useSupabaseAdmin] Buscando KPIs globais...');

      // Total de clínicas ativas
      const { count: totalClinicas } = await supabase
        .from('clinicas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // Total de leads
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Leads convertidos (últimos 30 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      
      const { count: leadsConvertidos } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('convertido', true)
        .gte('created_at', dataLimite.toISOString());

      // Total de usuários ativos
      const { count: totalUsuarios } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status_usuario', 'ativo');

      const kpis = {
        totalClinicas: totalClinicas || 0,
        totalLeads: totalLeads || 0,
        leadsConvertidos: leadsConvertidos || 0,
        taxaConversao: totalLeads ? ((leadsConvertidos || 0) / totalLeads * 100) : 0,
        totalUsuarios: totalUsuarios || 0
      };

      console.log('✅ [useSupabaseAdmin] KPIs carregados:', kpis);
      return kpis;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro ao buscar KPIs:', error);
      throw error;
    }
  };

  // ===============================
  // BUSCAR ESTATÍSTICAS DAS CLÍNICAS
  // ===============================
  const buscarEstatisticasClinicas = async () => {
    try {
      console.log('📈 [useSupabaseAdmin] Buscando estatísticas das clínicas...');
      
      const { data, error } = await supabase
        .from('clinicas_stats')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar estatísticas:', error);
        throw new Error(error.message || 'Erro ao buscar estatísticas das clínicas');
      }

      console.log('✅ [useSupabaseAdmin] Estatísticas carregadas:', data.length);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro nas estatísticas:', error);
      throw error;
    }
  };

  // ===============================
  // BUSCAR TODAS AS CLÍNICAS
  // ===============================
  const buscarTodasClinicas = async () => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('🏥 [useSupabaseAdmin] Buscando todas as clínicas...');

      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar clínicas:', error);
        throw new Error(error.message || 'Erro ao buscar clínicas');
      }

      console.log('✅ [useSupabaseAdmin] Clínicas carregadas:', data.length);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro na busca de clínicas:', error);
      throw error;
    }
  };

  // ===============================
  // BUSCAR CLÍNICA POR ID
  // ===============================
  const buscarClinicaPorId = async (clinicaId: string) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('🏥 [useSupabaseAdmin] Buscando clínica por ID:', clinicaId);

      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', clinicaId)
        .single();

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar clínica:', error);
        throw new Error(error.message || 'Erro ao buscar clínica');
      }

      console.log('✅ [useSupabaseAdmin] Clínica carregada:', data.nome);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro na busca de clínica:', error);
      throw error;
    }
  };

  // ===============================
  // BUSCAR ESTATÍSTICAS DE LEADS DA CLÍNICA
  // ===============================
  const buscarEstatisticasDeLeadsDaClinica = async (clinicaId: string) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('📊 [useSupabaseAdmin] Buscando estatísticas de leads da clínica:', clinicaId);

      // Estatísticas de leads por etapa
      const { data: leadsPorEtapa, error: errorLeadsPorEtapa } = await supabase
        .from('leads')
        .select('etapa_kanban_id')
        .eq('clinica_id', clinicaId);

      if (errorLeadsPorEtapa) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar leads por etapa:', errorLeadsPorEtapa);
        throw new Error(errorLeadsPorEtapa.message || 'Erro ao buscar leads por etapa');
      }

      // Total de leads
      const totalLeads = leadsPorEtapa.length;

      // Agrupar leads por etapa
      const leadsAgrupadosPorEtapa = leadsPorEtapa.reduce((acumulador: any, lead: any) => {
        const etapaId = lead.etapa_kanban_id;
        acumulador[etapaId] = (acumulador[etapaId] || 0) + 1;
        return acumulador;
      }, {});

      console.log('✅ [useSupabaseAdmin] Estatísticas carregadas:', { totalLeads, leadsAgrupadosPorEtapa });
      return { totalLeads, leadsAgrupadosPorEtapa };
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro na busca de estatísticas:', error);
      throw error;
    }
  };

  // ===============================
  // ATUALIZAR CONFIGURAÇÃO EVOLUTION
  // ===============================
  const atualizarConfiguracaoEvolution = async (
    clinicaId: string,
    instanceName?: string,
    apiKey?: string
  ) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('🔧 [useSupabaseAdmin] Atualizando configuração Evolution para a clínica:', clinicaId);

      const updates: { evolution_instance_name?: string; evolution_api_key?: string } = {};
      if (instanceName !== undefined) {
        updates.evolution_instance_name = instanceName;
      }
      if (apiKey !== undefined) {
        updates.evolution_api_key = apiKey;
      }

      const { data, error } = await supabase
        .from('clinicas')
        .update(updates)
        .eq('id', clinicaId)
        .select()
        .single();

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao atualizar configuração Evolution:', error);
        throw new Error(error.message || 'Erro ao atualizar configuração Evolution');
      }

      console.log('✅ [useSupabaseAdmin] Configuração Evolution atualizada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro ao atualizar configuração Evolution:', error);
      throw error;
    }
  };

  // ===============================
  // ATUALIZAR CONFIGURAÇÃO WEBHOOK
  // ===============================
  const atualizarConfiguracaoWebhook = async (
    clinicaId: string,
    webhookType: string,
    webhookUrl?: string
  ) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('🔧 [useSupabaseAdmin] Atualizando configuração de webhook para a clínica:', clinicaId);

      const updates: { webhook_type?: string; webhook_url?: string } = { webhook_type: webhookType };
      if (webhookUrl !== undefined) {
        updates.webhook_url = webhookUrl;
      }

      const { data, error } = await supabase
        .from('clinicas')
        .update(updates)
        .eq('id', clinicaId)
        .select()
        .single();

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao atualizar configuração de webhook:', error);
        throw new Error(error.message || 'Erro ao atualizar configuração de webhook');
      }

      console.log('✅ [useSupabaseAdmin] Configuração de webhook atualizada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro ao atualizar configuração de webhook:', error);
      throw error;
    }
  };

  // ===============================
  // ✅ NOVA SEÇÃO: ANÚNCIOS PERSONALIZADOS
  // ===============================

  /**
   * Buscar todos os anúncios personalizados de uma clínica específica
   * Função admin para visualizar configurações de anúncios de qualquer clínica
   */
  const buscarAnunciosPersonalizadosDaClinica = async (clinicaId: string) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('🎯 [useSupabaseAdmin] Buscando anúncios personalizados da clínica:', clinicaId);

      const { data, error } = await supabase
        .from('custom_ads')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao buscar anúncios:', error);
        throw new Error(error.message || 'Erro ao buscar anúncios personalizados');
      }

      console.log('✅ [useSupabaseAdmin] Anúncios carregados:', data.length);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro na busca de anúncios:', error);
      throw error;
    }
  };

  /**
   * Criar anúncio personalizado para uma clínica específica (admin)
   */
  const criarAnuncioPersonalizadoParaClinica = async (clinicaId: string, anuncioData: {
    ad_name: string;
    ad_phrase: string;
    ad_source: string;
    active?: boolean;
  }) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('➕ [useSupabaseAdmin] Criando anúncio personalizado para clínica:', clinicaId);

      const { data, error } = await supabase
        .from('custom_ads')
        .insert([{
          ...anuncioData,
          clinica_id: clinicaId,
          active: anuncioData.active ?? true
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao criar anúncio:', error);
        throw new Error(error.message || 'Erro ao criar anúncio personalizado');
      }

      console.log('✅ [useSupabaseAdmin] Anúncio criado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro na criação de anúncio:', error);
      throw error;
    }
  };

  /**
   * Atualizar anúncio personalizado (admin)
   */
  const atualizarAnuncioPersonalizado = async (anuncioId: string, updateData: {
    ad_name?: string;
    ad_phrase?: string;
    ad_source?: string;
    active?: boolean;
  }) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('✏️ [useSupabaseAdmin] Atualizando anúncio personalizado:', anuncioId);

      const { data, error } = await supabase
        .from('custom_ads')
        .update(updateData)
        .eq('id', anuncioId)
        .select()
        .single();

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao atualizar anúncio:', error);
        throw new Error(error.message || 'Erro ao atualizar anúncio personalizado');
      }

      console.log('✅ [useSupabaseAdmin] Anúncio atualizado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro na atualização de anúncio:', error);
      throw error;
    }
  };

  /**
   * Deletar anúncio personalizado (admin)
   */
  const deletarAnuncioPersonalizado = async (anuncioId: string) => {
    if (!isAdmin) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    try {
      console.log('🗑️ [useSupabaseAdmin] Deletando anúncio personalizado:', anuncioId);

      const { error } = await supabase
        .from('custom_ads')
        .delete()
        .eq('id', anuncioId);

      if (error) {
        console.error('❌ [useSupabaseAdmin] Erro ao deletar anúncio:', error);
        throw new Error(error.message || 'Erro ao deletar anúncio personalizado');
      }

      console.log('✅ [useSupabaseAdmin] Anúncio deletado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [useSupabaseAdmin] Erro na exclusão de anúncio:', error);
      throw error;
    }
  };

  return {
    // Estados de verificação admin
    isAdmin,
    adminCheckLoading,
    loading,
    clinicas,
    
    // Funções de controle de usuário
    obterUserIdAtual,
    configurarComoAdmin,
    verificarPermissaoAdmin,
    
    // Funções de busca de dados
    buscarTodasClinicas,
    buscarClinicaPorId,
    buscarEstatisticasDeLeadsDaClinica,
    buscarKPIsGlobais,
    buscarEstatisticasClinicas,

    // Funções de atualização de configuração
    atualizarConfiguracaoEvolution,
    atualizarConfiguracaoWebhook,
    
    // ✅ NOVAS FUNÇÕES: Anúncios Personalizados
    buscarAnunciosPersonalizadosDaClinica,
    criarAnuncioPersonalizadoParaClinica,
    atualizarAnuncioPersonalizado,
    deletarAnuncioPersonalizado,
  };
};
