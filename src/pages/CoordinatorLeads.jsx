import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Clock, Phone, Mail } from 'lucide-react';
import { NAV, BLUE, RED } from '@/lib/brand';

const COLUMNS = [
  { id: 'NOVO',        title: 'Novo',          color: `${NAV}60` },
  { id: 'CONTATO',     title: 'Contato Feito', color: BLUE },
  { id: 'QUALIFICADO', title: 'Qualificado',   color: '#8B5CF6' },
  { id: 'PROPOSTA',    title: 'Proposta',      color: '#F59E0B' },
  { id: 'FECHADO',     title: 'Fechado',       color: '#10B981' },
  { id: 'PERDIDO',     title: 'Perdido',       color: RED },
];

const CoordinatorLeads = () => {
  const { getCoordinatorLeads, updateLeadStatus } = useCoordinatorData();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getCoordinatorLeads().then(data => setLeads(data || []));
  }, []);

  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === statusId) return;

    const success = await updateLeadStatus(leadId, statusId);
    if (success) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: statusId, updated_at: new Date().toISOString() } : l));
      toast({ title: 'Status atualizado', description: `${lead.name} movido para ${statusId}` });
    }
  };

  const isUrgent = (updatedAt) => new Date(updatedAt) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const filtered = leads.filter(l =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Funil de Vendas — Novos Autores do Brasil</title></Helmet>

      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Funil de Vendas</h1>
            <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Arraste os cards para atualizar o status</p>
          </div>
          <div className="w-full md:w-64">
            <div className="relative">
              <Input
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white text-sm"
                style={{ borderColor: `${NAV}20`, color: NAV }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(col => {
              const colLeads = filtered.filter(l => l.status === col.id);
              return (
                <div
                  key={col.id}
                  className="w-72 flex flex-col rounded-2xl p-3"
                  style={{ background: `${col.color}08`, border: `1px solid ${col.color}20` }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, col.id)}
                >
                  <div className="flex justify-between items-center mb-3 px-1 shrink-0">
                    <span className="text-sm font-bold" style={{ color: col.color, fontFamily: 'Poppins, sans-serif' }}>{col.title}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${col.color}15`, color: col.color }}>
                      {colLeads.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
                    {colLeads.map(lead => {
                      const urgent = ['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA'].includes(lead.status) && isUrgent(lead.updated_at);
                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={e => e.dataTransfer.setData('leadId', lead.id)}
                          className="bg-white p-3 rounded-xl cursor-grab transition-shadow hover:shadow-md"
                          style={{
                            border: `1px solid ${urgent ? RED + '30' : NAV + '0C'}`,
                            boxShadow: `0 1px 3px ${NAV}06`,
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm truncate flex-1" style={{ color: NAV }}>{lead.name}</h4>
                            {urgent && <div className="h-2 w-2 rounded-full shrink-0 ml-2 mt-1" style={{ background: RED }} title="Parado há > 3 dias" />}
                          </div>
                          <div className="space-y-1 text-xs" style={{ color: `${NAV}55` }}>
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-2 flex justify-between items-center text-[10px]" style={{ borderTop: `1px solid ${NAV}08`, color: `${NAV}45` }}>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                            </div>
                            {lead.source && (
                              <span className="px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${BLUE}12`, color: BLUE }}>
                                {lead.source}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {colLeads.length === 0 && (
                      <div className="h-20 flex items-center justify-center text-xs rounded-xl border-2 border-dashed" style={{ color: `${NAV}30`, borderColor: `${col.color}20` }}>
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
