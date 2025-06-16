
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente de Configurações de Segurança da Conta
 * 
 * Permite ao usuário alterar:
 * - Email da conta
 * - Senha da conta
 * 
 * Conecta-se ao Supabase Auth para realizar as alterações
 * de forma segura, incluindo verificações necessárias.
 */

export const AccountSecuritySettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados para alteração de email
  const [emailData, setEmailData] = useState({
    newEmail: user?.email || '',
    currentPassword: ''
  });

  // Estados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Função para alterar email
  const handleChangeEmail = async () => {
    try {
      setLoading(true);

      // Validações básicas
      if (!emailData.newEmail || !emailData.currentPassword) {
        toast.error('Preencha todos os campos para alterar o email.');
        return;
      }

      if (emailData.newEmail === user?.email) {
        toast.error('O novo email deve ser diferente do atual.');
        return;
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.newEmail)) {
        toast.error('Digite um email válido.');
        return;
      }

      // Verificar senha atual fazendo login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: emailData.currentPassword
      });

      if (loginError) {
        toast.error('Senha atual incorreta.');
        return;
      }

      // Alterar email
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail
      });

      if (error) {
        console.error('Erro ao alterar email:', error);
        if (error.message.includes('email already registered')) {
          toast.error('Este email já está em uso por outra conta.');
        } else {
          toast.error('Erro ao alterar email. Tente novamente.');
        }
        return;
      }

      toast.success('Email alterado com sucesso! Verifique sua nova caixa de entrada para confirmar.');
      
      // Limpar formulário
      setEmailData({
        newEmail: emailData.newEmail,
        currentPassword: ''
      });

    } catch (error) {
      console.error('Erro ao alterar email:', error);
      toast.error('Erro inesperado ao alterar email.');
    } finally {
      setLoading(false);
    }
  };

  // Função para alterar senha
  const handleChangePassword = async () => {
    try {
      setLoading(true);

      // Validações básicas
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast.error('Preencha todos os campos para alterar a senha.');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('A nova senha e a confirmação devem ser iguais.');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        toast.error('A nova senha deve ser diferente da atual.');
        return;
      }

      // Verificar senha atual fazendo login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword
      });

      if (loginError) {
        toast.error('Senha atual incorreta.');
        return;
      }

      // Alterar senha
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Erro ao alterar senha:', error);
        toast.error('Erro ao alterar senha. Tente novamente.');
        return;
      }

      toast.success('Senha alterada com sucesso!');
      
      // Limpar formulário
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro inesperado ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Segurança da Conta
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Gerencie as configurações de segurança da sua conta
        </p>
      </div>

      {/* Seção de Alteração de Email */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Alterar Email</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Atual
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Novo Email
            </label>
            <input
              type="email"
              value={emailData.newEmail}
              onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o novo email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={emailData.currentPassword}
                onChange={(e) => setEmailData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleChangeEmail}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Alterando...' : 'Alterar Email'}
          </button>
        </div>
      </div>

      {/* Seção de Alteração de Senha */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Alterar Senha</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a nova senha (min. 6 caracteres)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirme a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-medium text-yellow-800 mb-2">Informações Importantes:</h5>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Ao alterar o email, você receberá um link de confirmação na nova caixa de entrada.</li>
          <li>• É necessário confirmar o novo email para que a alteração seja efetivada.</li>
          <li>• Suas sessões serão mantidas durante a alteração da senha.</li>
          <li>• Use senhas fortes com pelo menos 6 caracteres.</li>
        </ul>
      </div>
    </div>
  );
};
