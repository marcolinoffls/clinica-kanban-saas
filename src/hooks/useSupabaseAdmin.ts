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
    
    // Funções de busca
    buscarTodasClinicas,
    buscarClinicaPorId,
    buscarEstatisticasDeLeadsDaClinica,

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
