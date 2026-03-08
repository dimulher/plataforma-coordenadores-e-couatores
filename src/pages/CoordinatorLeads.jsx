
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Phone, Mail, User as UserIcon } from 'lucide-react';

const COLUMNS = [
  { id: 'NOVO', title: 'Novo' },
  { id: 'CONTATO', title: 'Contato Feito' },
  { id: 'QUALIFICADO', title: 'Qualificado' },
  { id: 'PROPOSTA', title: 'Proposta' },
  { id: 'FECHADO', title: 'Fechado' },
  { id: 'PERDIDO', title: 'Perdido' }
];

const CoordinatorLeads = () => {
  const { getCoordinatorLeads, updateLeadStatus } = useCoordinatorData();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await getCoordinatorLeads();
      setLeads(data || []);
    };
    load();
  }, []);

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');

    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === statusId) return;

    const success = await updateLeadStatus(leadId, statusId);
    if (success) {
      setLeads(prev => prev.map(l => {
        if (l.id === leadId) {
          return { ...l, status: statusId, updated_at: new Date().toISOString() };
        }
        return l;
      }));
      toast({
        title: 'Status atualizado',
        description: `${lead.name} movido para ${statusId}`,
      });
    }
  };

  const isUrgent = (updatedAt) => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return new Date(updatedAt) < threeDaysAgo;
  };

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Meu Funil - NAB Platform</title>
      </Helmet>

      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Funil de Vendas</h1>
            <p className="text-muted-foreground mt-1">Arraste os cards para atualizar o status</p>
          </div>
          <div className="w-full md:w-64">
            <Input
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-card text-foreground border-border/50 focus:border-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(column => {
              const columnLeads = filteredLeads.filter(l => l.status === column.id);

              return (
                <div
                  key={column.id}
                  className="w-80 flex flex-col kanban-column"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                    <Badge variant="secondary" className="bg-background text-foreground">
                      {columnLeads.length}
                    </Badge>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
                    {columnLeads.map(lead => {
                      const urgent = ['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA'].includes(lead.status) && isUrgent(lead.updated_at);

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className={`kanban-card ${urgent ? 'kanban-card-urgent' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm text-foreground line-clamp-1">{lead.name}</h4>
                            {urgent && <div className="h-2 w-2 rounded-full bg-destructive" title="Parado há > 3 dias"></div>}
                          </div>

                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-border/20 flex justify-between items-center text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                            </div>
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-accent/30 text-accent bg-accent/5">
                              {lead.source}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {columnLeads.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-border/20 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                        Arraste cards para cá
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default CoordinatorLeads;
