import { useState, useEffect } from 'react';
import { Save, Users, Bell, Shield, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Página de Configurações
 * 
 * Seções de configuração:
 * - Informações da clínica (incluindo webhook_usuario)
 * - Gerenciamento de usuários e permissões
 * - Configurações de notificações
 * - Integrações externas (agora inclui evolution_instance_name)
 * - Configurações de segurança
 * 
 * Todas as configurações são persistidas no Supabase
 * e aplicadas em tempo real no sistema.
 */

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('clinic');
  const [loading, setLoading] = useState(false);
  const [clinicaId, setClinicaId] = useState<string | null>(null);
  
  // Estados para os formulários de configuração
  const [clinicData, setClinicData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'SP',
    zipCode: '',
    webhook_usuario: '', // Campo para webhook
    evolution_instance_name: '' // Novo campo para instância Evolution API
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    leadAlerts: true
  });

  // Carregar dados da clínica ao montar o componente
  useEffect(() => {
    carregarDadosClinica();
  }, []);

  // Função para carregar dados da clínica
  const carregarDadosClinica = async () => {
    try {
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar dados da clínica:', error);
        return;
      }

      if (data) {
        setClinicaId(data.id);
        setClinicData({
          name: data.nome || '',
          phone: data.telefone || '',
          email: data.email || '',
          address: data.endereco || '',
          city: '', // Não temos cidade separada no banco
          state: 'SP',
          zipCode: '', // Não temos CEP separado no banco
          webhook_usuario: data.webhook_usuario || '',
          evolution_instance_name: data.evolution_instance_name || '' // Carregar ID da instância Evolution
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Função para salvar configurações da clínica
  const salvarConfiguracoes = async () => {
    try {
      setLoading(true);

      if (clinicaId) {
        // Atualizar clínica existente
        const { error } = await supabase
          .from('clinicas')
          .update({
            nome: clinicData.name,
            telefone: clinicData.phone,
            email: clinicData.email,
            endereco: clinicData.address,
            webhook_usuario: clinicData.webhook_usuario,
            evolution_instance_name: clinicData.evolution_instance_name, // Salvar ID da instância Evolution
            updated_at: new Date().toISOString()
          })
          .eq('id', clinicaId);

        if (error) throw error;
      } else {
        // Criar nova clínica
        const { data, error } = await supabase
          .from('clinicas')
          .insert({
            nome: clinicData.name,
            telefone: clinicData.phone,
            email: clinicData.email,
            endereco: clinicData.address,
            webhook_usuario: clinicData.webhook_usuario,
            evolution_instance_name: clinicData.evolution_instance_name, // Incluir no insert
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setClinicaId(data.id);
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Tabs de navegação
  const tabs = [
    { id: 'clinic', label: 'Clínica', icon: Shield },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'integrations', label: 'Integrações', icon: CreditCard }
  ];

  return (
    <div className="h-full">
      {/* Header da página */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
          <p className="text-gray-600 mt-1">
            Configure sua clínica e personalize o sistema
          </p>
        </div>
        <button
          onClick={salvarConfiguracoes}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Navegação lateral */}
        <div className="w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo das configurações */}
        <div className="flex-1">
          {activeTab === 'clinic' && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Informações da Clínica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Clínica *
                  </label>
                  <input
                    type="text"
                    value={clinicData.name}
                    onChange={(e) => setClinicData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={clinicData.phone}
                    onChange={(e) => setClinicData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={clinicData.email}
                    onChange={(e) => setClinicData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={clinicData.zipCode}
                    onChange={(e) => setClinicData(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={clinicData.address}
                    onChange={(e) => setClinicData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={clinicData.city}
                    onChange={(e) => setClinicData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={clinicData.state}
                    onChange={(e) => setClinicData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    {/* Adicionar outros estados */}
                  </select>
                </div>

                {/* Campo para usuário do webhook */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuário do Webhook
                  </label>
                  <input
                    type="text"
                    value={clinicData.webhook_usuario}
                    onChange={(e) => setClinicData(prev => ({ ...prev, webhook_usuario: e.target.value }))}
                    placeholder="Ex: clinica-exemplo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Nome de usuário para integração via webhook. Será usado na URL: 
                    <code className="bg-gray-100 px-1 rounded text-xs ml-1">
                      https://webhooks.marcolinofernades.site/webhook/{clinicData.webhook_usuario || '{usuario}'}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Gerenciamento de Usuários
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Dr. João Silva</h4>
                    <p className="text-sm text-gray-600">Administrador</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Editar
                  </button>
                </div>
                
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Ana Santos</h4>
                    <p className="text-sm text-gray-600">Recepcionista</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Editar
                  </button>
                </div>
              </div>
              
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                + Adicionar Usuário
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Configurações de Notificações
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Notificações por Email</h4>
                    <p className="text-sm text-gray-600">Receba alertas importantes por email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        emailNotifications: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Notificações por SMS</h4>
                    <p className="text-sm text-gray-600">Receba alertas urgentes por SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        smsNotifications: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Lembretes de Consulta</h4>
                    <p className="text-sm text-gray-600">Enviar lembretes automáticos aos pacientes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.appointmentReminders}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        appointmentReminders: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Alertas de Novos Leads</h4>
                    <p className="text-sm text-gray-600">Notificar quando novos leads chegarem</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.leadAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        leadAlerts: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Integrações Externas
              </h3>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">WhatsApp Business</h4>
                      <p className="text-sm text-gray-600">Conecte sua conta do WhatsApp Business</p>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Conectar
                    </button>
                  </div>
                  
                  {/* Novo campo para ID da Instância Evolution API */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID da Instância Evolution API
                    </label>
                    <input
                      type="text"
                      value={clinicData.evolution_instance_name}
                      onChange={(e) => setClinicData(prev => ({ ...prev, evolution_instance_name: e.target.value }))}
                      placeholder="Cole aqui o nome ou ID da sua instância Evolution (ex: minha_clinica_instance)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Este ID será usado para direcionar as mensagens de WhatsApp através da Evolution API.
                    </p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Webhook Integration</h4>
                      <p className="text-sm text-gray-600">
                        Webhook configurado para: {clinicData.webhook_usuario ? 
                          `https://webhooks.marcolinofernades.site/webhook/${clinicData.webhook_usuario}` : 
                          'Não configurado'
                        }
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      clinicData.webhook_usuario ? 
                        'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'
                    }`}>
                      {clinicData.webhook_usuario ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Stripe</h4>
                      <p className="text-sm text-gray-600">Processamento de pagamentos</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Conectar
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Google Calendar</h4>
                      <p className="text-sm text-gray-600">Sincronizar com Google Calendar</p>
                    </div>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      Conectar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
