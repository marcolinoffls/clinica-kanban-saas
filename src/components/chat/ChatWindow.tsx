import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Mic, Paperclip, X, User, Bot, Clock, Phone, Mail, MapPin, Calendar, Tag, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthUser } from '@/hooks/useAuthUser';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Interface para definir a estrutura de uma mensagem de chat
 */
interface Mensagem {
  id: string;
  conteudo: string;
  enviado_por: 'usuario' | 'atendente' | 'ia' | 'sistema';
  created_at: string;
  tipo: 'texto' | 'imagem' | 'arquivo' | 'audio' | 'video' | 'localizacao';
  lead_id: string;
  metadata?: {
    arquivo_url?: string;
    arquivo_nome?: string;
    arquivo_tipo?: string;
    coordenadas?: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Interface para definir a estrutura de um lead
 */
interface Lead {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  origem_lead?: string;
  servico_interesse?: string;
  anotacoes?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Props do componente ChatWindow
 */
interface ChatWindowProps {
  /** Lead selecionado para o chat */
  selectedLead: Lead | null;
  /** Função para fechar o chat */
  onClose: () => void;
  /** Callback quando o lead é atualizado */
  onLeadUpdate?: (lead: Lead) => void;
}

/**
 * Componente ChatWindow - Interface principal de chat com leads
 * 
 * Funcionalidades principais:
 * - Exibir histórico de mensagens
 * - Enviar mensagens de texto
 * - Upload de arquivos e imagens
 * - Exibir informações do lead
 * - Integração com IA para respostas automáticas
 * - Formatação de data/hora das mensagens
 * - Status de entrega e leitura
 */
const ChatWindow: React.FC<ChatWindowProps> = ({ 
  selectedLead, 
  onClose, 
  onLeadUpdate 
}) => {
  // =================================================================
  // ESTADOS DO COMPONENTE
  // =================================================================
  
  /** Lista de mensagens do chat atual */
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  
  /** Texto da mensagem sendo digitada */
  const [novaMensagem, setNovaMensagem] = useState('');
  
  /** Estado de carregamento das mensagens */
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  
  /** Estado de envio de mensagem */
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  
  /** Arquivo selecionado para upload */
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  
  /** Preview do arquivo selecionado */
  const [previewArquivo, setPreviewArquivo] = useState<string | null>(null);
  
  /** Estado para controlar se está gravando áudio */
  const [gravandoAudio, setGravandoAudio] = useState(false);
  
  /** Estado para indicar que a IA está digitando */
  const [iaDigitando, setIaDigitando] = useState(false);

  // =================================================================
  // REFS PARA ELEMENTOS DOM
  // =================================================================
  
  /** Referência para o container de mensagens (para scroll automático) */
  const mensagensRef = useRef<HTMLDivElement>(null);
  
  /** Referência para o input de arquivo */
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  
  /** Referência para gravação de áudio */
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // =================================================================
  // HOOKS PERSONALIZADOS
  // =================================================================
  
  /** Hook para obter dados do usuário autenticado */
  const { userProfile } = useAuthUser();

  // =================================================================
  // FUNÇÕES UTILITÁRIAS
  // =================================================================
  
  /**
   * Formatar timestamp para exibição de horário
   * Converte string ISO para formato brasileiro (HH:mm)
   * 
   * @param timestamp - String ISO do timestamp
   * @returns String formatada do horário ou "00:00" em caso de erro
   */
  const formatarHorario = (timestamp: string): string => {
    // Validar se timestamp existe
    if (!timestamp) {
      console.warn('⚠️ Timestamp vazio recebido para formatação');
      return '00:00';
    }
    
    try {
      // Tentar fazer parsing da data ISO
      const data = parseISO(timestamp);
      
      // Verificar se a data é válida
      if (!isValid(data)) {
        console.warn('⚠️ Timestamp inválido recebido:', timestamp);
        return '00:00';
      }
      
      // Formatar no padrão brasileiro
      const horarioFormatado = format(data, 'HH:mm', { 
        locale: ptBR 
      });
      
      // Log para debug (remover em produção)
      console.log('🕐 Formatação de horário:', {
        timestamp_original: timestamp,
        data_parseada: data,
        horario_formatado: horarioFormatado
      });
      
      return horarioFormatado;
      
    } catch (error) {
      console.error('❌ Erro ao formatar horário:', error, 'Timestamp:', timestamp);
      return '00:00';
    }
  };

  /**
   * Formatar data completa para exibição
   * Converte string ISO para formato brasileiro (dd/MM/yyyy)
   * 
   * @param timestamp - String ISO do timestamp
   * @returns String formatada da data
   */
  const formatarDataCompleta = (timestamp: string): string => {
    if (!timestamp) return '';
    
    try {
      const data = parseISO(timestamp);
      if (!isValid(data)) return '';
      
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('❌ Erro ao formatar data completa:', error);
      return '';
    }
  };

  /**
   * Scroll automático para a última mensagem
   * Rola suavemente até o final da lista de mensagens
   */
  const scrollParaUltimaMensagem = () => {
    if (mensagensRef.current) {
      const elemento = mensagensRef.current;
      elemento.scrollTo({
        top: elemento.scrollHeight,
        behavior: 'smooth'
      });
      
      console.log('📜 Scroll automático executado');
    }
  };

  /**
   * Verificar se deve mostrar avatar/nome
   * Exibe apenas se for a primeira mensagem de uma sequência do mesmo remetente
   * 
   * @param mensagem - Mensagem atual
   * @param index - Índice da mensagem na lista
   * @returns Boolean indicando se deve mostrar avatar
   */
  const deveMostrarAvatar = (mensagem: Mensagem, index: number): boolean => {
    if (index === 0) return true;
    
    const mensagemAnterior = mensagens[index - 1];
    return mensagemAnterior.enviado_por !== mensagem.enviado_por;
  };

  /**
   * Obter iniciais do nome para avatar
   * 
   * @param nome - Nome completo
   * @returns String com as iniciais
   */
  const obterIniciais = (nome: string): string => {
    if (!nome) return '?';
    
    return nome
      .split(' ')
      .map(parte => parte.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // =================================================================
  // FUNÇÕES DE CARREGAMENTO DE DADOS
  // =================================================================
  
  /**
   * Carregar mensagens do lead selecionado
   * Busca todas as mensagens do chat ordenadas por data
   */
  const carregarMensagens = async () => {
    if (!selectedLead?.id) {
      console.log('⚠️ Nenhum lead selecionado para carregar mensagens');
      return;
    }

    console.log('📥 Iniciando carregamento de mensagens para lead:', selectedLead.id);
    setCarregandoMensagens(true);

    try {
      // Buscar mensagens no Supabase
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
        toast.error('Erro ao carregar mensagens do chat');
        return;
      }

      // Log dos dados carregados para debug
      console.log('📥 Mensagens carregadas do banco:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📅 Primeira mensagem exemplo:', {
          id: data[0].id,
          created_at: data[0].created_at,
          tipo_timestamp: typeof data[0].created_at,
          conteudo_preview: data[0].conteudo?.substring(0, 30) + '...'
        });
        
        // Debug dos timestamps de todas as mensagens
        data.forEach((msg, index) => {
          console.log(`📅 Mensagem ${index + 1}:`, {
            id: msg.id,
            created_at: msg.created_at,
            horario_formatado: formatarHorario(msg.created_at),
            enviado_por: msg.enviado_por
          });
        });
      }

      // Atualizar estado das mensagens
      setMensagens(data as Mensagem[] || []);
      
      console.log('✅ Mensagens carregadas com sucesso:', data?.length || 0);

    } catch (error) {
      console.error('❌ Erro inesperado ao carregar mensagens:', error);
      toast.error('Erro inesperado ao carregar mensagens');
    } finally {
      setCarregandoMensagens(false);
    }
  };

  // =================================================================
  // FUNÇÕES DE ENVIO DE MENSAGENS
  // =================================================================
  
  /**
   * Enviar mensagem de texto
   * Salva a mensagem no banco e atualiza a interface
   */
  const enviarMensagem = async () => {
    // Validações básicas
    if (!novaMensagem.trim()) {
      console.log('⚠️ Tentativa de enviar mensagem vazia');
      return;
    }

    if (!selectedLead?.id) {
      console.error('❌ Nenhum lead selecionado para enviar mensagem');
      toast.error('Nenhum lead selecionado');
      return;
    }

    if (!userProfile?.id) {
      console.error('❌ Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return;
    }

    console.log('📤 Enviando mensagem:', {
      lead_id: selectedLead.id,
      conteudo: novaMensagem.substring(0, 50) + '...',
      usuario_id: userProfile.id
    });

    setEnviandoMensagem(true);
    const mensagemTexto = novaMensagem;
    
    // Limpar input imediatamente para melhor UX
    setNovaMensagem('');

    try {
      // Salvar mensagem no banco
      const { data, error } = await supabase
        .from('chat_mensagens')
        .insert([{
          lead_id: selectedLead.id,
          conteudo: mensagemTexto,
          enviado_por: 'atendente',
          tipo: 'texto',
          usuario_id: userProfile.id
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar mensagem:', error);
        toast.error('Erro ao enviar mensagem');
        // Restaurar texto em caso de erro
        setNovaMensagem(mensagemTexto);
        return;
      }

      console.log('✅ Mensagem salva no banco:', data);

      // Adicionar mensagem à lista local imediatamente
      const novaMensagemObj: Mensagem = {
        id: data.id,
        conteudo: data.conteudo,
        enviado_por: data.enviado_por,
        created_at: data.created_at,
        tipo: data.tipo,
        lead_id: data.lead_id
      };

      setMensagens(prev => [...prev, novaMensagemObj]);

      console.log('✅ Mensagem enviada com sucesso');
      
      // Simular resposta da IA (opcional)
      setTimeout(() => {
        simularRespostaIA(mensagemTexto);
      }, 1500);

    } catch (error) {
      console.error('❌ Erro inesperado ao enviar mensagem:', error);
      toast.error('Erro inesperado ao enviar mensagem');
      setNovaMensagem(mensagemTexto);
    } finally {
      setEnviandoMensagem(false);
    }
  };

  /**
   * Simular resposta automática da IA
   * Cria uma resposta inteligente baseada no conteúdo da mensagem
   * 
   * @param mensagemOriginal - Mensagem do usuário que gerou a resposta
   */
  const simularRespostaIA = async (mensagemOriginal: string) => {
    if (!selectedLead?.id) return;

    console.log('🤖 Gerando resposta da IA para:', mensagemOriginal.substring(0, 30));
    setIaDigitando(true);

    // Respostas automáticas baseadas em palavras-chave
    let respostaIA = '';
    const mensagemLower = mensagemOriginal.toLowerCase();

    if (mensagemLower.includes('preço') || mensagemLower.includes('valor') || mensagemLower.includes('custa')) {
      respostaIA = 'Entendo sua dúvida sobre valores! Nossa equipe comercial entrará em contato para apresentar as melhores opções para seu caso. Podemos agendar uma consulta?';
    } else if (mensagemLower.includes('agend') || mensagemLower.includes('consulta') || mensagemLower.includes('horário')) {
      respostaIA = 'Perfeito! Vou verificar nossa agenda. Que dias e horários funcionam melhor para você?';
    } else if (mensagemLower.includes('oi') || mensagemLower.includes('olá') || mensagemLower.includes('bom dia')) {
      respostaIA = `Olá! Seja bem-vindo(a)! Sou a assistente virtual da clínica. Como posso ajudá-lo(a) hoje?`;
    } else if (mensagemLower.includes('tratamento') || mensagemLower.includes('procedimento')) {
      respostaIA = 'Oferecemos diversos tratamentos personalizados. Para dar as melhores recomendações, seria importante conhecer suas necessidades específicas. Podemos agendar uma avaliação?';
    } else {
      respostaIA = 'Obrigado pelo contato! Um de nossos especialistas analisará sua mensagem e retornará em breve. Posso ajudar com mais alguma informação?';
    }

    try {
      // Simular delay de digitação da IA
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Salvar resposta da IA no banco
      const { data, error } = await supabase
        .from('chat_mensagens')
        .insert([{
          lead_id: selectedLead.id,
          conteudo: respostaIA,
          enviado_por: 'ia',
          tipo: 'texto'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar resposta da IA:', error);
        return;
      }

      // Adicionar resposta à lista
      const respostaMensagem: Mensagem = {
        id: data.id,
        conteudo: data.conteudo,
        enviado_por: data.enviado_por,
        created_at: data.created_at,
        tipo: data.tipo,
        lead_id: data.lead_id
      };

      setMensagens(prev => [...prev, respostaMensagem]);
      console.log('🤖 Resposta da IA enviada:', respostaIA.substring(0, 50));

    } catch (error) {
      console.error('❌ Erro ao enviar resposta da IA:', error);
    } finally {
      setIaDigitando(false);
    }
  };

  /**
   * Upload e envio de arquivo
   * Faz upload do arquivo e envia como mensagem
   */
  const enviarArquivo = async () => {
    if (!arquivoSelecionado || !selectedLead?.id || !userProfile?.id) {
      console.log('⚠️ Dados insuficientes para envio de arquivo');
      return;
    }

    console.log('📎 Enviando arquivo:', {
      nome: arquivoSelecionado.name,
      tipo: arquivoSelecionado.type,
      tamanho: arquivoSelecionado.size
    });

    setEnviandoMensagem(true);

    try {
      // Upload do arquivo para Supabase Storage
      const nomeArquivo = `${Date.now()}_${arquivoSelecionado.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(nomeArquivo, arquivoSelecionado);

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        toast.error('Erro ao fazer upload do arquivo');
        return;
      }

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(nomeArquivo);

      // Salvar mensagem com arquivo no banco
      const { data, error } = await supabase
        .from('chat_mensagens')
        .insert([{
          lead_id: selectedLead.id,
          conteudo: `Arquivo enviado: ${arquivoSelecionado.name}`,
          enviado_por: 'atendente',
          tipo: arquivoSelecionado.type.startsWith('image/') ? 'imagem' : 'arquivo',
          usuario_id: userProfile.id,
          metadata: {
            arquivo_url: urlData.publicUrl,
            arquivo_nome: arquivoSelecionado.name,
            arquivo_tipo: arquivoSelecionado.type
          }
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar mensagem de arquivo:', error);
        toast.error('Erro ao enviar arquivo');
        return;
      }

      // Adicionar à lista de mensagens
      const novaMensagemArquivo: Mensagem = {
        id: data.id,
        conteudo: data.conteudo,
        enviado_por: data.enviado_por,
        created_at: data.created_at,
        tipo: data.tipo,
        lead_id: data.lead_id,
        metadata: data.metadata
      };

      setMensagens(prev => [...prev, novaMensagemArquivo]);

      // Limpar arquivo selecionado
      setArquivoSelecionado(null);
      setPreviewArquivo(null);

      console.log('✅ Arquivo enviado com sucesso');
      toast.success('Arquivo enviado com sucesso');

    } catch (error) {
      console.error('❌ Erro inesperado ao enviar arquivo:', error);
      toast.error('Erro inesperado ao enviar arquivo');
    } finally {
      setEnviandoMensagem(false);
    }
  };

  // =================================================================
  // HANDLERS DE EVENTOS
  // =================================================================
  
  /**
   * Handler para seleção de arquivo
   */
  const handleSelecionarArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    console.log('📁 Arquivo selecionado:', {
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: arquivo.size
    });

    setArquivoSelecionado(arquivo);

    // Gerar preview para imagens
    if (arquivo.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewArquivo(e.target?.result as string);
      };
      reader.readAsDataURL(arquivo);
    }
  };

  /**
   * Handler para pressionar Enter no input
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  /**
   * Handler para cancelar arquivo selecionado
   */
  const cancelarArquivo = () => {
    setArquivoSelecionado(null);
    setPreviewArquivo(null);
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = '';
    }
  };

  // =================================================================
  // EFEITOS (useEffect)
  // =================================================================
  
  /**
   * Carregar mensagens quando o lead selecionado muda
   */
  useEffect(() => {
    if (selectedLead?.id) {
      console.log('🔄 Lead selecionado mudou, carregando mensagens:', selectedLead.id);
      carregarMensagens();
    } else {
      console.log('🔄 Nenhum lead selecionado, limpando mensagens');
      setMensagens([]);
    }
  }, [selectedLead?.id]);

  /**
   * Scroll automático quando novas mensagens chegam
   */
  useEffect(() => {
    if (mensagens.length > 0) {
      setTimeout(scrollParaUltimaMensagem, 100);
    }
  }, [mensagens.length]);

  /**
   * Cleanup ao desmontar componente
   */
  useEffect(() => {
    return () => {
      // Cleanup de recursos se necessário
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // =================================================================
  // RENDERIZAÇÃO CONDICIONAL
  // =================================================================
  
  if (!selectedLead) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma conversa selecionada
          </h3>
          <p className="text-gray-500">
            Selecione um lead na lista para iniciar uma conversa
          </p>
        </div>
      </div>
    );
  }

  // =================================================================
  // RENDER PRINCIPAL
  // =================================================================
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* ========================================= */}
      {/* HEADER DO CHAT */}
      {/* ========================================= */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        {/* Informações do lead */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-500 text-white">
              {obterIniciais(selectedLead.nome)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-gray-900">
              {selectedLead.nome}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {selectedLead.telefone && (
                <span className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  {selectedLead.telefone}
                </span>
              )}
              {selectedLead.email && (
                <span className="flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  {selectedLead.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ações do header */}
        <div className="flex items-center space-x-2">
          {/* Status online/offline */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-500">Online</span>
          </div>
          
          {/* Botão fechar */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ========================================= */}
      {/* ÁREA DE MENSAGENS */}
      {/* ========================================= */}
      <div 
        ref={mensagensRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {/* Loading de mensagens */}
        {carregandoMensagens && (
          <div className="flex justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Carregando mensagens...</span>
            </div>
          </div>
        )}

        {/* Lista de mensagens */}
        {mensagens.map((mensagem, index) => {
          const isUsuario = mensagem.enviado_por === 'usuario';
          const isIA = mensagem.enviado_por === 'ia';
          const mostrarAvatar = deveMostrarAvatar(mensagem, index);

          return (
            <div key={mensagem.id} className="flex flex-col">
              {/* Separador de data (se necessário) */}
              {index === 0 || formatarDataCompleta(mensagens[index - 1].created_at) !== formatarDataCompleta(mensagem.created_at) && (
                <div className="flex justify-center my-4">
                  <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 border">
                    📅 {formatarDataCompleta(mensagem.created_at)}
                  </span>
                </div>
              )}

              {/* Mensagem */}
              <div className={`flex ${isUsuario ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isUsuario ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  {!isUsuario && mostrarAvatar && (
                    <Avatar className="h-6 w-6 mb-1">
                      <AvatarFallback className={`${isIA ? 'bg-purple-500' : 'bg-gray-500'} text-white text-xs`}>
                        {isIA ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Espaçador quando não há avatar */}
                  {!isUsuario && !mostrarAvatar && (
                    <div className="w-6 h-6 mb-1"></div>
                  )}

                  {/* Bubble da mensagem */}
                  <div
                    className={`relative px-4 py-2 rounded-lg ${
                      isUsuario
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : isIA
                        ? 'bg-purple-100 text-purple-900 rounded-bl-sm border border-purple-200'
                        : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                    }`}
                  >
                    {/* Nome do remetente (apenas para IA e atendentes) */}
                    {!isUsuario && mostrarAvatar && (
                      <p className={`text-xs font-medium mb-1 ${isIA ? 'text-purple-600' : 'text-gray-600'}`}>
                        {isIA ? '🤖 Assistente IA' : '👩‍⚕️ Atendente'}
                      </p>
                    )}

                    {/* Conteúdo da mensagem */}
                    <div>
                      {/* Mensagem de texto */}
                      {mensagem.tipo === 'texto' && (
                        <p className="text-sm whitespace-pre-wrap">
                          {mensagem.conteudo}
                        </p>
                      )}

                      {/* Mensagem de imagem */}
                      {mensagem.tipo === 'imagem' && mensagem.metadata?.arquivo_url && (
                        <div>
                          <img
                            src={mensagem.metadata.arquivo_url}
                            alt={mensagem.metadata.arquivo_nome}
                            className="max-w-full h-auto rounded-lg mb-2"
                          />
                          <p className="text-xs opacity-75">
                            📷 {mensagem.metadata.arquivo_nome}
                          </p>
                        </div>
                      )}

                      {/* Mensagem de arquivo */}
                      {mensagem.tipo === 'arquivo' && mensagem.metadata?.arquivo_url && (
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 opacity-75" />
                          <a
                            href={mensagem.metadata.arquivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm underline"
                          >
                            {mensagem.metadata.arquivo_nome}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* ========================================= */}
                    {/* INFORMAÇÕES DA MENSAGEM COM DEBUG VISUAL */}
                    {/* ========================================= */}
                    <div className="flex items-center justify-between mt-2 min-h-[20px]">
                      {/* Horário da mensagem */}
                      <div className="flex items-center space-x-2">
                        <p
                          className={`text-xs flex items-center ${
                            isUsuario 
                              ? 'text-blue-100' 
                              : isIA
                              ? 'text-purple-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {/* Ícone de relógio */}
                          <Clock className="w-3 h-3 mr-1 opacity-75" />
                          
                          {/* Horário formatado */}
                          <span className="font-medium">
                            {formatarHorario(mensagem.created_at)}
                          </span>
                        </p>

                        {/* DEBUG: Mostrar timestamp bruto (remover em produção) */}
                        <p className="text-xs text-red-500 opacity-50">
                          [Debug: {mensagem.created_at?.substring(11, 16)}]
                        </p>
                      </div>

                      {/* Indicadores de tipo e status */}
                      <div className="flex items-center space-x-1">
                        {/* Indicador do tipo de mensagem */}
                        {mensagem.tipo !== 'texto' && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              isUsuario
                                ? 'bg-blue-400 text-blue-100'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {mensagem.tipo === 'imagem' && '📷'}
                            {mensagem.tipo === 'arquivo' && '📎'}
                            {mensagem.tipo === 'audio' && '🎵'}
                            {mensagem.tipo === 'video' && '🎥'}
                            {mensagem.tipo === 'localizacao' && '📍'}
                          </span>
                        )}

                        {/* Status de entrega (apenas para mensagens do usuário) */}
                        {isUsuario && (
                          <span className="text-blue-200 text-xs">
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Indicador de IA digitando */}
        {iaDigitando && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-lg border border-purple-200">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-purple-500 text-white text-xs">
                  <Bot className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-purple-600">Assistente digitando...</span>
            </div>
          </div>
        )}

        {/* Mensagem quando não há mensagens */}
        {!carregandoMensagens && mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma mensagem ainda
            </h3>
            <p className="text-gray-500 mb-4">
              Inicie uma conversa com {selectedLead.nome}
            </p>
            <Button
              onClick={() => {
                setNovaMensagem('Olá! Como posso ajudá-lo(a) hoje?');
                setTimeout(() => enviarMensagem(), 100);
              }}
              variant="outline"
              size="sm"
            >
              Enviar primeira mensagem
            </Button>
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* PREVIEW DE ARQUIVO SELECIONADO */}
      {/* ========================================= */}
      {arquivoSelecionado && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Preview da imagem */}
              {previewArquivo && (
                <img
                  src={previewArquivo}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              
              {/* Informações do arquivo */}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {arquivoSelecionado.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(arquivoSelecionado.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={enviarArquivo}
                disabled={enviandoMensagem}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {enviandoMensagem ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    Enviar
                  </>
                )}
              </Button>
              
              <Button
                onClick={cancelarArquivo}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* ÁREA DE INPUT DE MENSAGEM */}
      {/* ========================================= */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-2">
          {/* Botão de anexar arquivo */}
          <Button
            onClick={() => inputArquivoRef.current?.click()}
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 flex-shrink-0"
            disabled={enviandoMensagem}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Input de arquivo (oculto) */}
          <input
            ref={inputArquivoRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx"
            onChange={handleSelecionarArquivo}
            className="hidden"
          />

          {/* Input de texto */}
          <div className="flex-1">
            <Input
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={enviandoMensagem}
              className="min-h-[40px] resize-none"
            />
          </div>

          {/* Botão de enviar */}
          <Button
            onClick={enviarMensagem}
            disabled={!novaMensagem.trim() || enviandoMensagem}
            size="sm"
            className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
          >
            {enviandoMensagem ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Indicadores de status */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            {novaMensagem.length > 0 && `${novaMensagem.length} caracteres`}
          </span>
          
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Online</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;