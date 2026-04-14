import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft } from 'lucide-react';
import { NAV, BLUE, RED } from '@/lib/brand';

const COLUMNS = [
  { id: 'INDICADO',       title: 'Indicado',      color: `${NAV}60` },
  { id: 'EM_ATENDIMENTO', title: 'Em Atend.',      color: BLUE },
  { id: 'EM_AVALIACAO',   title: 'Em Avaliação',   color: '#F59E0B' },
  { id: 'APROVADO',       title: 'Aprovado',       color: '#10B981' },
  { id: 'COAUTOR_ATIVO',  title: 'Coautor Ativo',  color: '#8B5CF6' },
  { id: 'NAO_APROVADO',   title: 'Não Aprovado',   color: RED },
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
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  if (!coordinator) return (
    <div className="flex h-64 items-center justify-center" style={{ color: `${NAV}40` }}>Coordenador não encontrado.</div>
  );

  const filtered = leads.filter(l =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>{coordinator.name} — Novos Autores do Brasil</title></Helmet>
      <div className="space-y-5 flex flex-col h-[calc(100vh-6rem)]">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: `${NAV}70` }}
              onMouseEnter={e => { e.currentTarget.style.background = `${NAV}08`; e.currentTarget.style.color = NAV; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = `${NAV}70`; }}
              onClick={() => navigate('/app/admin/coordinators')}
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="w-px h-6" style={{ background: `${NAV}15` }} />
            <div className="flex items-center gap-2">
              {coordinator.avatar_url
                ? <img src={coordinator.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                : <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${BLUE}15`, color: BLUE }}>
                    {coordinator.name.charAt(0).toUpperCase()}
                  </div>
              }
              <div>
                <h1 className="text-xl font-bold leading-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{coordinator.name}</h1>
                <p className="text-xs" style={{ color: `${NAV}45` }}>{coordinator.email} · Funil de leads — arraste para mover</p>
              </div>
            </div>
          </div>
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
            <Input
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-white text-sm"
              style={{ borderColor: `${NAV}20`, color: NAV }}
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
                  className="w-56 flex flex-col rounded-2xl p-3"
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
                    {colLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('leadId', lead.id)}
                        className="bg-white p-2.5 rounded-xl cursor-grab transition-shadow hover:shadow-md"
                        style={{ border: `1px solid ${NAV}0C`, boxShadow: `0 1px 3px ${NAV}06` }}
                      >
                        <p className="text-sm font-semibold truncate" style={{ color: NAV }}>{lead.name}</p>
                        {lead.phone && <p className="text-xs mt-0.5" style={{ color: `${NAV}55` }}>{lead.phone}</p>}
                        {lead.email && <p className="text-xs truncate" style={{ color: `${NAV}35` }}>{lead.email}</p>}
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <div className="h-12 flex items-center justify-center text-xs rounded-xl border-2 border-dashed" style={{ color: `${NAV}30`, borderColor: `${col.color}20` }}>
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
