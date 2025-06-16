
import { useState, useEffect } from 'react';
import { X, Save, Edit2, Calendar, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lead } from '@/types/global';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RegistroAgendamentoModal } from '@/components/agendamentos/RegistroAgendamentoModal';

/**
 * Componente da Sidebar de Informações do Lead
 * 
 * Exibe e permite editar informações detalhadas do lead selecionado,
 * incluindo dados pessoais, notas, histórico e ações.
 * Conecta-se diretamente ao Supabase para persistir as alterações.
 */

interface LeadInfoSidebarProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
}

export const LeadInfoSidebar = ({ lead, isOpen, onClose, onUpdateLead }: LeadInfoSidebarProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead>(lead);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);

  // useEffect para resetar editedLead quando o lead.id mudar
  useEffect(() => {
    setEditedLead(lead);
    setIsEditing(false);
    setNewNote('');
    // Carregar notas salvas do localStorage ou de outro local
    const savedNotes = localStorage.getItem(`notes_${lead.id}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      setNotes([]);
    }
  }, [lead.id]);

  // Função para salvar alterações do lead
  const handleSave = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('leads')
        .update({
          nome: editedLead.nome,
          telefone: editedLead.telefone,
          email: editedLead.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) {
        console.error('Erro ao atualizar lead:', error);
        toast.error('Erro ao atualizar lead');
        return;
      }

      onUpdateLead(editedLead);
      setIsEditing(false);
      toast.success('Lead atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar edição
  const handleCancel = () => {
    setEditedLead(lead);
    setIsEditing(false);
  };

  // Função para adicionar nova nota
  const handleAddNote = () => {
    if (newNote.trim()) {
      const updatedNotes = [...notes, newNote.trim()];
      setNotes(updatedNotes);
      // Salvar no localStorage (poderia ser no Supabase também)
      localStorage.setItem(`notes_${lead.id}`, JSON.stringify(updatedNotes));
      setNewNote('');
      toast.success('Nota adicionada com sucesso!');
    }
  };

  // Função para remover nota
  const handleRemoveNote = (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${lead.id}`, JSON.stringify(updatedNotes));
    toast.success('Nota removida!');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Informações do Lead
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Informações básicas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Dados do Lead</h4>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 size={16} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nome
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedLead.nome || ''}
                    onChange={(e) => setEditedLead(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{lead.nome || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Telefone
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedLead.telefone || ''}
                    onChange={(e) => setEditedLead(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{lead.telefone || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedLead.email || ''}
                    onChange={(e) => setEditedLead(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{lead.email || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Data de Criação
                </label>
                <p className="text-gray-900">
                  {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Botão Novo Agendamento */}
          <div className="bg-blue-50 rounded-lg p-4">
            <button
              onClick={() => setShowAgendamentoModal(true)}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Calendar size={20} />
              Novo Agendamento
            </button>
          </div>

          {/* Anotações */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-gray-600" />
              <h4 className="font-medium text-gray-900">Anotações</h4>
            </div>

            <div className="space-y-3">
              {/* Formulário para nova nota */}
              <div className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Digite uma nova anotação..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Adicionar Nota
                </button>
              </div>

              {/* Lista de notas */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notes.length > 0 ? (
                  notes.map((note, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200 group">
                      <p className="text-sm text-gray-700 mb-2">{note}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <button
                          onClick={() => handleRemoveNote(index)}
                          className="text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma anotação ainda
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* LTV (Lifetime Value) */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-green-600" />
              <h4 className="font-medium text-gray-900">LTV</h4>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">R$ 0,00</p>
              <p className="text-sm text-gray-600">Valor total investido</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento */}
      {showAgendamentoModal && (
        <RegistroAgendamentoModal
          isOpen={showAgendamentoModal}
          onClose={() => setShowAgendamentoModal(false)}
          clientName={lead.nome || ''}
          clientPhone={lead.telefone || ''}
        />
      )}
    </>
  );
};
