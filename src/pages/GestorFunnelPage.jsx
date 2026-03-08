import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Users } from 'lucide-react';

const COLUMNS = [
  { id: 'INDICADO', title: 'Indicado' },
  { id: 'EM_ATENDIMENTO', title: 'Em Atend.' },
  { id: 'EM_AVALIACAO', title: 'Em Avaliação' },
  { id: 'APROVADO', title: 'Aprovado' },
  { id: 'COAUTOR_ATIVO', title: 'Coautor Ativo' },
  { id: 'NAO_APROVADO', title: 'Não Aprovado' },
];

const GestorFunnelPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { coordinatorId } = useParams();
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState([]);
  const [leadsByCoord, setLeadsByCoord] = useState({});
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: coords } = await supabase.rpc('get_my_coordinators');
      setCoordinators(coords || []);

      if (!coords?.length) { setLoading(false); return; }

      const { data: leads } = await supabase.rpc('get_team_leads');

      const grouped = {};
      (leads || []).forEach(l => {
        if (!grouped[l.coordinator_id]) grouped[l.coordinator_id] = [];
        grouped[l.coordinator_id].push(l);
      });
      setLeadsByCoord(grouped);

      // Auto-selecionar coordenador se vier por URL
      if (coordinatorId) {
        const found = (coords || []).find(c => c.id === coordinatorId);
        if (found) setSelectedCoord(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, coordinatorId]);

  useEffect(() => { load(); }, [load]);

  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const coordId = selectedCoord?.id;
    const lead = (leadsByCoord[coordId] || []).find(l => l.id === leadId);
    if (!lead || lead.status === statusId) return;

    const { error } = await supabase
      .rpc('update_lead_status', { lead_id: leadId, new_status: statusId });

    if (!error) {
      setLeadsByCoord(prev => ({
        ...prev,
        [coordId]: prev[coordId].map(l => l.id === leadId ? { ...l, status: statusId } : l),
      }));
      toast({ title: 'Status atualizado' });
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" />
    </div>
  );

  // ── Vista Kanban do coordenador selecionado ──────────────────────────────────
  if (selectedCoord) {
    const leads = (leadsByCoord[selectedCoord.id] || []).filter(l =>
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <>
        <Helmet><title>Relatório de Time - NAB Platform</title></Helmet>
        <div className="space-y-5 flex flex-col h-[calc(100vh-6rem)]">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-slate-600 hover:text-slate-900"
                onClick={() => {
                  setSelectedCoord(null);
                  setSearchTerm('');
                  if (coordinatorId) navigate('/manager/coordinators');
                }}
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {selectedCoord.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 leading-tight">{selectedCoord.name}</h1>
                  <p className="text-xs text-slate-400">Funil de leads — arraste para mover</p>
                </div>
              </div>
            </div>
            <div className="relative w-full md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white border-slate-200"
              />
            </div>
          </div>

          {/* Kanban */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-4 min-w-max h-full">
              {COLUMNS.map(col => {
                const colLeads = leads.filter(l => l.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="w-56 flex flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, col.id)}
                  >
                    <div className="flex justify-between items-center mb-3 px-1 shrink-0">
                      <span className="text-sm font-bold text-slate-700">{col.title}</span>
                      <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-600">
                        {colLeads.length}
                      </Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
                      {colLeads.map(lead => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={e => e.dataTransfer.setData('leadId', lead.id)}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm cursor-grab hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <p className="text-sm font-semibold text-slate-800 truncate">{lead.name}</p>
                          {lead.phone && <p className="text-xs text-slate-400 mt-0.5">{lead.phone}</p>}
                        </div>
                      ))}
                      {colLeads.length === 0 && (
                        <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400">
                          Soltar aqui
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
  }

  // ── Lista de coordenadores ───────────────────────────────────────────────────
  const filteredCoords = coordinators.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Relatório de Time - NAB Platform</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Relatório de Time</h1>
            <p className="text-slate-500 mt-1">Selecione um coordenador para ver o funil de leads.</p>
          </div>
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar coordenador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
          </div>
        </div>

        {filteredCoords.length === 0 && (
          <div className="text-center py-20 text-slate-400">Nenhum coordenador encontrado.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoords.map(coord => {
            const leads = leadsByCoord[coord.id] || [];
            const total = leads.length;
            const byStatus = COLUMNS.map(col => ({
              ...col,
              count: leads.filter(l => l.status === col.id).length,
            }));

            return (
              <button
                key={coord.id}
                onClick={() => { setSelectedCoord(coord); setSearchTerm(''); }}
                className="text-left bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all p-5 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base group-hover:bg-blue-200 transition-colors">
                    {coord.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{coord.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {total} lead{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {byStatus.map(col => (
                    <div key={col.id} className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-base font-bold text-slate-700">{col.count}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{col.title}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default GestorFunnelPage;
