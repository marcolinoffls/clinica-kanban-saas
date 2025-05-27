
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Calendar, MessageSquare, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Página de Boas-vindas (Landing Page)
 * 
 * Página pública exibida para usuários não autenticados.
 * Apresenta as funcionalidades do MediCRM e permite
 * acesso às páginas de login e cadastro.
 * 
 * Funcionalidades mostradas:
 * - Gerenciamento de leads e pacientes
 * - Sistema de agendamento
 * - Chat integrado
 * - Dashboard com métricas
 * - Segurança e conformidade
 */

const WelcomePage = () => {
  const features = [
    {
      icon: Users,
      title: 'Gestão de Pacientes',
      description: 'Organize e gerencie seus pacientes de forma eficiente com sistema kanban.'
    },
    {
      icon: Calendar,
      title: 'Agendamento',
      description: 'Sistema completo de agendamento de consultas e procedimentos.'
    },
    {
      icon: MessageSquare,
      title: 'Chat Integrado',
      description: 'Comunicação direta com pacientes através de chat integrado.'
    },
    {
      icon: TrendingUp,
      title: 'Métricas e Relatórios',
      description: 'Acompanhe o desempenho da sua clínica com dashboards detalhados.'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Seus dados protegidos com criptografia e conformidade LGPD.'
    },
    {
      icon: Heart,
      title: 'Focado na Saúde',
      description: 'Desenvolvido especificamente para profissionais da área médica.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">MediCRM</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/signup">
                <Button>Criar Conta</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gerencie sua clínica com
            <span className="text-blue-600 block">inteligência e eficiência</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            MediCRM é a solução completa para gestão de clínicas médicas. 
            Organize pacientes, agende consultas e acompanhe métricas em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="px-8">
                Começar Gratuitamente
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8">
                Já tenho uma conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para sua clínica
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Funcionalidades desenvolvidas especificamente para atender as necessidades 
              de profissionais da saúde.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-white mb-4">
            Pronto para transformar sua clínica?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a centenas de profissionais que já confiam no MediCRM
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="px-8">
              Criar Conta Gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-6 w-6 text-blue-400 mr-2" />
            <span className="text-lg font-semibold">MediCRM</span>
          </div>
          <p className="text-gray-400">
            © 2024 MediCRM. Desenvolvido com ❤️ para profissionais da saúde.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
