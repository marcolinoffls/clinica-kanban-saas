
import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Clock, MessageSquare, Save, Link2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente de detalhes individuais da clínica no painel administrativo
 * 
 * Funcionalidades:
 * - Exibe informações detalhadas da clínica
 * - Permite editar o prompt administrativo
 * - Gerencia ID da instância de integração
 * - Mostra estatísticas específicas da clínica
 */

interface AdminClinicDetailsProps {
  clinicaId: string;
  onBack: () => void;
}

export const AdminClinicDetails = ({ clinicaId, onBack }: AdminClinicDetailsProps) => {
  const {
    buscarDetalhesClinica,
    atualizarPromptClinica,
    atualizarInstanciaIntegracao
  } = useSupabaseAdmin();

  const { toast } = useToast();

  const [clinica, setClinica] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminPrompt, setAdminPrompt] = useState('');
  const [instanceId, setInstanceId] = useState('');

  // Carregar dados da clínica ao inicializar
  useEffect(() => {
    const carregarDetalhes = async () => {
      try {
        setLoading(true);
        const dados = await buscarDetalhesClinica(clinicaId);
        setClinica(dados);
        setAdminPrompt(dados.admin_prompt || '');
        setInstanceId(dados.integracao_instance_id || '');
      } catch (error) {
        console.error('Erro ao carregar detalhes da clínica:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da clínica.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    carregarDetalhes();
  }, [clinicaId]);

  // Função para salvar o prompt administrativo
  const salvarPrompt = async () => {
    try {
      setSaving(true);
      await atualizarPromptClinica(clinicaId, adminPrompt);
      
      toast({
        title: "Sucesso",
        description: "Prompt administrativo salvo com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar prompt:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o prompt administrativo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Função para salvar o ID da instância de integração
  const salvarInstanceId = async () => {
    try {
      setSaving(true);
      await atualizarInstanciaIntegracao(clinicaId, instanceId);
      
      toast({
        title: "Sucesso",
        description: "ID da instância de integração salvo com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar instance ID:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o ID da instância.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Função para formatar tempo em minutos para texto legível
  const formatarTempoResposta = (minutos: number) => {
    if (minutos === 0) return 'Sem dados disponíveis';
    
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = Math.floor(minutos % 60);
    
    if (horas > 0) {
      return `${horas}h ${minutosRestantes}min`;
    }
    return `${minutosRestantes}min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!clinica) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button onClick={onBack} variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Clínica não encontrada.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header com botão de voltar */}
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Lista de Clínicas
          </Button>
          
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {clinica.nome}
              </h1>
              <p className="text-gray-600">
                Detalhes e configurações administrativas
              </p>
            </div>
          </div>
        </div>

        {/* Cards com estatísticas da clínica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads de Anúncios</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clinica.leads_anuncios_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                Leads originados de anúncios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatarTempoResposta(clinica.tempo_medio_resposta_minutos || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Primeira resposta aos leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status da Integração</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={clinica.evolution_instance_name ? "default" : "secondary"}>
                {clinica.evolution_instance_name ? "Configurada" : "Não Configurada"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Evolution API
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações básicas da clínica */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações da Clínica</CardTitle>
            <CardDescription>
              Dados básicos de contato e cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">E-mail</Label>
                <p className="text-gray-900">{clinica.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                <p className="text-gray-900">{clinica.telefone || 'Não informado'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Instância Evolution</Label>
                <p className="text-gray-900">{clinica.evolution_instance_name || 'Não configurada'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Administrativo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prompt Administrativo</CardTitle>
            <CardDescription>
              Configurações específicas de IA para esta clínica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-prompt">
                Prompt para IA (Configurações específicas desta clínica)
              </Label>
              <Textarea
                id="admin-prompt"
                placeholder="Digite o prompt específico para a IA desta clínica..."
                value={adminPrompt}
                onChange={(e) => setAdminPrompt(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>
            <Button 
              onClick={salvarPrompt} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Prompt'}
            </Button>
          </CardContent>
        </Card>

        {/* ID da Instância de Integração */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Integração</CardTitle>
            <CardDescription>
              Configurações técnicas de integração com APIs externas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instance-id">
                ID da Instância de Integração
              </Label>
              <Input
                id="instance-id"
                placeholder="Digite o ID da instância (ex: WhatsApp API, Evolution API)"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este ID será usado para configurações de integração com APIs externas
              </p>
            </div>
            <Button 
              onClick={salvarInstanceId} 
              disabled={saving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar ID da Instância'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
