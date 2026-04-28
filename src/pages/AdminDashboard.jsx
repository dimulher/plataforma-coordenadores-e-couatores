
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { PlatformSummaryCards } from '@/components/PlatformSummaryCards';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { NAV, BLUE, RED, WelcomeBanner, BrandCard } from '@/lib/brand';
import { TrendingUp, Users, CheckCircle2, UserCheck, CalendarDays } from 'lucide-react';

// ── Helpers de data (usa data LOCAL, não UTC) ──────────────────────────────────
const localDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = () => localDateStr();

// Segunda-feira da semana atual
const thisWeekMonday = () => {
  const d = new Date();
  const dow = d.getDay(); // 0=Dom, 1=Seg ... 6=Sáb
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return localDateStr(d);
};

// Domingo da semana atual
const thisWeekSunday = () => {
  const d = new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? 0 : 7 - dow));
  return localDateStr(d);
};

// Primeiro dia do mês atual
const thisMonthFirst = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

// Último dia do mês atual
const thisMonthLast = () => {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  return localDateStr(d);
};

// Converte data local → ISO UTC para queries no Supabase
const isoFrom = (s) => new Date(`${s}T00:00:00`).toISOString();
const isoTo   = (s) => new Date(`${s}T23:59:59.999`).toISOString();

const fmtDate = (dateStr) => {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

const PERIODS = [
  { id: 'day',   label: 'Hoje',   from: () => todayStr(),       to: () => todayStr() },
  { id: 'week',  label: 'Semana', from: () => thisWeekMonday(), to: () => thisWeekSunday() },
  { id: 'month', label: 'Mês',    from: () => thisMonthFirst(), to: () => thisMonthLast() },
];

// ── Constantes editoriais ──────────────────────────────────────────────────────
const EDITORIAL_CARDS = [
  { key: 'rascunho',  title: 'Em Rascunho',        color: BLUE,      icon: '✏️' },
  { key: 'enviados',  title: 'Enviados p/ Revisão', color: '#F59E0B', icon: '🔍' },
  { key: 'revisados', title: 'Revisados',           color: '#10B981', icon: '✔️' },
  { key: 'entregues', title: 'Entregues',           color: '#8B5CF6', icon: '📦' },
];

// ── Tooltip customizado ────────────────────────────────────────────────────────
const LeadsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-sm shadow-xl" style={{ background: 'white', border: `1px solid ${NAV}12`, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <p className="font-bold mb-2" style={{ color: NAV }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill || p.color }} />
          <span style={{ color: `${NAV}80` }}>{p.name}:</span>
          <span className="font-bold" style={{ color: NAV }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user } = useAuth();
  const { metrics, loading } = useAdminMetrics();

  // Métricas existentes
  const [summaryMetrics, setSummaryMetrics] = useState({
    leadsEmAtendimento: 0, totalCoauthors: 0, chaptersInReview: 0, chaptersDelivered: 0,
  });
  const [editorialMetrics, setEditorialMetrics] = useState({
    rascunho: 0, enviados: 0, revisados: 0, entregues: 0,
  });
  const [coordChartData, setCoordChartData] = useState([]);

  // Funil de Leads
  const [activePeriod, setActivePeriod] = useState('week');
  const [dateFrom, setDateFrom] = useState(() => thisWeekMonday());
  const [dateTo, setDateTo]     = useState(() => thisWeekSunday());
  const [leadsStats, setLeadsStats] = useState({
    entrados: 0, atendidos: 0, fechados: 0, chartData: [],
  });
  const [loadingLeads, setLoadingLeads] = useState(false);

  // ── Fetch métricas gerais ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [
        { count: leadsCount },
        { count: coauthorsCount },
        { count: reviewCount },
        { count: deliveredCount },
        { count: rascunhoCount },
        { count: enviadosCount },
        { count: revisadosCount },
        { count: entreguesCount },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'EM_ATENDIMENTO'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'COAUTOR'),
        supabase.from('chapters').select('*', { count: 'exact', head: true }).in('status', ['ENVIADO_PARA_REVISAO', 'EM_REVISAO']),
        supabase.from('chapters').select('*', { count: 'exact', head: true }).in('status', ['APROVADO', 'FINALIZADO', 'CONCLUIDO']),
        supabase.from('chapters').select('*', { count: 'exact', head: true }).in('status', ['RASCUNHO', 'EM_EDICAO', 'AJUSTES_SOLICITADOS']),
        supabase.from('chapters').select('*', { count: 'exact', head: true }).in('status', ['ENVIADO_PARA_REVISAO', 'EM_REVISAO']),
        supabase.from('chapters').select('*', { count: 'exact', head: true }).eq('status', 'APROVADO'),
        supabase.from('chapters').select('*', { count: 'exact', head: true }).in('status', ['FINALIZADO', 'CONCLUIDO', 'PRODUCAO']),
      ]);
      setSummaryMetrics({
        leadsEmAtendimento: leadsCount || 0,
        totalCoauthors: coauthorsCount || 0,
        chaptersInReview: reviewCount || 0,
        chaptersDelivered: deliveredCount || 0,
      });
      setEditorialMetrics({
        rascunho: rascunhoCount || 0,
        enviados: enviadosCount || 0,
        revisados: revisadosCount || 0,
        entregues: entreguesCount || 0,
      });
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: coords } = await supabase.rpc('get_all_coordinators_admin');
      if (!coords?.length) return;
      const ids = coords.map(c => c.id);
      const [{ data: leads }, { data: coauthors }] = await Promise.all([
        supabase.from('leads').select('coordinator_id').in('coordinator_id', ids),
        supabase.from('profiles').select('coordinator_id').eq('role', 'COAUTOR').in('coordinator_id', ids),
      ]);
      const leadsMap = {};
      (leads || []).forEach(l => { leadsMap[l.coordinator_id] = (leadsMap[l.coordinator_id] || 0) + 1; });
      const coauthorsMap = {};
      (coauthors || []).forEach(a => { coauthorsMap[a.coordinator_id] = (coauthorsMap[a.coordinator_id] || 0) + 1; });
      setCoordChartData(
        coords.map(c => ({
          name: (c.name || '').split(' ').slice(0, 2).join(' '),
          leads: leadsMap[c.id] || 0,
          coautores: coauthorsMap[c.id] || 0,
        })).sort((a, b) => b.leads - a.leads)
      );
    })();
  }, []);

  // ── Fetch leads por período ──────────────────────────────────────────────────
  const fetchLeadsStats = useCallback(async (from, to) => {
    setLoadingLeads(true);
    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, status, created_at')
        .gte('created_at', isoFrom(from))
        .lte('created_at', isoTo(to));

      const rows = leads || [];

      const ATENDIDO_STATUSES = ['EM_ATENDIMENTO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA', 'EM_AVALIACAO', 'APROVADO', 'CONTRATO_ONBOARDING'];
      const FECHADO_STATUSES  = ['FECHADO', 'COAUTOR_ATIVO'];

      const entrados  = rows.length;
      const atendidos = rows.filter(l => ATENDIDO_STATUSES.includes(l.status) || FECHADO_STATUSES.includes(l.status)).length;
      const fechados  = rows.filter(l => FECHADO_STATUSES.includes(l.status)).length;

      // Gerar todas as datas do intervalo para o gráfico
      const dateMap = {};
      const start = new Date(from);
      const end   = new Date(to);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateMap[toDateStr(new Date(d))] = { date: fmtDate(toDateStr(new Date(d))), entrados: 0, atendidos: 0, fechados: 0 };
      }

      rows.forEach(l => {
        const day = l.created_at.split('T')[0];
        if (!dateMap[day]) return;
        dateMap[day].entrados++;
        if (ATENDIDO_STATUSES.includes(l.status) || FECHADO_STATUSES.includes(l.status)) dateMap[day].atendidos++;
        if (FECHADO_STATUSES.includes(l.status)) dateMap[day].fechados++;
      });

      setLeadsStats({ entrados, atendidos, fechados, chartData: Object.values(dateMap) });
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => { fetchLeadsStats(dateFrom, dateTo); }, [dateFrom, dateTo, fetchLeadsStats]);

  const handlePeriod = (p) => {
    setActivePeriod(p.id);
    setDateFrom(p.from());
    setDateTo(p.to());
  };

  const handleDateFrom = (v) => {
    setActivePeriod('custom');
    setDateFrom(v);
  };

  const handleDateTo = (v) => {
    setActivePeriod('custom');
    setDateTo(v);
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  // Taxa de conversão
  const taxaAtendimento = leadsStats.entrados > 0 ? Math.round((leadsStats.atendidos / leadsStats.entrados) * 100) : 0;
  const taxaFechamento  = leadsStats.entrados > 0 ? Math.round((leadsStats.fechados  / leadsStats.entrados) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      <Helmet><title>Dashboard Admin — Novos Autores do Brasil</title></Helmet>

      <WelcomeBanner name={`Bem-vindo, ${user?.name || 'Administrador'}`} subtitle="Aqui está o resumo da plataforma hoje." />

      {/* Resumo Geral */}
      <section className="space-y-4">
        <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: `${NAV}75`, fontFamily: 'Poppins, sans-serif' }}>
          Resumo Geral da Plataforma
        </h2>
        <PlatformSummaryCards
          leadsEmAtendimento={summaryMetrics.leadsEmAtendimento}
          totalCoauthors={summaryMetrics.totalCoauthors}
          chaptersInReview={summaryMetrics.chaptersInReview}
          chaptersDelivered={summaryMetrics.chaptersDelivered}
        />
      </section>

      {/* ── Funil de Leads ─────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        {/* Cabeçalho + filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: BLUE }} />
            <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: `${NAV}75`, fontFamily: 'Poppins, sans-serif' }}>
              Funil de Leads
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Atalhos de período */}
            {PERIODS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: activePeriod === p.id ? NAV : 'white',
                  color: activePeriod === p.id ? 'white' : `${NAV}85`,
                  border: `1px solid ${activePeriod === p.id ? NAV : `${NAV}18`}`,
                }}
                onMouseEnter={e => { if (activePeriod !== p.id) { e.currentTarget.style.borderColor = `${NAV}70`; e.currentTarget.style.color = NAV; } }}
                onMouseLeave={e => { if (activePeriod !== p.id) { e.currentTarget.style.borderColor = `${NAV}18`; e.currentTarget.style.color = `${NAV}85`; } }}
              >
                {p.label}
              </button>
            ))}

            {/* Separador */}
            <div className="w-px h-5 hidden sm:block" style={{ background: `${NAV}15` }} />

            {/* Calendário De/Até */}
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" style={{ color: `${NAV}70` }} />
              <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={e => handleDateFrom(e.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-all"
                style={{
                  border: `1px solid ${activePeriod === 'custom' ? BLUE : `${NAV}18`}`,
                  color: NAV, background: 'white',
                  boxShadow: activePeriod === 'custom' ? `0 0 0 2px ${BLUE}18` : 'none',
                }}
              />
              <span className="text-xs font-medium" style={{ color: `${NAV}75` }}>até</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={e => handleDateTo(e.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-all"
                style={{
                  border: `1px solid ${activePeriod === 'custom' ? BLUE : `${NAV}18`}`,
                  color: NAV, background: 'white',
                  boxShadow: activePeriod === 'custom' ? `0 0 0 2px ${BLUE}18` : 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Entrados */}
          <div className="rounded-2xl p-5 bg-white flex items-center gap-4"
            style={{ border: `1px solid ${BLUE}20`, boxShadow: `0 1px 4px ${NAV}08` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${BLUE}12` }}>
              <Users className="w-6 h-6" style={{ color: BLUE }} />
            </div>
            <div>
              <p className="text-3xl font-bold leading-none mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                {loadingLeads ? '—' : leadsStats.entrados}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${NAV}75` }}>Leads Entrados</p>
            </div>
          </div>

          {/* Atendidos */}
          <div className="rounded-2xl p-5 bg-white flex items-center gap-4"
            style={{ border: `1px solid ${'#F59E0B'}30`, boxShadow: `0 1px 4px ${NAV}08` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.10)' }}>
              <UserCheck className="w-6 h-6" style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <p className="text-3xl font-bold leading-none mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                {loadingLeads ? '—' : leadsStats.atendidos}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${NAV}75` }}>Atendidos</p>
              {!loadingLeads && leadsStats.entrados > 0 && (
                <p className="text-xs mt-0.5" style={{ color: '#F59E0B' }}>{taxaAtendimento}% dos entrados</p>
              )}
            </div>
          </div>

          {/* Fechados */}
          <div className="rounded-2xl p-5 bg-white flex items-center gap-4"
            style={{ border: `1px solid ${'#10B981'}30`, boxShadow: `0 1px 4px ${NAV}08` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.10)' }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: '#10B981' }} />
            </div>
            <div>
              <p className="text-3xl font-bold leading-none mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                {loadingLeads ? '—' : leadsStats.fechados}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${NAV}75` }}>Fechados</p>
              {!loadingLeads && leadsStats.entrados > 0 && (
                <p className="text-xs mt-0.5" style={{ color: '#10B981' }}>{taxaFechamento}% dos entrados</p>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico diário */}
        {leadsStats.chartData.length > 1 && (
          <BrandCard>
            <div className="px-6 pt-5 pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                  Leads por dia
                </h3>
                <p className="text-xs mt-0.5" style={{ color: `${NAV}75` }}>
                  {fmtDate(dateFrom)} → {fmtDate(dateTo)}
                </p>
              </div>
              {loadingLeads && (
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${BLUE}40`, borderTopColor: 'transparent' }} />
              )}
            </div>
            <div style={{ height: 260, padding: '0 16px 16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsStats.chartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={`${NAV}08`} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: `${NAV}80` }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: `${NAV}72` }} width={28} />
                  <Tooltip content={<LeadsTooltip />} cursor={{ fill: `${NAV}04` }} />
                  <Legend
                    iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8, color: `${NAV}70` }}
                  />
                  <Bar dataKey="entrados"  name="Entrados"  fill={BLUE}      radius={[3,3,0,0]} />
                  <Bar dataKey="atendidos" name="Atendidos" fill="#F59E0B"   radius={[3,3,0,0]} />
                  <Bar dataKey="fechados"  name="Fechados"  fill="#10B981"   radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BrandCard>
        )}

        {/* Estado vazio */}
        {!loadingLeads && leadsStats.entrados === 0 && (
          <div className="rounded-2xl py-10 text-center" style={{ background: 'white', border: `1px dashed ${NAV}15` }}>
            <p className="text-sm" style={{ color: `${NAV}70` }}>Nenhum lead encontrado no período selecionado.</p>
          </div>
        )}
      </section>

      {/* Produção Editorial */}
      <section>
        <h2 className="text-base font-bold uppercase tracking-wider mb-4" style={{ color: `${NAV}75`, fontFamily: 'Poppins, sans-serif' }}>
          Produção Editorial
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {EDITORIAL_CARDS.map(({ key, title, color, icon }) => (
            <div
              key={key}
              className="rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-white"
              style={{ border: `1px solid ${color}25`, boxShadow: `0 1px 4px ${NAV}08` }}
            >
              <div className="text-3xl mb-3">{icon}</div>
              <div className="text-4xl font-bold mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                {editorialMetrics[key]}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${NAV}75` }}>{title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts coordenadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BrandCard>
          <div className="px-6 pt-5 pb-2">
            <h3 className="font-bold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              Coordenadores por Leads
            </h3>
            <p className="text-xs mt-0.5" style={{ color: `${NAV}75` }}>Mais quentes → Mais frios</p>
          </div>
          <div style={{ height: 320, padding: '0 16px 16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coordChartData} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={`${NAV}08`} />
                <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: `${NAV}75` }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11, fill: `${NAV}70` }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: `1px solid ${NAV}10`, boxShadow: `0 4px 16px ${NAV}10`, fontFamily: "'Be Vietnam Pro', sans-serif" }} />
                <Bar dataKey="leads" name="Leads" radius={[0, 4, 4, 0]}>
                  {coordChartData.map((_, index) => {
                    const ratio = coordChartData.length > 1 ? index / (coordChartData.length - 1) : 0;
                    const r = Math.round(172 - (172 - 63)  * ratio);
                    const g = Math.round(27  + (125 - 27)  * ratio);
                    const b = Math.round(0   + (176 - 0)   * ratio);
                    return <Cell key={index} fill={`rgb(${r},${g},${b})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BrandCard>

        <BrandCard>
          <div className="px-6 pt-5 pb-2">
            <h3 className="font-bold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              Metas de Coautores por Coordenador
            </h3>
            <p className="text-xs mt-0.5" style={{ color: `${NAV}75` }}>Progresso em relação às metas</p>
          </div>
          <div style={{ height: 320, padding: '0 16px 16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coordChartData} margin={{ left: 0, right: 24, top: 4, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={`${NAV}08`} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: `${NAV}85` }} angle={-30} textAnchor="end" interval={0} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'auto']} tick={{ fontSize: 11, fill: `${NAV}75` }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: `1px solid ${NAV}10`, boxShadow: `0 4px 16px ${NAV}10` }} />
                <ReferenceLine y={3}  stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Meta 3',  position: 'right', fontSize: 10, fill: '#F59E0B' }} />
                <ReferenceLine y={6}  stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Meta 6',  position: 'right', fontSize: 10, fill: '#10B981' }} />
                <ReferenceLine y={9}  stroke={BLUE}    strokeDasharray="4 4" label={{ value: 'Meta 9',  position: 'right', fontSize: 10, fill: BLUE }} />
                <ReferenceLine y={12} stroke={RED}     strokeDasharray="4 4" label={{ value: 'Meta 12', position: 'right', fontSize: 10, fill: RED }} />
                <Bar dataKey="coautores" name="Coautores" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BrandCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
