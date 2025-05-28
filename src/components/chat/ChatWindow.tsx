/**
 * Componente de janela de chat com atualização em tempo real
 * 
 * Este componente:
 * - Exibe mensagens de uma conversa específica
 * - Atualiza automaticamente via Supabase Realtime
 * - Diferencia mensagens enviadas e recebidas
 * - Gerencia inscrições de tempo real sem vazamentos de memória
 * - Controla rolagem automática para as mensagens mais recentes
 * - Posiciona inicialmente no final da conversa para evitar efeito de rolagem
 * - Rola automaticamente apenas se o usuário estiver próximo do final
 * 
 * Props:
 * - leadId: ID do lead para filtrar mensagens
 */

// src/components/chat/ChatWindow.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Removida a importação do useClinicaFixa, pois usaremos o clinicaId dinâmico
import { useClinicaData } from '@/hooks/useClinicaData'; // Importa o hook para obter dados da clínica dinamicamente

// Interface para definir a estrutura de um objeto de mensagem
interface Mensagem {
  id: string; // ID único da mensagem
  lead_id: string; // ID do lead a quem a mensagem pertence
  clinica_id: string; // ID da clínica a qual a mensagem e o lead pertencem
  conteudo: string; // O texto da mensagem
  tipo: string; // Tipo da mensagem (ex: 'texto', 'imagem')
  enviado_por: 'lead' | 'usuario'; // Quem enviou a mensagem: 'lead' ou 'usuario' (do CRM)
  lida: boolean; // Status de leitura da mensagem
  created_at: string; // Timestamp de quando a mensagem foi criada
}

// Interface para as props do componente ChatWindow
interface ChatWindowProps {
  leadId: string; // ID do lead para o qual a janela de chat será exibida
}

export const ChatWindow = ({ leadId }: ChatWindowProps) => {
  // Hook para obter o clinicaId dinâmico, o estado de carregamento e possíveis erros
  const { clinicaId, loading: clinicaDataLoading, error: clinicaDataError } = useClinicaData(); //

  // Estado para armazenar a lista de mensagens da conversa atual
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  // Estado para controlar o carregamento das mensagens
  const [carregando, setCarregando] = useState(true);
  // Estado para armazenar mensagens de erro
  const [erro, setErro] = useState<string | null>(null);
  // Estado para controlar se a primeira carga de mensagens foi concluída (para otimizar a rolagem)
  const [primeiraCarregaCompleta, setPrimeiraCarregaCompleta] = useState(false);
  // Ref para o elemento final da lista de mensagens, usado para rolar automaticamente
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref para o container das mensagens, usado para controlar a rolagem
  const containerRef = useRef<HTMLDivElement>(null);

  // Função para rolar a visualização para a mensagem mais recente
  const rolarParaFinal = (comportamento: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior: comportamento });
  };

  // Função para posicionar a visualização imediatamente no final do chat (usado na carga inicial)
  const posicionarNoFinal = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  // Função para verificar se o usuário está visualizando as mensagens mais recentes
  // Retorna true se a rolagem estiver a menos de 100px do final.
  const estaProximoDoFinal = () => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // Função assíncrona para carregar o histórico inicial de mensagens do lead
  const carregarMensagens = async () => {
    // Verifica se o clinicaId está disponível antes de prosseguir
    if (!clinicaId) {
      setCarregando(false);
      setErro('ID da clínica não disponível para carregar mensagens.');
      console.warn('[ChatWindow] Tentativa de carregar mensagens sem clinicaId.');
      return;
    }
    try {
      console.log('📥 Carregando mensagens para lead:', leadId, 'clínica:', clinicaId);
      setCarregando(true); // Define o estado de carregamento como true
      setErro(null); // Limpa erros anteriores
      
      // Busca as mensagens no Supabase, filtrando por leadId e clinicaId, ordenando por data de criação
      const { data, error: dbError } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaId) // Adiciona filtro por clinicaId dinâmico
        .order('created_at', { ascending: true });

      if (dbError) {
        console.error('❌ Erro ao carregar mensagens:', dbError);
        setErro('Erro ao carregar mensagens');
        return;
      }

      // Formata as mensagens recebidas para garantir a tipagem correta de 'enviado_por'
      const mensagensFormatadas = (data || []).map(msg => ({
        ...msg,
        enviado_por: msg.enviado_por === 'lead' ? 'lead' as const : 'usuario' as const
      }));

      setMensagens(mensagensFormatadas); // Atualiza o estado com as mensagens carregadas
      console.log('✅ Mensagens carregadas:', mensagensFormatadas?.length || 0);
      
      // Após a primeira carga, posiciona a visualização no final das mensagens
      // requestAnimationFrame garante que o DOM foi atualizado antes da rolagem
      requestAnimationFrame(() => {
        posicionarNoFinal();
        setPrimeiraCarregaCompleta(true); // Marca que a primeira carga foi concluída
      });
      
    } catch (errorCatch) {
      console.error('❌ Erro ao carregar mensagens (catch):', errorCatch);
      setErro('Erro ao carregar mensagens');
    } finally {
      setCarregando(false); // Define o estado de carregamento como false ao final
    }
  };

  // useEffect para configurar o Supabase Realtime e carregar as mensagens iniciais
  useEffect(() => {
    // Se os dados da clínica ainda estão carregando, aguarda
    if (clinicaDataLoading) {
      console.log('[ChatWindow] Aguardando clinicaId...');
      setCarregando(true);
      return;
    }

    // Se houve erro ao carregar dados da clínica ou o clinicaId não está disponível, exibe erro
    if (clinicaDataError || !clinicaId) {
      console.error('[ChatWindow] Erro ao obter clinicaId ou clinicaId não disponível:', clinicaDataError, clinicaId);
      setErro(clinicaDataError?.message || 'ID da clínica não encontrado para iniciar o chat.');
      setCarregando(false);
      setMensagens([]); // Limpa as mensagens se não for possível carregar
      return;
    }
    
    // Prossegue se clinicaId estiver disponível e sem erros
    console.log('🔄 Configurando chat em tempo real para lead:', leadId, 'na clinica:', clinicaId);
    
    setPrimeiraCarregaCompleta(false); // Reseta o estado da primeira carga ao mudar de lead/clinica
    carregarMensagens(); // Carrega as mensagens iniciais

    // Cria um canal de comunicação Realtime específico para este lead e clínica
    const canalChat = supabase
      .channel(`chat-mensagens-lead-${leadId}-clinica-${clinicaId}`) // Nome do canal mais específico
      .on(
        'postgres_changes', // Escuta por mudanças no banco de dados
        {
          event: 'INSERT', // Especificamente para novas inserções
          schema: 'public', // No schema público
          table: 'chat_mensagens', // Na tabela chat_mensagens
          filter: `lead_id=eq.${leadId}` // Filtra eventos apenas para o leadId atual
        },
        (payload) => { // Callback executado quando um novo evento é recebido
          console.log('📨 Nova mensagem recebida via Realtime:', payload.new);
          
          const novaMensagem = payload.new as any; // Converte o payload para 'any' para acesso flexível
          
          // Filtro adicional no cliente: verifica se a mensagem pertence à clínica correta
          if (novaMensagem.clinica_id === clinicaId) {
            // Formata a nova mensagem para garantir a tipagem correta
            const mensagemFormatada: Mensagem = {
              ...novaMensagem,
              enviado_por: novaMensagem.enviado_por === 'lead' ? 'lead' as const : 'usuario' as const
            };
            
            // Atualiza o estado de mensagens, adicionando a nova mensagem
            setMensagens(mensagensAtuais => {
              // Evita adicionar mensagens duplicadas (caso raro, mas como segurança)
              const jaExiste = mensagensAtuais.some(m => m.id === mensagemFormatada.id);
              if (jaExiste) {
                console.log('⚠️ Mensagem já existe, ignorando duplicata');
                return mensagensAtuais;
              }
              
              const novaLista = [...mensagensAtuais, mensagemFormatada];
              console.log('✅ Mensagem adicionada ao estado, total:', novaLista.length);
              
              return novaLista; // Retorna a nova lista de mensagens
            });
          } else {
            // Loga se a mensagem foi ignorada por pertencer a outra clínica
            console.log('⚠️ Mensagem ignorada - clínica diferente. Esperado:', clinicaId, 'Recebido:', novaMensagem.clinica_id);
          }
        }
      )
      .subscribe((status, err) => { // Inicia a escuta do canal
        console.log('🔗 Status da subscrição Realtime:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscrição Realtime ativa para lead:', leadId, 'clinica:', clinicaId);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Trata erros ou fechamento inesperado da conexão Realtime
          console.error('❌ Erro ou fechamento na subscrição Realtime:', status, err);
          setErro(`Erro na conexão em tempo real: ${status}`);
        }
      });

    // Função de limpeza: executada quando o componente é desmontado ou as dependências mudam
    return () => {
      console.log('🧹 Removendo subscrição Realtime para lead:', leadId, 'clinica:', clinicaId);
      supabase.removeChannel(canalChat).catch(err => console.error("Erro ao remover canal", err)); // Remove o canal para evitar vazamentos de memória
    };
  // Array de dependências do useEffect: re-executa o efeito se qualquer um desses valores mudar
  }, [leadId, clinicaId, clinicaDataLoading, clinicaDataError]);


  // useEffect para rolar para o final quando novas mensagens são adicionadas (após a carga inicial)
  useEffect(() => {
    if (mensagens.length > 0 && primeiraCarregaCompleta) {
      const deveRolar = estaProximoDoFinal(); // Verifica se o usuário está perto do final
      if (deveRolar) {
        // Adia a rolagem para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          setTimeout(() => rolarParaFinal('smooth'), 50); // Rolagem suave
        });
      }
    }
  }, [mensagens, primeiraCarregaCompleta]); // Depende de 'mensagens' e 'primeiraCarregaCompleta'

  // Função para formatar o timestamp da mensagem para exibição (HH:MM)
  const formatarHorario = (timestamp: string) => {
    const data = new Date(timestamp);
    return data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Renderiza o estado de carregamento enquanto os dados da clínica ou mensagens estão sendo buscados
  if (clinicaDataLoading || (carregando && !primeiraCarregaCompleta)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <span className="text-gray-500">Carregando mensagens...</span>
        </div>
      </div>
    );
  }

  // Renderiza o estado de erro, se houver
  if (erro) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">❌ {erro}</p>
          <button 
            onClick={() => {
              setErro(null); // Limpa o erro
              setCarregando(true); // Ativa o carregamento para forçar a re-execução do useEffect
              // A função carregarMensagens será chamada novamente pelo useEffect quando clinicaId estiver pronto
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Renderização principal da janela de chat
  return (
    <div className="h-full flex flex-col">
      {/* Container das mensagens com rolagem */}
      <div 
        ref={containerRef} // Ref para controlar a rolagem
        className="flex-1 overflow-y-auto p-4" // Permite rolagem vertical
      >
        <div className="space-y-2"> {/* Espaçamento entre as bolhas de mensagem */}
          {/* Se não houver mensagens e não estiver carregando, exibe mensagem informativa */}
          {mensagens.length === 0 && !carregando ? (
            <div className="text-center text-gray-500 py-8">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">As novas mensagens aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            // Mapeia e renderiza cada mensagem
            mensagens.map((mensagem) => (
              <div
                key={mensagem.id} // Chave única para cada mensagem
                className={`flex ${
                  // Alinha a mensagem à direita se for do usuário, à esquerda se for do lead
                  mensagem.enviado_por === 'usuario' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                    // Estilização diferente para mensagens do usuário e do lead
                    mensagem.enviado_por === 'usuario'
                      ? 'bg-blue-600 text-white' // Mensagem do usuário
                      : 'bg-white text-gray-900 border border-gray-200' // Mensagem do lead
                  }`}
                >
                  {/* Conteúdo da mensagem */}
                  <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>
                  
                  {/* Informações da mensagem (horário e tipo) */}
                  <div className="flex items-center justify-between mt-2">
                    <p
                      className={`text-xs ${
                        mensagem.enviado_por === 'usuario' 
                          ? 'text-blue-100' 
                          : 'text-gray-500'
                      }`}
                    >
                      {formatarHorario(mensagem.created_at)} {/* Exibe o horário formatado */}
                    </p>
                    
                    {/* Se a mensagem não for do tipo 'texto', exibe um indicador do tipo */}
                    {mensagem.tipo !== 'texto' && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          mensagem.enviado_por === 'usuario'
                            ? 'bg-blue-500 text-blue-100'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {mensagem.tipo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Elemento invisível no final da lista para ajudar na rolagem automática */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};