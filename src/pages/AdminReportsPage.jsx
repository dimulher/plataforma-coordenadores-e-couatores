import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, BarChart3, Users, ShoppingCart, Search,
  TrendingUp, ArrowUpDown, ChevronDown, ChevronRight, X, Phone, Mail, FileText, CheckCircle2, Clock,
} from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader } from '@/lib/brand';

const GREEN  = '#10B981';
const AMBER  = '#F59E0B';
const PURPLE = '#8B5CF6';
const ORANGE = '#F97316';

/* ── Status do funil ─────────────────────────────────────── */
const STATUS_META = {
  INDICADO:            { label: 'Indicado',           color: '#64748B' },
  CADASTRO_COMPLETO:   { label: 'Cadastro Completo',  color: BLUE      },
  EM_ATENDIMENTO:      { label: 'Em Atendimento',     color: AMBER     },
  EM_AVALIACAO:        { label: 'Em Avaliação',       color: PURPLE    },
  APROVADO:            { label: 'Aprovado',            color: GREEN     },
  CONTRATO_ONBOARDING: { label: 'Onboarding',         color: '#06B6D4' },
  COAUTOR_ATIVO:       { label: 'Coautor Ativo',      color: '#059669' },
  NAO_APROVADO:        { label: 'Não Aprovado',       color: RED       },
};

/* ── Período ─────────────────────────────────────────────── */
const PERIODS = [
  { label: 'Hoje',    days: 0    },
  { label: '7 dias',  days: 7    },
  { label: '30 dias', days: 30   },
  { label: '90 dias', days: 90   },
  { label: 'Tudo',    days: null },
];

const toDateStr = (d) => d.toISOString().slice(0, 10);

function getPeriodDates(days) {
  if (days === null) return { p_start: null, p_end: null };
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - (days === 0 ? 0 : days - 1));
  start.setHours(0, 0, 0, 0);
  return { p_start: start.toISOString(), p_end: end.toISOString() };
}

function getCustomDates(from, to) {
  const p_start = from ? new Date(from + 'T00:00:00').toISOString() : null;
  const p_end   = to   ? new Date(to   + 'T23:59:59').toISOString() : null;
  return { p_start, p_end };
}

/* ── Helpers UI ──────────────────────────────────────────── */
const pct = (num, denom) => denom > 0 ? Math.round((Number(num) / Number(denom)) * 100) : 0;

const ConvBar = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${NAV}12`, minWidth: 40 }}>
      <div className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(value, 100)}%`, background: value >= 20 ? GREEN : value >= 10 ? AMBER : RED }} />
    </div>
    <span className="text-xs font-bold tabular-nums w-8 text-right"
      style={{ color: value >= 20 ? GREEN : value >= 10 ? AMBER : RED }}>
      {value}%
    </span>
  </div>
);

const Num = ({ n, color }) => (
  <span className="font-semibold tabular-nums text-sm" style={{ color: color || NAV }}>
    {Number(n || 0).toLocaleString('pt-BR')}
  </span>
);

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || { label: status, color: '#64748B' };
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ background: `${m.color}18`, color: m.color }}>
      {m.label}
    </span>
  );
};

const KpiCard = ({ label, value, icon: Icon, color }) => (
  <div className="rounded-2xl p-4 bg-white flex items-center gap-3"
    style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}>
    <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: `${color}18` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </span>
    <div>
      <p className="text-xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: `${NAV}75` }}>{label}</p>
    </div>
  </div>
);

const SortTh = ({ label, field, sortField, sortDir, onSort, className = '' }) => (
  <th className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:opacity-80 ${className}`}
    style={{ color: `${NAV}85` }} onClick={() => onSort(field)}>
    <div className="flex items-center gap-1">
      {label}
      <ArrowUpDown className="w-3 h-3 opacity-40" style={{ color: sortField === field ? BLUE : undefined }} />
    </div>
  </th>
);

const inputBase = {
  border: `1.5px solid ${NAV}15`, color: NAV, background: '#fff',
  outline: 'none', borderRadius: '0.75rem',
};

/* ══════════════════════════════════════════════════════════
   MODAL DE LEADS
══════════════════════════════════════════════════════════ */
const LeadsModal = ({ data, onClose }) => {
  if (!data) return null;
  const { vendedorName, coordName, leads, loading } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,27,54,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        style={{ border: `1px solid ${NAV}12` }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 shrink-0"
          style={{ borderBottom: `1px solid ${NAV}0E` }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: ORANGE }}>
              Vendedor: {vendedorName}
            </p>
            <h3 className="text-lg font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              {coordName}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: `${NAV}75` }}>
              {loading ? '...' : `${leads.length} lead(s) atribuído(s)`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: `${NAV}70` }}
            onMouseEnter={e => { e.currentTarget.style.background = `${RED}10`; e.currentTarget.style.color = RED; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = `${NAV}70`; }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: BLUE }} />
            </div>
          ) : leads.length === 0 ? (
            <p className="text-center py-12 text-sm" style={{ color: `${NAV}70` }}>Nenhum lead encontrado.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: `${NAV}08` }}>
              {leads.map(l => (
                <div key={l.lead_id} className="px-5 py-3.5 flex items-center gap-4"
                  style={{ transition: 'background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${NAV}03`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${ORANGE}15`, color: ORANGE }}>
                    {(l.lead_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: NAV }}>{l.lead_name}</p>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {l.lead_phone && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: `${NAV}85` }}>
                          <Phone className="w-3 h-3" /> {l.lead_phone}
                        </span>
                      )}
                      {l.lead_email && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: `${NAV}85` }}>
                          <Mail className="w-3 h-3" /> {l.lead_email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <StatusBadge status={l.status} />
                    <span className="text-[10px]" style={{ color: `${NAV}65` }}>
                      {new Date(l.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
const AdminReportsPage = () => {
  const { toast } = useToast();
  const [tab, setTab]     = useState('coord');
  const [period, setPeriod]     = useState(4);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');
  const [activeRange, setActiveRange] = useState({ period: 4, from: '', to: '' });
  const [search, setSearch]         = useState('');
  const [liderFilter, setLiderFilter] = useState('');
  const [sortField, setSortField] = useState('total_leads');
  const [sortDir, setSortDir]     = useState('desc');
  const [loading, setLoading]     = useState(true);

  const [coordData,    setCoordData]    = useState([]);
  const [vendedorData, setVendedorData] = useState([]);
  const [contractData,    setContractData]    = useState([]);
  const [contractFilter,  setContractFilter]  = useState('all');
  const [contractLoading, setContractLoading] = useState(false);

  // Vendedor drill-down
  const [expandedVendId, setExpandedVendId] = useState(null);
  const [vendCoords,     setVendCoords]     = useState([]);
  const [loadingCoords,  setLoadingCoords]  = useState(false);

  // Leads modal
  const [modal, setModal] = useState(null); // { vendedorName, coordName, leads, loading }

  /* ── Fetch principal ── */
  const fetchAll = useCallback(async ({ period: p, from, to }) => {
    setLoading(true);
    const params = p === -1 ? getCustomDates(from, to) : getPeriodDates(PERIODS[p].days);

    const [{ data: coord, error: e1 }, { data: vendedor, error: e2 }] = await Promise.all([
      supabase.rpc('get_report_coordinator_performance', params),
      supabase.rpc('get_report_vendedor_performance',    params),
    ]);

    if (e1 || e2) toast({ variant: 'destructive', title: 'Erro ao carregar relatórios',
      description: (e1 || e2).message });

    setCoordData(coord    || []);
    setVendedorData(vendedor || []);
    setLoading(false);
  }, [toast]);

  const fetchContracts = useCallback(async () => {
    setContractLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, role, contract_status, contract_signed_at, contract_url, created_at')
      .in('contract_status', ['ENVIADO', 'ASSINADO'])
      .in('role', ['COORDENADOR', 'COAUTOR'])
      .order('created_at', { ascending: false });
    if (error) toast({ variant: 'destructive', title: 'Erro ao carregar contratos', description: error.message });
    setContractData(data || []);
    setContractLoading(false);
  }, [toast]);

  useEffect(() => { fetchAll(activeRange); }, [activeRange, fetchAll]);
  useEffect(() => { if (tab === 'contratos') fetchContracts(); }, [tab, fetchContracts]);
  useEffect(() => { setSortField('total_leads'); setSortDir('desc'); setSearch(''); }, [tab]);

  /* ── Período ── */
  const selectPeriod = (i) => { setPeriod(i); setActiveRange({ period: i, from: '', to: '' }); };

  const applyCustomRange = () => {
    if (!customFrom && !customTo) return;
    setPeriod(-1);
    setActiveRange({ period: -1, from: customFrom, to: customTo });
  };

  /* ── Sort ── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };
  const sortProps = { sortField, sortDir, onSort: handleSort };

  /* ── Drill-down vendedor ── */
  const handleExpandVend = async (v) => {
    if (expandedVendId === v.vendedor_id) { setExpandedVendId(null); return; }
    setExpandedVendId(v.vendedor_id);
    setVendCoords([]);
    setLoadingCoords(true);
    const { data } = await supabase.rpc('get_vendedor_coordinator_report', { p_vendedor_id: v.vendedor_id });
    setVendCoords(data || []);
    setLoadingCoords(false);
  };

  const handleViewLeads = async (vendedor, coord) => {
    setModal({ vendedorName: vendedor.vendedor_name, coordName: coord.coordinator_name, leads: [], loading: true });
    const { data } = await supabase.rpc('get_vendedor_coordinator_leads', {
      p_vendedor_id: vendedor.vendedor_id, p_coordinator_id: coord.coordinator_id,
    });
    setModal(prev => prev ? { ...prev, leads: data || [], loading: false } : null);
  };

  /* ── KPIs ── */
  const kpis = useMemo(() => ({
    totalLeads: coordData.reduce((s, r) => s + Number(r.total_leads), 0),
    emAtend:    coordData.reduce((s, r) => s + Number(r.em_atendimento), 0),
    aprovados:  coordData.reduce((s, r) => s + Number(r.aprovados), 0),
    coautores:  coordData.reduce((s, r) => s + Number(r.coautores_ativos), 0),
  }), [coordData]);

  /* ── Filtro coordenadores ── */
  const q = search.toLowerCase();
  const filteredCoord = useMemo(() => {
    let data = coordData.filter(r =>
      (!q || [r.coordinator_name, r.lider_name].some(v => (v || '').toLowerCase().includes(q))) &&
      (!liderFilter || r.lider_id === liderFilter)
    );
    return [...data].sort((a, b) => {
      const va = Number(a[sortField] ?? 0), vb = Number(b[sortField] ?? 0);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [coordData, q, liderFilter, sortField, sortDir]);

  // Grupos por líder
  const liderGroups = useMemo(() => {
    const map = {};
    filteredCoord.forEach(r => {
      const key = r.lider_id || '__sem';
      if (!map[key]) map[key] = { id: key, name: r.lider_name || 'Sem Líder', items: [] };
      map[key].items.push(r);
    });
    return Object.values(map).sort((a, b) =>
      b.items.reduce((s, r) => s + Number(r.total_leads), 0) -
      a.items.reduce((s, r) => s + Number(r.total_leads), 0)
    );
  }, [filteredCoord]);

  // Pills de líderes
  const liderPills = useMemo(() => {
    const map = new Map();
    coordData.forEach(r => { if (r.lider_id) map.set(r.lider_id, r.lider_name); });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [coordData]);

  /* ── Filtro vendedores ── */
  const filteredVend = useMemo(() => {
    let data = vendedorData.filter(r =>
      !q || (r.vendedor_name || '').toLowerCase().includes(q)
    );
    return [...data].sort((a, b) => {
      const va = Number(a[sortField] ?? 0), vb = Number(b[sortField] ?? 0);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [vendedorData, q, sortField, sortDir]);

  const tdBase = 'px-3 py-3 text-sm';
  const thStyle = { color: `${NAV}85` };
  const rowHover = {
    onMouseEnter: e => { e.currentTarget.style.background = `${NAV}04`; },
    onMouseLeave: e => { e.currentTarget.style.background = 'transparent'; },
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Relatórios — Admin | Novos Autores do Brasil</title></Helmet>

      <LeadsModal data={modal} onClose={() => setModal(null)} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
          Relatórios de Performance
        </h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>
          Métricas de captação e conversão por Coordenador e Vendedor.
        </p>
      </div>

      {/* Período + De/Até */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `${NAV}75` }}>Período:</span>
        {PERIODS.map((p, i) => (
          <button key={p.label} onClick={() => selectPeriod(i)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={period === i
              ? { background: NAV, color: '#fff', boxShadow: `0 2px 8px ${NAV}30` }
              : { background: `${NAV}0A`, color: `${NAV}70`, border: `1px solid ${NAV}15` }
            }>
            {p.label}
          </button>
        ))}

        <span className="h-5 w-px" style={{ background: `${NAV}18` }} />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `${NAV}75` }}>De:</span>
          <input type="date" value={customFrom} max={customTo || toDateStr(new Date())}
            onChange={e => setCustomFrom(e.target.value)}
            className="px-2.5 py-1.5 text-xs"
            style={{ ...inputBase, borderColor: period === -1 ? BLUE : `${NAV}18` }}
            onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
            onBlur={e  => { e.target.style.borderColor = period === -1 ? BLUE : `${NAV}18`; e.target.style.boxShadow = 'none'; }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `${NAV}75` }}>Até:</span>
          <input type="date" value={customTo} min={customFrom || undefined} max={toDateStr(new Date())}
            onChange={e => setCustomTo(e.target.value)}
            className="px-2.5 py-1.5 text-xs"
            style={{ ...inputBase, borderColor: period === -1 ? BLUE : `${NAV}18` }}
            onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
            onBlur={e  => { e.target.style.borderColor = period === -1 ? BLUE : `${NAV}18`; e.target.style.boxShadow = 'none'; }} />
          <button onClick={applyCustomRange} disabled={!customFrom && !customTo}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
            style={period === -1
              ? { background: BLUE, color: '#fff', boxShadow: `0 2px 8px ${BLUE}40` }
              : { background: `${BLUE}15`, color: BLUE, border: `1px solid ${BLUE}30` }
            }>
            Aplicar
          </button>
          {period === -1 && (
            <button onClick={() => { setCustomFrom(''); setCustomTo(''); selectPeriod(4); }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium"
              style={{ color: `${NAV}75`, border: `1px solid ${NAV}15` }}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total de Leads"   value={kpis.totalLeads.toLocaleString('pt-BR')} icon={TrendingUp}  color={BLUE}   />
            <KpiCard label="Em Atendimento"    value={kpis.emAtend.toLocaleString('pt-BR')}    icon={Users}       color={AMBER}  />
            <KpiCard label="Aprovados"         value={kpis.aprovados.toLocaleString('pt-BR')}  icon={BarChart3}   color={GREEN}  />
            <KpiCard label="Coautores Ativos"  value={kpis.coautores.toLocaleString('pt-BR')}  icon={ShoppingCart} color={PURPLE} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: `${NAV}08` }}>
            {[
              { id: 'coord',     label: 'Coordenadores', icon: Users,        color: BLUE   },
              { id: 'vendedor',  label: 'Vendedores',     icon: ShoppingCart, color: ORANGE },
              { id: 'contratos', label: 'Contratos',      icon: FileText,     color: GREEN  },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={tab === t.id
                    ? { background: '#fff', color: t.color, boxShadow: `0 1px 6px ${NAV}12` }
                    : { color: `${NAV}75` }
                  }>
                  <Icon className="w-4 h-4" />{t.label}
                </button>
              );
            })}
          </div>

          {/* Busca */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${NAV}70` }} />
              <input type="text" placeholder="Buscar..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm"
                style={{ ...inputBase, width: 220 }}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                onBlur={e  => { e.target.style.borderColor = `${NAV}15`; e.target.style.boxShadow = 'none'; }} />
            </div>
          </div>

          {/* ══ TAB: COORDENADORES ══ */}
          {tab === 'coord' && (
            <div className="space-y-4">
              {/* Pills de Líder */}
              {liderPills.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `${NAV}75` }}>Líder:</span>
                  <button
                    onClick={() => setLiderFilter('')}
                    className="px-3 py-1 rounded-xl text-xs font-semibold transition-all"
                    style={!liderFilter
                      ? { background: NAV, color: '#fff' }
                      : { background: `${NAV}0A`, color: `${NAV}85`, border: `1px solid ${NAV}15` }
                    }>
                    Todos
                  </button>
                  {liderPills.map(l => (
                    <button key={l.id} onClick={() => setLiderFilter(l.id === liderFilter ? '' : l.id)}
                      className="px-3 py-1 rounded-xl text-xs font-semibold transition-all"
                      style={liderFilter === l.id
                        ? { background: AMBER, color: '#fff', boxShadow: `0 2px 8px ${AMBER}40` }
                        : { background: `${AMBER}12`, color: AMBER, border: `1px solid ${AMBER}30` }
                      }>
                      {l.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Grupos por Líder */}
              {liderGroups.length === 0 ? (
                <BrandCard>
                  <p className="text-center py-12 text-sm" style={{ color: `${NAV}70` }}>Nenhum coordenador encontrado.</p>
                </BrandCard>
              ) : liderGroups.map(group => {
                const groupTotal   = group.items.reduce((s, r) => s + Number(r.total_leads), 0);
                const groupAtend   = group.items.reduce((s, r) => s + Number(r.em_atendimento), 0);
                const groupAprov   = group.items.reduce((s, r) => s + Number(r.aprovados), 0);
                const groupCoaut   = group.items.reduce((s, r) => s + Number(r.coautores_ativos), 0);
                return (
                  <BrandCard key={group.id}>
                    {/* Cabeçalho do grupo */}
                    <div className="px-5 py-3.5 flex flex-wrap items-center gap-4"
                      style={{ borderBottom: `1px solid ${NAV}0E` }}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: `${AMBER}18`, color: AMBER }}>
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                          {group.name}
                        </span>
                        <span className="text-xs ml-1" style={{ color: `${NAV}72` }}>
                          — {group.items.length} coordenador(es)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs" style={{ color: `${NAV}85` }}>
                        <span><b style={{ color: NAV }}>{groupTotal}</b> leads</span>
                        <span><b style={{ color: AMBER }}>{groupAtend}</b> em atend.</span>
                        <span><b style={{ color: GREEN }}>{groupAprov}</b> aprovados</span>
                        <span><b style={{ color: PURPLE }}>{groupCoaut}</b> coautores</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${NAV}08` }}>
                            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={thStyle}>Coordenador</th>
                            <SortTh label="Leads"         field="total_leads"      {...sortProps} />
                            <SortTh label="Em Atend."     field="em_atendimento"   {...sortProps} />
                            <SortTh label="Aprovados"     field="aprovados"        {...sortProps} />
                            <SortTh label="Coaut. Ativos" field="coautores_ativos" {...sortProps} />
                            <SortTh label="Não Aprov."    field="nao_aprovados"    {...sortProps} />
                            <SortTh label="Conversão"     field="coautores_ativos" {...sortProps} className="w-36" />
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map(r => {
                            const conv = pct(r.coautores_ativos, r.total_leads);
                            return (
                              <tr key={r.coordinator_id} className="transition-colors"
                                style={{ borderBottom: `1px solid ${NAV}06` }} {...rowHover}>
                                <td className={tdBase}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                      style={{ background: `${BLUE}18`, color: BLUE }}>
                                      {(r.coordinator_name || 'C').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-sm" style={{ color: NAV }}>{r.coordinator_name}</span>
                                  </div>
                                </td>
                                <td className={tdBase}><Num n={r.total_leads} /></td>
                                <td className={tdBase}><Num n={r.em_atendimento} color={AMBER} /></td>
                                <td className={tdBase}><Num n={r.aprovados} color={GREEN} /></td>
                                <td className={tdBase}><Num n={r.coautores_ativos} color={PURPLE} /></td>
                                <td className={tdBase}><Num n={r.nao_aprovados} color={Number(r.nao_aprovados) > 0 ? RED : `${NAV}55`} /></td>
                                <td className={`${tdBase} w-36`}><ConvBar value={conv} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </BrandCard>
                );
              })}
            </div>
          )}

          {/* ══ TAB: CONTRATOS ══ */}
          {tab === 'contratos' && (() => {
            const q2 = search.toLowerCase();
            const filtered = contractData.filter(c =>
              (contractFilter === 'all' || c.contract_status === contractFilter) &&
              (!q2 || [c.name, c.email, c.role].some(v => (v || '').toLowerCase().includes(q2)))
            );
            const totalEnviado  = contractData.filter(c => c.contract_status === 'ENVIADO').length;
            const totalAssinado = contractData.filter(c => c.contract_status === 'ASSINADO').length;
            const ROLE_LABEL = { COORDENADOR: 'Coordenador', COAUTOR: 'Coautor', LIDER: 'Líder', GESTOR: 'Gestor', CS: 'CS', VENDEDOR: 'Vendedor', ADMIN: 'Admin' };

            return (
              <div className="space-y-4">
                {/* KPIs de contratos */}
                <div className="grid grid-cols-3 gap-4">
                  <KpiCard label="Total Contratos" value={contractData.length} icon={FileText}     color={BLUE}  />
                  <KpiCard label="Pendentes"        value={totalEnviado}        icon={Clock}        color={AMBER} />
                  <KpiCard label="Assinados"        value={totalAssinado}       icon={CheckCircle2} color={GREEN} />
                </div>

                {/* Filtro de status */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `${NAV}75` }}>Status:</span>
                  {[
                    { value: 'all',     label: 'Todos',             color: NAV   },
                    { value: 'ENVIADO', label: 'Enviado (Pendente)', color: AMBER },
                    { value: 'ASSINADO',label: 'Assinado',           color: GREEN },
                  ].map(f => (
                    <button key={f.value} onClick={() => setContractFilter(f.value)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={contractFilter === f.value
                        ? { background: f.color, color: '#fff', boxShadow: `0 2px 8px ${f.color}40` }
                        : { background: `${f.color}12`, color: f.color, border: `1px solid ${f.color}30` }
                      }>
                      {f.label}
                    </button>
                  ))}
                </div>

                <BrandCard>
                  <BrandCardHeader icon={FileText} iconColor={GREEN} accentColor={GREEN}
                    title={`Contratos — ${filtered.length} encontrado(s)`} />
                  {contractLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: GREEN }} />
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="text-center py-12 text-sm" style={{ color: `${NAV}70` }}>Nenhum contrato encontrado.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr style={{ borderBottom: `1.5px solid ${NAV}0E` }}>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${NAV}85` }}>Nome</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${NAV}85` }}>Role</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${NAV}85` }}>Contato</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${NAV}85` }}>Status</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${NAV}85` }}>Data</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${NAV}85` }}>Contrato</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(c => {
                            const isAssinado = c.contract_status === 'ASSINADO';
                            const dateVal = isAssinado ? c.contract_signed_at : c.created_at;
                            return (
                              <tr key={c.id} className="transition-colors"
                                style={{ borderBottom: `1px solid ${NAV}06` }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${NAV}04`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                      style={{ background: `${isAssinado ? GREEN : AMBER}18`, color: isAssinado ? GREEN : AMBER }}>
                                      {(c.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-sm" style={{ color: NAV }}>{c.name || '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: `${BLUE}12`, color: BLUE }}>
                                    {ROLE_LABEL[c.role] || c.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-0.5 text-xs" style={{ color: `${NAV}85` }}>
                                    {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                                    {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={isAssinado
                                      ? { background: `${GREEN}15`, color: GREEN }
                                      : { background: `${AMBER}15`, color: AMBER }}>
                                    {isAssinado
                                      ? <><CheckCircle2 className="w-3 h-3" /> Assinado</>
                                      : <><Clock className="w-3 h-3" /> Pendente</>}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: `${NAV}80` }}>
                                  {dateVal ? new Date(dateVal).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  {isAssinado && c.contract_url ? (
                                    <a href={c.contract_url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                                      style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}30` }}
                                      onMouseEnter={e => { e.currentTarget.style.background = GREEN; e.currentTarget.style.color = '#fff'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = `${GREEN}15`; e.currentTarget.style.color = GREEN; }}>
                                      <FileText className="w-3.5 h-3.5" /> Visualizar
                                    </a>
                                  ) : (
                                    <span className="text-xs" style={{ color: `${NAV}72` }}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </BrandCard>
              </div>
            );
          })()}

          {/* ══ TAB: VENDEDORES ══ */}
          {tab === 'vendedor' && (
            <BrandCard>
              <BrandCardHeader icon={ShoppingCart} iconColor={ORANGE} accentColor={ORANGE}
                title={`Vendedores — ${filteredVend.length} encontrado(s)`} />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ borderBottom: `1.5px solid ${NAV}0E` }}>
                      <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider w-8" style={thStyle} />
                      <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={thStyle}>Vendedor</th>
                      <SortTh label="Leads Atrib." field="leads_atribuidos" {...sortProps} />
                      <SortTh label="Em Atend."    field="em_atendimento"   {...sortProps} />
                      <SortTh label="Aprovados"    field="aprovados"        {...sortProps} />
                      <SortTh label="Coaut. Ativos" field="coautores_ativos" {...sortProps} />
                      <SortTh label="Conversão"    field="coautores_ativos" {...sortProps} className="w-36" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVend.length === 0 ? (
                      <tr><td colSpan={7} className="px-3 py-10 text-center text-sm" style={{ color: `${NAV}70` }}>
                        Nenhum vendedor encontrado.
                      </td></tr>
                    ) : filteredVend.map(v => {
                      const isExpanded = expandedVendId === v.vendedor_id;
                      const conv = pct(v.coautores_ativos, v.leads_atribuidos);
                      return (
                        <React.Fragment key={v.vendedor_id}>
                          {/* Linha do vendedor */}
                          <tr className="transition-colors cursor-pointer"
                            style={{ borderBottom: isExpanded ? 'none' : `1px solid ${NAV}08`,
                              background: isExpanded ? `${ORANGE}06` : undefined }}
                            onClick={() => handleExpandVend(v)}
                            onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = `${NAV}04`; }}
                            onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}>
                            <td className="px-3 py-3 w-8">
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4" style={{ color: ORANGE }} />
                                : <ChevronRight className="w-4 h-4" style={{ color: `${NAV}55` }} />}
                            </td>
                            <td className={tdBase}>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{ background: `${ORANGE}18`, color: ORANGE }}>
                                  {(v.vendedor_name || 'V').charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-sm" style={{ color: NAV }}>{v.vendedor_name}</span>
                              </div>
                            </td>
                            <td className={tdBase}><Num n={v.leads_atribuidos} /></td>
                            <td className={tdBase}><Num n={v.em_atendimento} color={AMBER} /></td>
                            <td className={tdBase}><Num n={v.aprovados} color={GREEN} /></td>
                            <td className={tdBase}><Num n={v.coautores_ativos} color={PURPLE} /></td>
                            <td className={`${tdBase} w-36`}><ConvBar value={conv} /></td>
                          </tr>

                          {/* Expansão: coordenadores */}
                          {isExpanded && (
                            <tr style={{ borderBottom: `1px solid ${NAV}08` }}>
                              <td colSpan={7} className="px-6 pb-4 pt-2" style={{ background: `${ORANGE}04` }}>
                                {loadingCoords ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: ORANGE }} />
                                  </div>
                                ) : vendCoords.length === 0 ? (
                                  <p className="text-sm text-center py-3" style={{ color: `${NAV}70` }}>
                                    Nenhum coordenador atendido ainda.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: ORANGE }}>
                                      Coordenadores atendidos
                                    </p>
                                    {vendCoords.map(c => {
                                      const cConv = pct(c.coautores_ativos, c.leads_total);
                                      return (
                                        <div key={c.coordinator_id}
                                          className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl transition-all"
                                          style={{ background: '#fff', border: `1px solid ${NAV}0C` }}>
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                                              style={{ background: `${BLUE}18`, color: BLUE }}>
                                              {(c.coordinator_name || 'C').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-sm font-semibold truncate" style={{ color: NAV }}>{c.coordinator_name}</p>
                                              <p className="text-[10px]" style={{ color: `${NAV}72` }}>{c.lider_name}</p>
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-4 text-xs shrink-0">
                                            <span><b style={{ color: NAV }}>{Number(c.leads_total)}</b> <span style={{ color: `${NAV}75` }}>leads</span></span>
                                            <span><b style={{ color: AMBER }}>{Number(c.em_atendimento)}</b> <span style={{ color: `${NAV}75` }}>em atend.</span></span>
                                            <span><b style={{ color: GREEN }}>{Number(c.aprovados)}</b> <span style={{ color: `${NAV}75` }}>aprov.</span></span>
                                            <div className="w-24"><ConvBar value={cConv} /></div>
                                          </div>
                                          <button
                                            onClick={e => { e.stopPropagation(); handleViewLeads(v, c); }}
                                            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                                            style={{ background: `${BLUE}12`, color: BLUE, border: `1px solid ${BLUE}25` }}
                                            onMouseEnter={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}12`; e.currentTarget.style.color = BLUE; }}>
                                            Ver Leads
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </BrandCard>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;
