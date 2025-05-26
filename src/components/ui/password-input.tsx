
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Componente de Input com funcionalidade de mostrar/ocultar senha
 * 
 * Funcionalidades:
 * - Alternância entre texto mascarado e visível
 * - Botão de copiar para área de transferência
 * - Ícones visuais para estado de visibilidade
 * - Integração com sistema de toast para feedback
 */

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  className?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  description,
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Função para alternar visibilidade da senha
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Função para copiar valor para área de transferência
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('ID da instância copiado para área de transferência');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar ID da instância');
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-20" // Espaço para os botões
        />
        
        {/* Botões de ação */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          {/* Botão de copiar - só aparece se houver valor */}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={copyToClipboard}
              title="Copiar ID da instância"
            >
              <Copy size={16} className="text-gray-500" />
            </Button>
          )}
          
          {/* Botão de mostrar/ocultar */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={togglePasswordVisibility}
            title={showPassword ? 'Ocultar ID' : 'Mostrar ID'}
          >
            {showPassword ? (
              <EyeOff size={16} className="text-gray-500" />
            ) : (
              <Eye size={16} className="text-gray-500" />
            )}
          </Button>
        </div>
      </div>
      
      {description && (
        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};
