
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Phone, Mail, Clock, Filter, Plus } from 'lucide-react';

const COLUMNS = [
  { id: 'NOVO', title: 'Novos', color: 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/20' },
  { id: 'CONTATO', title: 'Em Contato', color: 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/20' },
  { id: 'QUALIFICADO', title: 'Qualificados', color: 'border-purple-200 bg-purple-50/50 dark:bg-purple-900/20' },
  { id: 'PROPOSTA', title: 'Proposta', color: 'border-orange-200 bg-orange-50/50 dark:bg-orange-900/20' },
  { id: 'FECHADO', title: 'Fechados', color: 'border-green-200 bg-green-50/50 dark:bg-green-900/20' },
  { id: 'PERDIDO', title: 'Perdidos', color: 'border-red-200 bg-red-50/50 dark:bg-red-900/20' },
];

const LeadsFunnelPage = () => {
  const { user, getTenantId } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = () => {
    const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
    if (data.leads) {
      let userLeads = data.leads.filter(l => l.tenant_id === getTenantId());
      if (user.role === 'COORDENADOR') {
        userLeads = userLeads.filter(l => l.coordinator_id === user.id);
      }
      setLeads(userLeads);
    }
  };

  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    // Small timeout to allow drag image generation before hiding
    setTimeout(() => {
      e.target.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedLeadId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (!draggedLeadId) return;

    const data = JSON.parse(localStorage.getItem('nab_data'));
    const leadIndex = data.leads.findIndex(l => l.id === draggedLeadId);
    
    if (leadIndex > -1 && data.leads[leadIndex].status !== newStatus) {
      const oldStatus = data.leads[leadIndex].status;
      data.leads[leadIndex].status = newStatus;
      data.leads[leadIndex].updated_at = new Date('2026-03-01T12:00:00Z').toISOString(); // Use fixed context date
      
      localStorage.setItem('nab_data', JSON.stringify(data));
      loadLeads();
      
      toast({
        title: "Lead Atualizado",
        description: `Movido de ${oldStatus} para ${newStatus}`,
      });
    }
    setDraggedLeadId(null);
  };

  const getDaysSinceUpdate = (dateString) => {
    const updatedDate = new Date(dateString);
    const currentDate = new Date('2026-03-01T12:00:00Z');
    const diffDays = Math.floor(Math.abs(currentDate - updatedDate) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      <Helmet>
        <title>Funil de Leads - NAB</title>
      </Helmet>

      <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Funil de Vendas</h1>
            <p className="text-muted-foreground mt-1">Arraste os cards para atualizar o status.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast({title: '🚧 Filtros em breve'})}>
              <Filter className="h-4 w-4 mr-2" /> Filtros
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Lead
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start min-h-0">
          {COLUMNS.map(column => {
            const columnLeads = leads.filter(l => l.status === column.id);
            return (
              <div 
                key={column.id}
                className={`min-w-[300px] w-[300px] border-t-4 rounded-xl flex flex-col max-h-full ${column.color}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="p-3 font-semibold flex justify-between items-center bg-background/50 rounded-t-lg shrink-0">
                  <span className="text-sm uppercase tracking-wider">{column.title}</span>
                  <Badge variant="secondary">{columnLeads.length}</Badge>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {columnLeads.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                      Nenhum lead aqui
                    </div>
                  ) : (
                    columnLeads.map(lead => {
                      const daysOld = getDaysSinceUpdate(lead.updated_at || lead.created_at);
                      const isStale = (column.id !== 'FECHADO' && column.id !== 'PERDIDO') && daysOld > 3;

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={handleDragEnd}
                          className={`
                            kanban-card group
                            ${column.id === 'FECHADO' ? 'border-l-4 border-l-success' : ''}
                            ${column.id === 'PERDIDO' ? 'border-l-4 border-l-destructive opacity-75' : ''}
                            ${column.id !== 'FECHADO' && column.id !== 'PERDIDO' ? 'border-l-4 border-l-primary' : ''}
                          `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm truncate pr-2">{lead.name}</h4>
                            {isStale && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                {daysOld}d parado
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {lead.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> <span className="truncate">{lead.email}</span>
                            </div>
                          </div>

                          {lead.notes && (
                            <p className="text-xs text-foreground/80 bg-muted p-2 rounded line-clamp-2 mb-2">
                              {lead.notes}
                            </p>
                          )}

                          <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> 
                              {new Date(lead.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                            </div>
                            <span className="font-medium bg-background px-1.5 py-0.5 rounded border">
                              {lead.source}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}} />
    </>
  );
};

export default LeadsFunnelPage;
