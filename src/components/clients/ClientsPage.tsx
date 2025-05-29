import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Phone, Mail, Calendar, User, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { LeadModal } from '@/components/kanban/LeadModal';

interface Lead {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  anotacoes?: string;
  origem_lead?: string;
  servico_interesse?: string;
  created_at: string;
  updated_at: string;
}

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
}

export const ClientsPage = () => {
  const { leads, tags, etapas, loading } = useSupabaseData();
  const { updateLead, deleteLead } = useSupabaseLeads();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedEtapa, setSelectedEtapa] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Filtrar leads
  const filteredLeads = leads.filter((lead) => {
    const searchMatch =
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.telefone && lead.telefone.includes(searchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const tagMatch = selectedTag === 'all' || lead.tag_id === selectedTag;
    const etapaMatch = selectedEtapa === 'all' || lead.etapa_kanban_id === selectedEtapa;

    return searchMatch && tagMatch && etapaMatch;
  });

  // Separar leads por status
  const novosLeads = filteredLeads.filter((lead) => lead.etapa_kanban_id === etapas[0]?.id);
  const convertidos = filteredLeads.filter((lead) => lead.convertido);
  const perdidos = filteredLeads.filter((lead) => lead.status_conversao === 'perdido');

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Formatar telefone
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    return phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Novo Contato
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.cor }} 
                    />
                    {tag.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {etapas.map((etapa) => (
                <SelectItem key={etapa.id} value={etapa.id}>
                  {etapa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todos">
              Todos ({filteredLeads.length})
            </TabsTrigger>
            <TabsTrigger value="novos">
              Novos ({novosLeads.length})
            </TabsTrigger>
            <TabsTrigger value="convertidos">
              Convertidos ({convertidos.length})
            </TabsTrigger>
            <TabsTrigger value="perdidos">
              Perdidos ({perdidos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {filteredLeads.map((lead) => (
                <Card key={lead.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Avatar className="mr-2">
                          <AvatarFallback>{lead.nome.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {lead.nome}
                        {lead.tag_id && (
                          <Badge 
                            className="ml-2"
                            style={{ 
                              backgroundColor: tags.find(tag => tag.id === lead.tag_id)?.cor,
                              color: 'white' 
                            }}
                          >
                            {tags.find(tag => tag.id === lead.tag_id)?.nome}
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      {formatPhoneNumber(lead.telefone)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      Criado em: {formatDate(lead.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      {etapas.find(etapa => etapa.id === lead.etapa_kanban_id)?.nome}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Tem certeza que deseja excluir ${lead.nome}?`)) {
                            await deleteLead(lead.id);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="novos" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {novosLeads.map((lead) => (
                <Card key={lead.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Avatar className="mr-2">
                          <AvatarFallback>{lead.nome.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {lead.nome}
                        {lead.tag_id && (
                          <Badge 
                            className="ml-2"
                            style={{ 
                              backgroundColor: tags.find(tag => tag.id === lead.tag_id)?.cor,
                              color: 'white' 
                            }}
                          >
                            {tags.find(tag => tag.id === lead.tag_id)?.nome}
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      {formatPhoneNumber(lead.telefone)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      Criado em: {formatDate(lead.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      {etapas.find(etapa => etapa.id === lead.etapa_kanban_id)?.nome}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Tem certeza que deseja excluir ${lead.nome}?`)) {
                            await deleteLead(lead.id);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="convertidos" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {convertidos.map((lead) => (
                <Card key={lead.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Avatar className="mr-2">
                          <AvatarFallback>{lead.nome.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {lead.nome}
                        {lead.tag_id && (
                          <Badge 
                            className="ml-2"
                            style={{ 
                              backgroundColor: tags.find(tag => tag.id === lead.tag_id)?.cor,
                              color: 'white' 
                            }}
                          >
                            {tags.find(tag => tag.id === lead.tag_id)?.nome}
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      {formatPhoneNumber(lead.telefone)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      Criado em: {formatDate(lead.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      {etapas.find(etapa => etapa.id === lead.etapa_kanban_id)?.nome}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Tem certeza que deseja excluir ${lead.nome}?`)) {
                            await deleteLead(lead.id);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="perdidos" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {perdidos.map((lead) => (
                <Card key={lead.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Avatar className="mr-2">
                          <AvatarFallback>{lead.nome.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {lead.nome}
                        {lead.tag_id && (
                          <Badge 
                            className="ml-2"
                            style={{ 
                              backgroundColor: tags.find(tag => tag.id === lead.tag_id)?.cor,
                              color: 'white' 
                            }}
                          >
                            {tags.find(tag => tag.id === lead.tag_id)?.nome}
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      {formatPhoneNumber(lead.telefone)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      Criado em: {formatDate(lead.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      {etapas.find(etapa => etapa.id === lead.etapa_kanban_id)?.nome}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Tem certeza que deseja excluir ${lead.nome}?`)) {
                            await deleteLead(lead.id);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
        }}
        lead={editingLead}
        etapas={etapas}
        onSave={async (leadData) => {
          if (editingLead) {
            await updateLead(editingLead.id, leadData);
          }
          setIsModalOpen(false);
          setEditingLead(null);
        }}
      />
    </div>
  );
};
