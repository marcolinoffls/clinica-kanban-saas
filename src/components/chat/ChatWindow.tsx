
/**
 * Componente de janela de chat com atualização em tempo real
 * 
 * Este componente:
 * - Exibe mensagens de uma conversa específica
 * - Atualiza automaticamente via Supabase Realtime
 * - Diferencia mensagens enviadas e recebidas
 * - Gerencia inscrições de tempo real sem vazamentos de memória
 * - Controla rolagem automática para as mensagens mais recentes
 * 
 * Props:
 * - leadId: ID do lead para filtrar mensagens
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useClinicaFixa } from '@/hooks/useClinicaFixa'

interface Mensagem {
  id: string
  lead_id: string
  clinica_id: string
  conteudo: string
  tipo: string
  enviado_por: 'lead' | 'usuario'
  lida: boolean
  created_at: string
}

interface ChatWindowProps {
  leadId: string
}

export const ChatWindow = ({ leadId }: ChatWindowProps) => {
  const { clinicaId } = useClinicaFixa()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Função para rolar para o final das mensagens
  const rolarParaFinal = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Carregar histórico inicial de mensagens
  const carregarMensagens = async () => {
    try {
      console.log('📥 Carregando mensagens para lead:', leadId, 'clínica:', clinicaId)
      
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Erro ao carregar mensagens:', error)
        setErro('Erro ao carregar mensagens')
        return
      }

      // Transformar os dados para garantir o tipo correto de enviado_por
      const mensagensFormatadas = (data || []).map(msg => ({
        ...msg,
        enviado_por: msg.enviado_por === 'lead' ? 'lead' as const : 'usuario' as const
      }))

      setMensagens(mensagensFormatadas)
      console.log('✅ Mensagens carregadas:', mensagensFormatadas?.length || 0)
      
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(rolarParaFinal, 100)
      
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error)
      setErro('Erro ao carregar mensagens')
    } finally {
      setCarregando(false)
    }
  }

  // Configurar Realtime e carregar mensagens iniciais
  useEffect(() => {
    if (!leadId || !clinicaId) {
      console.log('⚠️ leadId ou clinicaId não disponível:', { leadId, clinicaId })
      return
    }

    console.log('🔄 Configurando chat em tempo real para lead:', leadId)
    
    // Carregar mensagens iniciais
    carregarMensagens()

    // Criar canal único para este chat específico
    const canalChat = supabase
      .channel(`chat-mensagens-lead-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensagens',
          filter: `lead_id=eq.${leadId}` // Filtrar apenas mensagens deste lead
        },
        (payload) => {
          console.log('📨 Nova mensagem recebida via Realtime:', payload.new)
          
          const novaMensagem = payload.new as any
          
          // Verificar se é da clínica correta (segurança adicional)
          if (novaMensagem.clinica_id === clinicaId) {
            // Transformar a nova mensagem para garantir o tipo correto
            const mensagemFormatada: Mensagem = {
              ...novaMensagem,
              enviado_por: novaMensagem.enviado_por === 'lead' ? 'lead' as const : 'usuario' as const
            }
            
            setMensagens(mensagensAtuais => {
              // Verificar se a mensagem já existe (evitar duplicatas)
              const jaExiste = mensagensAtuais.some(m => m.id === mensagemFormatada.id)
              if (jaExiste) {
                console.log('⚠️ Mensagem já existe, ignorando duplicata')
                return mensagensAtuais
              }
              
              const novaLista = [...mensagensAtuais, mensagemFormatada]
              console.log('✅ Mensagem adicionada ao estado, total:', novaLista.length)
              
              // Rolar para o final após adicionar nova mensagem
              setTimeout(rolarParaFinal, 100)
              
              return novaLista
            })
          } else {
            console.log('⚠️ Mensagem ignorada - clínica diferente:', novaMensagem.clinica_id, 'vs', clinicaId)
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 Status da subscrição Realtime:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscrição Realtime ativa para lead:', leadId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscrição Realtime')
          setErro('Erro na conexão em tempo real')
        }
      })

    // Função de limpeza para remover inscrição
    return () => {
      console.log('🧹 Removendo subscrição Realtime para lead:', leadId)
      supabase.removeChannel(canalChat)
    }
  }, [leadId, clinicaId])

  // Rolar para o final sempre que as mensagens mudarem
  useEffect(() => {
    if (mensagens.length > 0) {
      rolarParaFinal()
    }
  }, [mensagens])

  // Formatar horário da mensagem
  const formatarHorario = (timestamp: string) => {
    const data = new Date(timestamp)
    return data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Renderizar estado de carregamento
  if (carregando) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <span className="text-gray-500">Carregando mensagens...</span>
        </div>
      </div>
    )
  }

  // Renderizar estado de erro
  if (erro) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">❌ {erro}</p>
          <button 
            onClick={() => {
              setErro(null)
              setCarregando(true)
              carregarMensagens()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Área de mensagens com rolagem própria */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {mensagens.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">As novas mensagens aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            mensagens.map((mensagem) => (
              <div
                key={mensagem.id}
                className={`flex ${
                  mensagem.enviado_por === 'usuario' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                    mensagem.enviado_por === 'usuario'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {/* Conteúdo da mensagem */}
                  <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>
                  
                  {/* Informações da mensagem */}
                  <div className="flex items-center justify-between mt-2">
                    <p
                      className={`text-xs ${
                        mensagem.enviado_por === 'usuario' 
                          ? 'text-blue-100' 
                          : 'text-gray-500'
                      }`}
                    >
                      {formatarHorario(mensagem.created_at)}
                    </p>
                    
                    {/* Indicador de tipo de mensagem */}
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
          {/* Elemento invisível para controlar a rolagem */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}
