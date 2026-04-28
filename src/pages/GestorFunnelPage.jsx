import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Search, ArrowLeft, Users, Phone, Mail, FileText, UserCheck } from 'lucide-react';
import { NAV, BLUE, RED } from '@/lib/brand';

const COLUMNS = [
  { id: 'INDICADO',       title: 'Indicado',      color: `${NAV}85` },
  { id: 'EM_ATENDIMENTO', title: 'Em Atend.',      color: BLUE },
  { id: 'EM_AVALIACAO',   title: 'Em Avaliação',   color: '#F59E0B' },
  { id: 'APROVADO',       title: 'Aprovado',       color: '#10B981' },
  { id: 'COAUTOR_ATIVO',  title: 'Coautor Ativo',  color: '#8B5CF6' },
  { id: 'NAO_APROVADO',   title: 'Não Aprovado',   color: RED },
];

const GestorFunnelPage = () => {
  const { user, isLider } = useAuth();
  const { toast } = useToast();
  const { coordinatorId } = useParams();
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState([]);
  const [leadsByCoord, setLeadsByCoord] = useState({});
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal de relatório de atendimento
  const [selectedLead, setSelectedLead] = useState(null);
  const [reportText, setReportText] = useState('');
  const [savingReport, setSavingReport] = useState(false);

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
    // Bloquear se lead tem vendedor atribuído — só o vendedor pode mover
    if (lead.vendedor_id) return;

    const { error } = await supabase.rpc('update_lead_status', { lead_id: leadId, new_status: statusId });
    if (!error) {
      setLeadsByCoord(prev => ({
        ...prev,
        [coordId]: prev[coordId].map(l => l.id === leadId ? { ...l, status: statusId } : l),
      }));
      toast({ title: 'Status atualizado' });
    }
  };

  const openLeadReport = (lead) => {
    setSelectedLead(lead);
    setReportText(lead.notes || '');
  };

  const closeLeadReport = () => {
    setSelectedLead(null);
    setReportText('');
  };

  const handleSaveReport = async () => {
    if (!selectedLead) return;
    setSavingReport(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: reportText, updated_at: new Date().toISOString() })
        .eq('id', selectedLead.id);
      if (error) throw error;

      // Update local state
      const coordId = selectedCoord?.id;
      setLeadsByCoord(prev => ({
        ...prev,
        [coordId]: (prev[coordId] || []).map(l =>
          l.id === selectedLead.id ? { ...l, notes: reportText } : l
        ),
      }));
      toast({ title: 'Relatório salvo!' });
      closeLeadReport();
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar relatório.' });
    } finally {
      setSavingReport(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  // ── Kanban do coordenador selecionado ────────────────────────────────────────
  if (selectedCoord) {
    const leads = (leadsByCoord[selectedCoord.id] || []).filter(l =>
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <>
        <Helmet><title>Relatório de Time — Novos Autores do Brasil</title></Helmet>
        <div className="space-y-5 flex flex-col h-[calc(100vh-6rem)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: `${NAV}70`, background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${NAV}08`; e.currentTarget.style.color = NAV; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = `${NAV}70`; }}
                onClick={() => { setSelectedCoord(null); setSearchTerm(''); if (coordinatorId) navigate('/manager/coordinators'); }}
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <div className="w-px h-6" style={{ background: `${NAV}15` }} />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${BLUE}15`, color: BLUE }}>
                  {selectedCoord.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{selectedCoord.name}</h1>
                  <p className="text-xs" style={{ color: `${NAV}72` }}>Clique em um lead para adicionar relatório · Arraste para mover</p>
                </div>
              </div>
            </div>
            <div className="relative w-full md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}70` }} />
              <Input
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white text-sm"
                style={{ borderColor: `${NAV}20`, color: NAV }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-4 min-w-max h-full">
              {COLUMNS.map(col => {
                const colLeads = leads.filter(l => l.status === col.id);
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
                          draggable={!lead.vendedor_id}
                          onDragStart={!lead.vendedor_id ? e => e.dataTransfer.setData('leadId', lead.id) : undefined}
                          onClick={() => openLeadReport(lead)}
                          className="bg-white p-2.5 rounded-xl transition-shadow hover:shadow-md"
                          style={{
                            border: `1px solid ${lead.vendedor_id ? BLUE + '35' : NAV + '0C'}`,
                            boxShadow: `0 1px 3px ${NAV}06`,
                            cursor: lead.vendedor_id ? 'pointer' : 'grab',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = lead.vendedor_id ? `${BLUE}55` : `${BLUE}30`; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = lead.vendedor_id ? `${BLUE}35` : `${NAV}0C`; }}
                        >
                          <p className="text-sm font-semibold truncate" style={{ color: NAV }}>{lead.name}</p>
                          {lead.phone && <p className="text-xs mt-0.5" style={{ color: `${NAV}80` }}>{lead.phone}</p>}
                          {lead.vendedor_id && (
                            <div className="mt-1.5 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 shrink-0" style={{ color: BLUE }} />
                              <p className="text-[11px] truncate font-medium" style={{ color: BLUE }}>{lead.vendedor_name}</p>
                            </div>
                          )}
                          {lead.notes && (
                            <div className="mt-1 flex items-center gap-1">
                              <FileText className="w-3 h-3 shrink-0" style={{ color: `${NAV}70` }} />
                              <p className="text-[11px] truncate" style={{ color: `${NAV}75` }}>{lead.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      {colLeads.length === 0 && (
                        <div className="h-12 flex items-center justify-center text-xs rounded-xl border-2 border-dashed" style={{ color: `${NAV}55`, borderColor: `${col.color}20` }}>
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

        {/* Modal relatório de atendimento */}
        <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) closeLeadReport(); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                Relatório de Atendimento
              </DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-4 my-2">
                {/* Dados do lead */}
                <div className="rounded-xl p-4 space-y-2" style={{ background: `${NAV}04`, border: `1px solid ${NAV}0C` }}>
                  <p className="font-semibold text-sm" style={{ color: NAV }}>{selectedLead.name}</p>
                  {selectedLead.phone && (
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: NAV }}>
                      <Phone className="w-4 h-4 shrink-0" style={{ color: BLUE }} /> {selectedLead.phone}
                    </div>
                  )}
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: NAV }}>
                      <Mail className="w-4 h-4 shrink-0" style={{ color: BLUE }} /> {selectedLead.email}
                    </div>
                  )}
                  {selectedLead.vendedor_id && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: BLUE }}>
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">Vendedor: {selectedLead.vendedor_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${COLUMNS.find(c => c.id === selectedLead.status)?.color || NAV}15`,
                        color: COLUMNS.find(c => c.id === selectedLead.status)?.color || NAV,
                      }}>
                      {COLUMNS.find(c => c.id === selectedLead.status)?.title || selectedLead.status}
                    </span>
                  </div>
                </div>

                {/* Campo relatório */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: `${NAV}80` }}>
                    Relatório de atendimento
                  </label>
                  <Textarea
                    placeholder={isLider() ? 'Nenhum relatório registrado.' : 'Descreva o atendimento realizado, observações, próximos passos...'}
                    value={reportText}
                    onChange={isLider() ? undefined : e => setReportText(e.target.value)}
                    readOnly={isLider()}
                    className="resize-none h-32"
                    style={{
                      borderColor: `${NAV}20`,
                      color: NAV,
                      background: isLider() ? `${NAV}04` : 'white',
                      cursor: isLider() ? 'default' : 'text',
                    }}
                    onFocus={isLider() ? undefined : e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                    onBlur={isLider() ? undefined : e => { e.target.style.borderColor = `${NAV}20`; e.target.style.boxShadow = 'none'; }}
                  />
                  {isLider() && (
                    <p className="text-xs mt-1.5" style={{ color: `${NAV}70` }}>
                      Somente o vendedor atribuído pode editar o relatório.
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeLeadReport}>
                {isLider() ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isLider() && (
                <Button
                  onClick={handleSaveReport}
                  disabled={savingReport}
                  style={{ background: BLUE, color: 'white', border: 'none' }}
                >
                  {savingReport ? 'Salvando...' : 'Salvar Relatório'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── Lista de coordenadores ────────────────────────────────────────────────────
  const filteredCoords = coordinators.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Relatório de Time — Novos Autores do Brasil</title></Helmet>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Relatório de Time</h1>
            <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Selecione um coordenador para ver o funil de leads.</p>
          </div>
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}70` }} />
            <Input
              placeholder="Buscar coordenador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-white text-sm"
              style={{ borderColor: `${NAV}20`, color: NAV }}
            />
          </div>
        </div>

        {filteredCoords.length === 0 && (
          <div className="text-center py-20" style={{ color: `${NAV}65` }}>Nenhum coordenador encontrado.</div>
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
                className="text-left rounded-2xl p-5 transition-all"
                style={{ background: 'white', border: `1px solid ${NAV}0C`, boxShadow: `0 1px 4px ${NAV}08` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${BLUE}30`; e.currentTarget.style.boxShadow = `0 4px 16px ${BLUE}14`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${NAV}0C`; e.currentTarget.style.boxShadow = `0 1px 4px ${NAV}08`; }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold" style={{ background: `${BLUE}15`, color: BLUE }}>
                    {coord.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: NAV }}>{coord.name}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: `${NAV}72` }}>
                      <Users className="w-3 h-3" /> {total} lead{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {byStatus.map(col => (
                    <div key={col.id} className="rounded-xl px-2 py-1.5 text-center" style={{ background: `${col.color}08` }}>
                      <p className="text-base font-bold" style={{ color: col.color }}>{col.count}</p>
                      <p className="text-[10px] leading-tight" style={{ color: `${NAV}75` }}>{col.title}</p>
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
