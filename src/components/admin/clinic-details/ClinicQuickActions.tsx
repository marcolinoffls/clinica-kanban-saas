
import { useState } from 'react';
import { BarChart3, MessageSquare, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminClinicDashboard } from './AdminClinicDashboard';
import { AdminClinicChat } from './AdminClinicChat';

/**
 * Componente de Ações Rápidas para Clínicas no Painel Administrativo
 * 
 * O que faz:
 * Fornece acesso rápido ao dashboard e chat da clínica selecionada
 * através de modais que replicam as funcionalidades principais.
 * 
 * Onde é usado:
 * Na página de detalhes da clínica no painel administrativo.
 * 
 * Como se conecta:
 * - Recebe o ID da clínica como prop
 * - Abre modais com réplicas do dashboard e chat da clínica
 */

interface ClinicQuickActionsProps {
  clinicaId: string;
  onOpenChat?: () => void;
  onAddLead?: () => void;
}

export const ClinicQuickActions = ({ clinicaId, onOpenChat, onAddLead }: ClinicQuickActionsProps) => {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = () => {
    if (onOpenChat) {
      onOpenChat();
    } else {
      setIsChatOpen(true);
    }
  };

  const handleAddLead = () => {
    if (onAddLead) {
      onAddLead();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Botão para Dashboard */}
          <Button
            onClick={() => setIsDashboardOpen(true)}
            variant="outline"
            className="h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium">Dashboard</span>
            <span className="text-xs text-gray-500">Métricas e indicadores</span>
          </Button>

          {/* Botão para Chat */}
          <Button
            onClick={handleOpenChat}
            variant="outline"
            className="h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300"
          >
            <MessageSquare className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium">Chat</span>
            <span className="text-xs text-gray-500">Conversas com leads</span>
          </Button>
        </div>

        {/* Botão para Adicionar Lead */}
        {onAddLead && (
          <div className="mt-4">
            <Button
              onClick={handleAddLead}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Adicionar Lead
            </Button>
          </div>
        )}

        {/* Modal do Dashboard */}
        <Dialog open={isDashboardOpen} onOpenChange={setIsDashboardOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Dashboard da Clínica
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[calc(90vh-120px)]">
              <AdminClinicDashboard clinicaId={clinicaId} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal do Chat */}
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat da Clínica
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[calc(90vh-120px)]">
              <AdminClinicChat clinicaId={clinicaId} />
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
