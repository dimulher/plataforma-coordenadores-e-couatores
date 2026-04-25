import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Search, ArrowLeft, Users, Phone, Mail, FileText,
  UserCheck, UserPlus, Loader2, MessageCircle, Filter,
} from 'lucide-react';
import { NAV, BLUE, RED } from '@/lib/brand';

const COLUMNS = [
  { id: 'INDICADO',       title: 'Indicado',      color: `${NAV}60` },
  { id: 'EM_ATENDIMENTO', title: 'Em Atend.',      color: BLUE },
  { id: 'EM_AVALIACAO',   title: 'Em Avaliação',   color: '#F59E0B' },
  { id: 'APROVADO',       title: 'Aprovado',       color: '#10B981' },
  { id: 'COAUTOR_ATIVO',  title: 'Coautor Ativo',  color: '#8B5CF6' },
  { id: 'NAO_APROVADO',   title: 'Não Aprovado',   color: RED },
];

const VendedorLeadsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [leads, setLeads]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [filterMyLeads, setFilterMyLeads] = useState(false); // grid: só meus
  const [kanbanFilter, setKanbanFilter]   = useState('all'); // kanban: 'all' | 'mine'

  // Report modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [reportText, setReportText]     = useState('');
  const [savingReport, setSavingReport] = useState(false);
  const [claimingLead, setClaimingLead] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_leads_as_vendedor');
    if (!error) setLeads(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Group leads by coordinator ────────────────────────────
  const coordGroups = leads.reduce((acc, lead) => {
    const cid = lead.coordinator_id;
    if (!acc[cid]) acc[cid] = {
      coordinator_id: cid,
      coordinator_name: lead.coordinator_name || 'Sem Coordenador',
      lider_id: lead.lider_id,
      lider_name: lead.lider_name || 'Sem Líder',
      leads: [],
    };
    acc[cid].leads.push(lead);
    return acc;
  }, {});

  const coordList = Object.values(coordGroups).sort((a, b) =>
    a.coordinator_name.localeCompare(b.coordinator_name)
  );

  const filteredCoords = coordList.filter(c => {
    const matchSearch =
      c.coordinator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lider_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMine = !filterMyLeads || c.leads.some(l => l.vendedor_id === user.id);
    return matchSearch && matchMine;
  });

  // ── Drag & drop ───────────────────────────────────────────
  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === statusId) return;
    if (lead.vendedor_id && lead.vendedor_id !== user.id) return; // bloqueado

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: statusId } : l));
    const { error } = await supabase.rpc('update_lead_status', { lead_id: leadId, new_status: statusId });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao mover lead', description: error.message });
      fetchLeads();
    }
  };

  // ── Claim lead ────────────────────────────────────────────
  const handleClaim = async (lead, e) => {
    e.stopPropagation();
    setClaimingLead(lead.id);
    const { error } = await supabase.rpc('claim_lead_as_vendedor', { p_lead_id: lead.id });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atribuir lead', description: error.message });
    } else {
      setLeads(prev => prev.map(l =>
        l.id === lead.id ? { ...l, vendedor_id: user.id, vendedor_name: user.name } : l
      ));
      toast({ title: 'Lead atribuído a você!' });
    }
    setClaimingLead(null);
  };

  // ── Report modal ──────────────────────────────────────────
  const openLeadReport = (lead) => { setSelectedLead(lead); setReportText(lead.notes || ''); };
  const closeLeadReport = () => { setSelectedLead(null); setReportText(''); };

  const handleSaveReport = async () => {
    if (!selectedLead) return;
    setSavingReport(true);
    const { error } = await supabase
      .from('leads')
      .update({ notes: reportText, updated_at: new Date().toISOString() })
      .eq('id', selectedLead.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: reportText } : l));
      toast({ title: 'Relatório salvo!' });
      closeLeadReport();
    }
    setSavingReport(false);
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // KANBAN VIEW — coordenador selecionado
  // ════════════════════════════════════════════════════════════
  if (selectedCoord) {
    const group = coordGroups[selectedCoord.coordinator_id];
    const coordLeads = (group?.leads || []).filter(l => {
      const matchSearch =
        l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMine = kanbanFilter === 'all' || l.vendedor_id === user.id;
      return matchSearch && matchMine;
    });

    return (
      <>
        <Helmet><title>Meus Leads — Vendedor | Novos Autores do Brasil</title></Helmet>
        <div className="space-y-5 flex flex-col h-[calc(100vh-6rem)]">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: `${NAV}70` }}
                onMouseEnter={e => { e.currentTarget.style.background = `${NAV}08`; e.currentTarget.style.color = NAV; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = `${NAV}70`; }}
                onClick={() => { setSelectedCoord(null); setSearchTerm(''); }}
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <div className="w-px h-6" style={{ background: `${NAV}15` }} />
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: `${BLUE}15`, color: BLUE }}
                >
                  {selectedCoord.coordinator_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                    {selectedCoord.coordinator_name}
                  </h1>
                  <p className="text-xs" style={{ color: `${NAV}45` }}>
                    Líder: {selectedCoord.lider_name} · Atribua um lead para poder movê-lo
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro meus/todos */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${NAV}15` }}>
                {[
                  { key: 'all',  label: 'Todos' },
                  { key: 'mine', label: 'Meus leads' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setKanbanFilter(opt.key)}
                    className="px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={kanbanFilter === opt.key
                      ? { background: BLUE, color: '#fff' }
                      : { background: 'white', color: `${NAV}60` }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative w-44">
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
          </div>

          {/* Kanban columns */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-4 min-w-max h-full">
              {COLUMNS.map(col => {
                const colLeads = coordLeads.filter(l => l.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="w-56 flex flex-col rounded-2xl p-3"
                    style={{ background: `${col.color}08`, border: `1px solid ${col.color}20` }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, col.id)}
                  >
                    <div className="flex justify-between items-center mb-3 px-1 shrink-0">
                      <span className="text-sm font-bold" style={{ color: col.color, fontFamily: 'Poppins, sans-serif' }}>
                        {col.title}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${col.color}15`, color: col.color }}
                      >
                        {colLeads.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
                      {colLeads.map(lead => {
                        const isMyLead  = lead.vendedor_id === user.id;
                        const isClaimed = !!lead.vendedor_id;
                        const canDrag   = isMyLead;

                        return (
                          <div
                            key={lead.id}
                            draggable={canDrag}
                            onDragStart={canDrag ? e => e.dataTransfer.setData('leadId', lead.id) : undefined}
                            onClick={() => openLeadReport(lead)}
                            className="bg-white p-2.5 rounded-xl transition-shadow"
                            style={{
                              border: `1px solid ${isMyLead ? BLUE + '50' : NAV + '0C'}`,
                              boxShadow: `0 1px 3px ${NAV}06`,
                              cursor: canDrag ? 'grab' : 'pointer',
                              opacity: isClaimed && !isMyLead ? 0.7 : 1,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = isMyLead ? `${BLUE}70` : `${BLUE}30`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = isMyLead ? `${BLUE}50` : `${NAV}0C`; }}
                          >
                            <p className="text-sm font-semibold truncate" style={{ color: NAV }}>{lead.name}</p>
                            {lead.phone && (
                              <p className="text-xs mt-0.5" style={{ color: `${NAV}55` }}>{lead.phone}</p>
                            )}

                            {/* Vendedor badge / claim button */}
                            {isClaimed ? (
                              <div className="mt-1.5 flex items-center gap-1">
                                <UserCheck
                                  className="w-3 h-3 shrink-0"
                                  style={{ color: isMyLead ? BLUE : `${NAV}45` }}
                                />
                                <p
                                  className="text-[11px] truncate font-medium"
                                  style={{ color: isMyLead ? BLUE : `${NAV}45` }}
                                >
                                  {isMyLead ? 'Meu lead' : lead.vendedor_name}
                                </p>
                              </div>
                            ) : (
                              <button
                                onClick={e => handleClaim(lead, e)}
                                disabled={claimingLead === lead.id}
                                className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors"
                                style={{ background: `${BLUE}12`, color: BLUE }}
                                onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.background = `${BLUE}25`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}12`; }}
                              >
                                {claimingLead === lead.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <UserPlus className="w-3 h-3" />
                                }
                                Atribuir para mim
                              </button>
                            )}

                            {lead.notes && (
                              <div className="mt-1.5 flex items-center gap-1">
                                <FileText className="w-3 h-3 shrink-0" style={{ color: `${NAV}35` }} />
                                <p className="text-[11px] truncate" style={{ color: `${NAV}50` }}>{lead.notes}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {colLeads.length === 0 && (
                        <div
                          className="h-12 flex items-center justify-center text-xs rounded-xl border-2 border-dashed"
                          style={{ color: `${NAV}30`, borderColor: `${col.color}20` }}
                        >
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

        {/* Modal relatório */}
        <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) closeLeadReport(); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                Relatório de Atendimento
              </DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-4 my-2">
                <div className="rounded-xl p-4 space-y-2" style={{ background: `${NAV}04`, border: `1px solid ${NAV}0C` }}>
                  <p className="font-semibold text-sm" style={{ color: NAV }}>{selectedLead.name}</p>
                  {selectedLead.phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: NAV }}>
                        <Phone className="w-4 h-4 shrink-0" style={{ color: BLUE }} />
                        {selectedLead.phone}
                      </div>
                      <a
                        href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: '#25D36620', color: '#25D366' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#25D36635'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#25D36620'; }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  )}
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: NAV }}>
                      <Mail className="w-4 h-4 shrink-0" style={{ color: BLUE }} />
                      {selectedLead.email}
                    </div>
                  )}
                  {selectedLead.vendedor_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck className="w-4 h-4 shrink-0" style={{ color: BLUE }} />
                      <span className="font-semibold" style={{ color: BLUE }}>
                        {selectedLead.vendedor_id === user.id ? 'Seu lead' : `Atribuído a: ${selectedLead.vendedor_name}`}
                      </span>
                    </div>
                  )}
                  <span
                    className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${COLUMNS.find(c => c.id === selectedLead.status)?.color || NAV}15`,
                      color: COLUMNS.find(c => c.id === selectedLead.status)?.color || NAV,
                    }}
                  >
                    {COLUMNS.find(c => c.id === selectedLead.status)?.title || selectedLead.status}
                  </span>
                </div>

                <Textarea
                  placeholder="Descreva o atendimento, próximos passos..."
                  value={reportText}
                  onChange={e => setReportText(e.target.value)}
                  className="resize-none h-32"
                  style={{ borderColor: `${NAV}20`, color: NAV }}
                  readOnly={!!(selectedLead.vendedor_id && selectedLead.vendedor_id !== user.id)}
                />
                {selectedLead.vendedor_id && selectedLead.vendedor_id !== user.id && (
                  <p className="text-xs text-center" style={{ color: `${NAV}45` }}>
                    Somente visualização — lead atribuído a outro vendedor
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeLeadReport}>Fechar</Button>
              {(!selectedLead?.vendedor_id || selectedLead?.vendedor_id === user.id) && (
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

  // ════════════════════════════════════════════════════════════
  // GRID VIEW — lista de coordenadores
  // ════════════════════════════════════════════════════════════
  return (
    <>
      <Helmet><title>Meus Leads — Vendedor | Novos Autores do Brasil</title></Helmet>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Meus Leads</h1>
            <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>
              Selecione um coordenador para ver o funil de leads.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro meus/todos */}
            <button
              onClick={() => setFilterMyLeads(f => !f)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={filterMyLeads
                ? { background: BLUE, color: '#fff' }
                : { background: 'white', color: `${NAV}60`, border: `1px solid ${NAV}15` }
              }
            >
              <Filter className="w-3.5 h-3.5" />
              {filterMyLeads ? 'Meus leads' : 'Todos os leads'}
            </button>

            <div className="relative w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
              <Input
                placeholder="Buscar coordenador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white text-sm"
                style={{ borderColor: `${NAV}20`, color: NAV }}
              />
            </div>
          </div>
        </div>

        {filteredCoords.length === 0 && (
          <div className="text-center py-20" style={{ color: `${NAV}35` }}>
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum lead atribuído ainda.</p>
            <p className="text-sm mt-1 opacity-70">Aguarde seu gestor vincular líderes à sua conta.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoords.map(group => {
            const total   = group.leads.length;
            const myLeads = group.leads.filter(l => l.vendedor_id === user.id).length;
            const byStatus = COLUMNS.map(col => ({
              ...col,
              count: group.leads.filter(l => l.status === col.id).length,
            }));

            return (
              <button
                key={group.coordinator_id}
                onClick={() => { setSelectedCoord(group); setSearchTerm(''); }}
                className="text-left rounded-2xl p-5 transition-all"
                style={{ background: 'white', border: `1px solid ${NAV}0C`, boxShadow: `0 1px 4px ${NAV}08` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${BLUE}30`; e.currentTarget.style.boxShadow = `0 4px 16px ${BLUE}14`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${NAV}0C`; e.currentTarget.style.boxShadow = `0 1px 4px ${NAV}08`; }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                    style={{ background: `${BLUE}15`, color: BLUE }}
                  >
                    {group.coordinator_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                      {group.coordinator_name}
                    </p>
                    <p className="text-xs flex items-center gap-1.5" style={{ color: `${NAV}45` }}>
                      <Users className="w-3 h-3" />
                      {total} lead{total !== 1 ? 's' : ''}
                      {myLeads > 0 && (
                        <span
                          className="font-bold px-1.5 py-0.5 rounded-md text-[10px]"
                          style={{ background: `${BLUE}15`, color: BLUE }}
                        >
                          {myLeads} seus
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: `${NAV}35` }}>
                      Líder: {group.lider_name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {byStatus.map(col => (
                    <div
                      key={col.id}
                      className="rounded-xl px-2 py-1.5 text-center"
                      style={{ background: `${col.color}08` }}
                    >
                      <p className="text-base font-bold" style={{ color: col.color }}>{col.count}</p>
                      <p className="text-[10px] leading-tight" style={{ color: `${NAV}50` }}>{col.title}</p>
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

export default VendedorLeadsPage;
