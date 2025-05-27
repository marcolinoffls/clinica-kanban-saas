
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Página de Cadastro de Usuários
 * 
 * Permite que novos usuários se registrem no sistema com:
 * - Nome completo (opcional, mas recomendado)
 * - Email (obrigatório)
 * - Senha (obrigatória, mínimo 6 caracteres)
 * - Confirmação de senha (deve coincidir)
 * 
 * Após o cadastro, o trigger do banco cria automaticamente
 * um perfil na tabela user_profiles com os dados fornecidos.
 * 
 * Inclui validações no frontend e tratamento de erros.
 */

export const SignUpPage = () => {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  // Estados do formulário
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Estados de UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Atualizar campos do formulário
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  // Validar força da senha
  const isStrongPassword = (password: string) => {
    return password.length >= 6;
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email deve ter formato válido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (!isStrongPassword(formData.password)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Verifique os campos do formulário');
      return;
    }

    try {
      await signUp(
        formData.email.trim(),
        formData.password,
        formData.nomeCompleto.trim() || undefined
      );
      
      // Redirecionar para login após cadastro bem-sucedido
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      // Erro já é tratado no contexto de autenticação
      console.error('Erro no cadastro:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Criar Conta
          </CardTitle>
          <CardDescription>
            Crie sua conta para acessar o MediCRM
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome Completo */}
            <div>
              <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo (opcional)
              </label>
              <Input
                id="nomeCompleto"
                type="text"
                value={formData.nomeCompleto}
                onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                placeholder="Digite seu nome completo"
                className={errors.nomeCompleto ? 'border-red-500' : ''}
              />
              {errors.nomeCompleto && (
                <p className="text-sm text-red-600 mt-1">{errors.nomeCompleto}</p>
              )}
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Digite seu email"
                className={errors.email ? 'border-red-500' : ''}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha *
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Digite sua senha"
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>

            {/* Campo Confirmação de Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirme sua senha"
                  className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Botão de Cadastro */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          {/* Links de navegação */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Fazer login
              </Link>
            </p>
            
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;
