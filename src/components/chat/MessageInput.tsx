
import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Zap, Bot, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Componente de entrada de mensagem avançado
 * 
 * Funcionalidades:
 * - Área de texto com redimensionamento automático
 * - Suporte a Shift+Enter para nova linha
 * - Seleção de arquivos de mídia (imagens e áudios)
 * - Botões para anexos, respostas prontas, IA e emojis
 * - Controle granular de ativação da IA com estado persistente
 * - Integração com respostas prontas via atalhos
 * - Validação de entrada e loading states
 * - Visual aprimorado para o botão de IA com gradiente quando ativo
 */

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (aiEnabled?: boolean) => void;
  onFileSelect: (file: File) => void; // Nova prop para seleção de arquivos
  loading?: boolean;
  respostasProntas?: Array<{
    id: string;
    titulo: string;
    conteudo: string;
    atalho?: string;
  }>;
  // Props para controle da IA
  aiEnabled: boolean;
  onToggleAI: () => void;
  isAIInitializing?: boolean;
  leadId: string | null; // Será usado em etapas futuras para nomear arquivos no MinIO
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  onFileSelect, // Nova prop para lidar com seleção de arquivos
  loading = false,
  respostasProntas = [],
  aiEnabled,
  onToggleAI,
  isAIInitializing = false,
  leadId // Nova prop para identificar o lead
}: MessageInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref para o input de arquivo
  const [showRespostasProntas, setShowRespostasProntas] = useState(false);

  // Função para acionar a seleção de arquivo ao clicar no botão de anexo
  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click(); // Simula clique no input de arquivo oculto
  };

  // Função para lidar com a seleção do arquivo
  const handleFileSelectedAndForward = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Pega o primeiro arquivo selecionado
    if (file) {
      onFileSelect(file); // Envia o arquivo para o componente pai (ChatPage.tsx)
    }
    // Limpa o valor do input para permitir que o mesmo arquivo seja selecionado novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Função para lidar com teclas especiais
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter = nova linha (comportamento padrão)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) {
        // Enviar estado atual da IA junto com a mensagem
        onSend(aiEnabled);
      }
    }

    // Detectar atalhos de respostas prontas
    if (e.key === '/' && value === '') {
      setShowRespostasProntas(true);
    }
  };

  // Função para inserir resposta pronta
  const inserirRespostaPronta = (conteudo: string) => {
    onChange(conteudo);
    setShowRespostasProntas(false);
    textareaRef.current?.focus();
  };

  // Filtrar respostas prontas baseado no texto digitado
  const respostasFiltradas = respostasProntas.filter(resposta =>
    value.startsWith('/') 
      ? resposta.atalho?.toLowerCase().includes(value.toLowerCase()) ||
        resposta.titulo.toLowerCase().includes(value.toLowerCase())
      : false
  );

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Barra de ferramentas superior */}
      <div className="flex items-center gap-2 mb-3">
        {/* NOVO BOTÃO DE ANEXO E INPUT OCULTO */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTriggerFileUpload}
          className="text-gray-500 hover:text-gray-700"
          title="Anexar arquivo"
          type="button"
        >
          <Paperclip size={16} />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelectedAndForward}
          style={{ display: 'none' }}
          accept="image/*,audio/*"
        />
        {/* FIM DO NOVO BOTÃO E INPUT */}

        <Popover open={showRespostasProntas} onOpenChange={setShowRespostasProntas}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              title="Respostas prontas (digite /)"
            >
              <Zap size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-gray-900 px-2 py-1">
                Respostas Prontas
              </h4>
              {respostasProntas.length > 0 ? (
                respostasProntas.map((resposta) => (
                  <button
                    key={resposta.id}
                    onClick={() => inserirRespostaPronta(resposta.conteudo)}
                    className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    <div className="font-medium">{resposta.titulo}</div>
                    {resposta.atalho && (
                      <div className="text-xs text-gray-500">{resposta.atalho}</div>
                    )}
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {resposta.conteudo}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-2 py-4 text-sm text-gray-500 text-center">
                  Nenhuma resposta pronta disponível
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Botão IA com visual aprimorado e gradiente quando ativo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleAI}
          disabled={isAIInitializing}
          className={`${
            aiEnabled 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          } transition-all duration-200`}
          title={`Assistente IA ${aiEnabled ? 'ativado' : 'desativado'}`}
        >
          <Bot size={16} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
          title="Emojis"
        >
          <Smile size={16} />
        </Button>
      </div>

      {/* Área principal de entrada */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua mensagem... (Shift+Enter para nova linha, / para respostas prontas)"
            className="min-h-[60px] max-h-[120px] resize-none pr-12"
            disabled={loading}
          />
          
          {/* Mostrar respostas filtradas */}
          {value.startsWith('/') && respostasFiltradas.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mb-2 max-h-40 overflow-y-auto z-10">
              {respostasFiltradas.map((resposta) => (
                <button
                  key={resposta.id}
                  onClick={() => inserirRespostaPronta(resposta.conteudo)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-sm">{resposta.titulo}</div>
                  <div className="text-xs text-gray-500">{resposta.atalho}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={() => onSend(aiEnabled)}
          disabled={!value.trim() || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-[60px]"
        >
          <Send size={20} />
        </Button>
      </div>

      {/* Dica de uso com indicador aprimorado do estado da IA */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>Shift+Enter para nova linha</span>
        <div className="flex items-center gap-3">
          <span>/ para respostas prontas</span>
          {/* Indicador visual melhorado do estado da IA */}
          {isAIInitializing ? (
            <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              Carregando IA...
            </span>
          ) : aiEnabled ? (
            <span className="text-white bg-gradient-to-r from-blue-500 to-purple-600 px-2 py-1 rounded font-medium shadow-sm">
              IA Ativada
            </span>
          ) : (
            <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
              IA Desativada
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
