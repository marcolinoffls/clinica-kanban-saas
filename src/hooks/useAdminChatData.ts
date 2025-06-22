
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAdmin } from './useSupabaseAdmin';

/**
 * Hook para gerenciar dados de chat para administradores
 * 
 * O que faz:
 * - Carrega leads e mensagens de uma clínica específica
 * - Bypassa restrições RLS para usuários admin
 * - Gerencia contadores de mensagens não lidas por clínica
 * 
 * Onde é usado:
 * - ChatPage quando usuário é administrador
 * 
 * Como se conecta:
 * - Usa verificação de permissão admin do useSupabaseAdmin
 * - Acessa dados do Supabase com privilégios administrativos
 * - Filtra dados por clinica_id específico
 */

interface AdminChatData {
  leads: any[];
  mensagensNaoLidas: Record<string, number>;
  loading: boolean;
  error: string | null;
  marcarMensagensComoLidasAdmin: (leadId: string) => Promise<void>;
}

export const useAdminChatData = (clinicaId: string | null): AdminChatData => {
  const [leads, setLeads] = useState<any[]>([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { verificarPermissaoAdmin } = useSupabaseAdmin();

  // Função para buscar leads de uma clínica específica
  const buscarLeadsClinica = async (targetClinicaId: string) => {
    try {
      console.log(`📋 [useAdminChatData] Buscando leads da clínica: ${targetClinicaId}`);
      
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          nome_clinica
        `)
        .eq('clinica_id', targetClinicaId)
        .order('data_ultimo_contato', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Erro ao buscar leads da clínica:', error);
        throw error;
      }

      console.log(`✅ [useAdminChatData] Encontrados ${data?.length || 0} leads da clínica`);
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar leads da clínica:', err);
      throw err;
    }
  };

  // Função para buscar contadores de mensagens não lidas por lead
  const buscarMensagensNaoLidasClinica = async (targetClinicaId: string) => {
    try {
      console.log(`📊 [useAdminChatData] Buscando mensagens não lidas da clínica: ${targetClinicaId}`);
      
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('lead_id')
        .eq('clinica_id', targetClinicaId)
        .eq('lida', false)
        .eq('enviado_por', 'lead');

      if (error) {
        console.error('Erro ao buscar mensagens não lidas:', error);
        throw error;
      }

      // Contar mensagens não lidas por lead
      const contadores: Record<string, number> = {};
      data?.forEach((msg) => {
        contadores[msg.lead_id] = (contadores[msg.lead_id] || 0) + 1;
      });

      console.log(`✅ [useAdminChatData] Contadores de mensagens não lidas carregados:`, contadores);
      return contadores;
    } catch (err: any) {
      console.error('Erro ao buscar mensagens não lidas:', err);
      throw err;
    }
  };

  // Função para carregar todos os dados da clínica
  const carregarDadosClinica = async () => {
    if (!clinicaId) {
      setLeads([]);
      setMensagensNaoLidas({});
      setLoading(false);
      return;
    }

    // Verificar se o usuário é admin antes de carregar dados
    const isAdmin = await verificarPermissaoAdmin();
    if (!isAdmin) {
      setError('Acesso negado: usuário não é administrador');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 [useAdminChatData] Carregando dados administrativos da clínica: ${clinicaId}`);
      
      // Carregar leads e mensagens não lidas em paralelo
      const [leadsData, mensagensData] = await Promise.all([
        buscarLeadsClinica(clinicaId),
        buscarMensagensNaoLidasClinica(clinicaId)
      ]);

      setLeads(leadsData);
      setMensagensNaoLidas(mensagensData);
      
      console.log(`✅ [useAdminChatData] Dados da clínica carregados com sucesso`);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido ao carregar dados da clínica';
      console.error(`❌ [useAdminChatData] ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para marcar mensagens como lidas (admin)
  const marcarMensagensComoLidasAdmin = async (leadId: string) => {
    if (!clinicaId) return;

    try {
      console.log(`📝 [useAdminChatData] Admin marcando mensagens como lidas para lead: ${leadId}`);
      
      const { error } = await supabase
        .from('chat_mensagens')
        .update({ lida: true })
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaId)
        .eq('enviado_por', 'lead')
        .eq('lida', false);

      if (error) {
        console.error('Erro ao marcar mensagens como lidas (admin):', error);
        throw error;
      }

      // Atualizar contador local
      setMensagensNaoLidas(prev => {
        const updated = { ...prev };
        delete updated[leadId];
        return updated;
      });

      console.log(`✅ [useAdminChatData] Mensagens marcadas como lidas para lead ${leadId}`);
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas (admin):', error);
    }
  };

  // Carregar dados quando clinicaId muda
  useEffect(() => {
    carregarDadosClinica();
  }, [clinicaId]);

  // Configurar subscription para atualizações em tempo real (admin)
  useEffect(() => {
    if (!clinicaId) return;

    console.log(`🔗 [useAdminChatData] Configurando subscription para clínica: ${clinicaId}`);

    // Canal para escutar novos leads da clínica
    const canalLeads = supabase
      .channel(`admin-leads-${clinicaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `clinica_id=eq.${clinicaId}`
        },
        (payload) => {
          console.log('📥 [Admin] Novo lead detectado na clínica:', payload.new);
          setLeads(prev => [payload.new as any, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `clinica_id=eq.${clinicaId}`
        },
        (payload) => {
          console.log('📝 [Admin] Lead atualizado na clínica:', payload.new);
          setLeads(prev => prev.map(lead => 
            lead.id === (payload.new as any).id ? payload.new as any : lead
          ));
        }
      )
      .subscribe();

    // Canal para escutar novas mensagens da clínica
    const canalMensagens = supabase
      .channel(`admin-mensagens-${clinicaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensagens',
          filter: `clinica_id=eq.${clinicaId}`
        },
        (payload) => {
          console.log('📨 [Admin] Nova mensagem detectada na clínica:', payload.new);
          const novaMensagem = payload.new as any;

          // Atualizar contador de mensagens não lidas
          if (novaMensagem.enviado_por === 'lead' && !novaMensagem.lida) {
            setMensagensNaoLidas(contadores => ({
              ...contadores,
              [novaMensagem.lead_id]: (contadores[novaMensagem.lead_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    // Função de limpeza
    return () => {
      console.log(`🧹 [useAdminChatData] Removendo subscriptions da clínica: ${clinicaId}`);
      supabase.removeChannel(canalLeads);
      supabase.removeChannel(canalMensagens);
    };
  }, [clinicaId]);

  return {
    leads,
    mensagensNaoLidas,
    loading,
    error,
    marcarMensagensComoLidasAdmin
  };
};
