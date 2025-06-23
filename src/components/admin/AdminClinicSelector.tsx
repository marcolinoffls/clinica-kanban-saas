import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Search } from 'lucide-react';
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

/**
 * Componente Seletor de Clínica para Administradores
 * 
 * O que faz:
 * - Permite que administradores selecionem uma clínica específica
 * - Mostra lista de clínicas com busca e estatísticas básicas
 * - Exibe a clínica atualmente selecionada
 * 
 * Onde é usado:
 * - ChatPage quando o usuário é administrador
 * - Outras páginas administrativas que precisam filtrar por clínica
 * 
 * Como se conecta:
 * - Usa useSupabaseAdmin para buscar lista de clínicas
 * - Chama callback onClinicaSelected quando uma clínica é selecionada
 * - Recebe clinicaSelecionada como prop para mostrar estado atual
 */

interface AdminClinicSelectorProps {
  clinicaSelecionada: any | null;
  onClinicaSelected: (clinica: any | null) => void;
  showStats?: boolean;
}

export const AdminClinicSelector = ({ 
  clinicaSelecionada, 
  onClinicaSelected, 
  showStats = true 
}: AdminClinicSelectorProps) => {
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { 
    buscarEstatisticasClinicas, 
    buscarTodasClinicas, 
    isAdmin, 
    adminCheckLoading,
    debug // Para logs de debug
  } = useSupabaseAdmin();

  // Carregar lista de clínicas ao montar o componente
  useEffect(() => {
    const carregarClinicas = async () => {
      try {
        console.log('🏥 [AdminClinicSelector] Carregando lista de clínicas...');
        console.log('🏥 [AdminClinicSelector] Status admin:', isAdmin);
        console.log('🏥 [AdminClinicSelector] Admin loading:', adminCheckLoading);
        
        if (!isAdmin) {
          console.warn('⚠️ [AdminClinicSelector] Usuário não é admin - não carregando clínicas');
          setClinicas([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        
        // CORREÇÃO: Usar buscarTodasClinicas primeiro, depois buscarEstatisticasClinicas se necessário
        let dadosClinicas;
        
        if (showStats) {
          console.log('📊 [AdminClinicSelector] Buscando clínicas com estatísticas...');
          dadosClinicas = await buscarEstatisticasClinicas();
        } else {
          console.log('🏥 [AdminClinicSelector] Buscando clínicas básicas...');
          dadosClinicas = await buscarTodasClinicas();
        }
        
        console.log('✅ [AdminClinicSelector] Dados recebidos:', dadosClinicas);
        console.log('✅ [AdminClinicSelector] Total de clínicas:', dadosClinicas?.length || 0);
        
        setClinicas(dadosClinicas || []);
        
        console.log(`✅ [AdminClinicSelector] ${dadosClinicas?.length || 0} clínicas carregadas no estado`);
      } catch (error) {
        console.error('❌ [AdminClinicSelector] Erro ao carregar clínicas:', error);
        setClinicas([]);
      } finally {
        setLoading(false);
      }
    };

    // Só carrega se não estiver carregando verificação de admin
    if (!adminCheckLoading) {
      carregarClinicas();
    }
  }, [isAdmin, adminCheckLoading, showStats]);

  // Log de debug adicional
  useEffect(() => {
    console.log('🔍 [AdminClinicSelector] Estado atual:', {
      clinicas: clinicas.length,
      loading,
      isAdmin,
      adminCheckLoading,
      showStats
    });
    
    if (debug) {
      debug(); // Chama debug do hook useSupabaseAdmin
    }
  }, [clinicas, loading, isAdmin, adminCheckLoading]);

  // Filtrar clínicas por termo de busca
  const clinicasFiltradas = clinicas.filter(clinica =>
    clinica.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinica.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClinicaSelect = (clinica: any) => {
    console.log('🏥 [AdminClinicSelector] Clínica selecionada:', clinica.nome);
    onClinicaSelected(clinica);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    console.log('🔄 [AdminClinicSelector] Limpando seleção de clínica');
    onClinicaSelected(null);
  };

  // Loading state melhorado
  if (adminCheckLoading) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
        <Building2 className="w-4 h-4 text-blue-600 animate-pulse" />
        <span className="text-sm text-blue-600">Verificando permissões...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
        <Building2 className="w-4 h-4 text-red-600" />
        <span className="text-sm text-red-600">Acesso restrito a administradores</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
        <Building2 className="w-4 h-4 text-blue-600 animate-pulse" />
        <span className="text-sm text-blue-600">Carregando clínicas...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Debug info temporário */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 p-1 bg-gray-50 rounded">
          Debug: {clinicas.length} clínicas carregadas
        </div>
      )}

      {/* Seletor de Clínica */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left h-auto p-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                {clinicaSelecionada ? (
                  <div>
                    <div className="font-medium text-sm truncate">
                      {clinicaSelecionada.nome}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {clinicaSelecionada.email}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Selecionar clínica para visualizar...
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80 p-2">
          {/* Campo de busca */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar clínica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8"
            />
          </div>

          {/* Opção para limpar seleção */}
          {clinicaSelecionada && (
            <DropdownMenuItem 
              onClick={handleClearSelection}
              className="text-gray-500 italic"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Visualizar todas as clínicas
            </DropdownMenuItem>
          )}

          {/* Lista de clínicas */}
          <div className="max-h-60 overflow-y-auto">
            {clinicasFiltradas.length > 0 ? (
              clinicasFiltradas.map((clinica) => (
                <DropdownMenuItem
                  key={clinica.id}
                  onClick={() => handleClinicaSelect(clinica)}
                  className="flex-col items-start p-3 h-auto"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {clinica.nome}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {clinica.email}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {clinica.status || 'ativo'}
                    </Badge>
                  </div>
                  
                  {/* Estatísticas da clínica (se showStats for true) */}
                  {showStats && (
                    <div className="flex gap-4 mt-2 text-xs text-gray-600 w-full">
                      <span>{clinica.total_leads || 0} leads</span>
                      <span>{clinica.total_usuarios || 0} usuários</span>
                      {clinica.taxa_conversao !== undefined && (
                        <span>{clinica.taxa_conversao.toFixed(1)}% conversão</span>
                      )}
                    </div>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                {searchTerm ? (
                  'Nenhuma clínica encontrada'
                ) : clinicas.length === 0 ? (
                  'Nenhuma clínica disponível'
                ) : (
                  'Nenhuma clínica corresponde à busca'
                )}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Estatísticas da clínica selecionada */}
      {clinicaSelecionada && showStats && (
        <div className="flex gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <Badge variant="outline" className="text-xs">
            {clinicaSelecionada.total_leads || 0} leads
          </Badge>
          <Badge variant="outline" className="text-xs">
            {clinicaSelecionada.total_usuarios || 0} usuários
          </Badge>
          {clinicaSelecionada.taxa_conversao !== undefined && (
            <Badge variant="outline" className="text-xs">
              {clinicaSelecionada.taxa_conversao.toFixed(1)}% conversão
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {clinicaSelecionada.plano_contratado || 'N/A'}
          </Badge>
        </div>
      )}
    </div>
  );
};