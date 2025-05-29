
import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Zap, Bot, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Componente de entrada de mensagem avançado
 * 
 * Funcionalidades:
 * - Área de texto com redimensionamento automático
 * - Suporte a Shift+Enter para nova linha
 * - Botões para anexos, respostas prontas, IA e emojis
 * - Toggle do botão IA para controle de estado com estilo em gradiente
 * - Integração com respostas prontas via atalhos
 * - Validação de entrada e loading states
 */

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (aiEnabled?: boolean) => void; // Adicionado parâmetro para estado da IA
  onAttachFile?: () => void;
  loading?: boolean;
  respostasProntas?: Array<{
    id: string;
    titulo: string;
    conteudo: string;
    atalho?: string;
  }>;
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  onAttachFile,
  loading = false,
  respostasProntas = []
}: MessageInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showRespostasProntas, setShowRespostasProntas] = useState(false);
  // Estado para controlar se o botão de IA está ativado
  const [aiEnabled, setAiEnabled] = useState(false);

  // Função para lidar com teclas especiais
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter = nova linha (comportamento padrão)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) {
        // Enviar estado do botão IA junto com a mensagem
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

  // Função para toggle do botão IA
  const toggleAI = () => {
    setAiEnabled(!aiEnabled);
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
        <Button
          variant="ghost"
          size="sm"
          onClick={onAttachFile}
          className="text-gray-500 hover:text-gray-700"
          title="Anexar arquivo"
        >
          <Paperclip size={16} />
        </Button>

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

        {/* Botão IA com toggle de estado e gradiente */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAI}
          className={cn(
            "transition-all duration-200",
            aiEnabled 
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          )}
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
          onClick={() => onSend(aiEnabled)} // Passar estado da IA ao enviar
          disabled={!value.trim() || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-[60px]"
        >
          <Send size={20} />
        </Button>
      </div>

      {/* Dica de uso com indicador do estado da IA */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>Shift+Enter para nova linha</span>
        <div className="flex items-center gap-2">
          <span>/ para respostas prontas</span>
          {aiEnabled && (
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
              IA ativada
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
