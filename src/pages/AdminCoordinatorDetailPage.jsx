import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft } from 'lucide-react';

const COLUMNS = [
  { id: 'INDICADO', title: 'Indicado' },
  { id: 'EM_ATENDIMENTO', title: 'Em Atend.' },
  { id: 'EM_AVALIACAO', title: 'Em Avaliação' },
  { id: 'APROVADO', title: 'Aprovado' },
  { id: 'COAUTOR_ATIVO', title: 'Coautor Ativo' },
  { id: 'NAO_APROVADO', title: 'Não Aprovado' },
];

const AdminCoordinatorDetailPage = () => {
  const { coordinatorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coordinator, setCoordinator] = useState(null);
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!coordinatorId) return;
    setLoading(true);
    try {
      const [{ data: coord }, { data: leadsData }] = await Promise.all([
        supabase.from('profiles').select('id, name, email, avatar_url').eq('id', coordinatorId).single(),
        supabase.from('leads').select('*').eq('coordinator_id', coordinatorId).order('created_at', { ascending: false }),
      ]);
      setCoordinator(coord || null);
      setLeads(leadsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [coordinatorId]);

  useEffect(() => { load(); }, [load]);

  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === statusId) return;

    const { error } = await supabase
      .from('leads')
      .update({ status: statusId, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (!error) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: statusId } : l));
      toast({ title: 'Status atualizado' });
    } else {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" />
    </div>
  );

  if (!coordinator) return (
    <div className="flex h-64 items-center justify-center text-slate-400">Coordenador não encontrado.</div>
  );

  const filtered = leads.filter(l =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>{coordinator.name} - NAB Admin</title></Helmet>
      <div className="space-y-5 flex flex-col h-[calc(100vh-6rem)]">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-600 hover:text-slate-900"
              onClick={() => navigate('/app/admin/coordinators')}
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-2">
              {coordinator.avatar_url
                ? <img src={coordinator.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {coordinator.name.charAt(0).toUpperCase()}
                  </div>
              }
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">{coordinator.name}</h1>
                <p className="text-xs text-slate-400">{coordinator.email} · Funil de leads — arraste para mover</p>
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
              const colLeads = filtered.filter(l => l.status === col.id);
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
                        {lead.email && <p className="text-xs text-slate-300 truncate">{lead.email}</p>}
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
};

export default AdminCoordinatorDetailPage;
