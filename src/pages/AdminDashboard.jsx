
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { PlatformSummaryCards } from '@/components/PlatformSummaryCards';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { NAV, BLUE, RED, CREAM, WelcomeBanner, BrandCard } from '@/lib/brand';

const EDITORIAL_CARDS = [
  { key: 'rascunho', title: 'Em Rascunho',        color: BLUE,      icon: '✏️' },
  { key: 'enviados', title: 'Enviados p/ Revisão', color: '#F59E0B', icon: '🔍' },
  { key: 'revisados', title: 'Revisados',          color: '#10B981', icon: '✔️' },
  { key: 'entregues', title: 'Entregues',          color: '#8B5CF6', icon: '📦' },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const { metrics, loading } = useAdminMetrics();
  const [summaryMetrics, setSummaryMetrics] = useState({
    leadsEmAtendimento: 0,
    totalCoauthors: 0,
    chaptersInReview: 0,
    chaptersDelivered: 0,
  });
  const [editorialMetrics, setEditorialMetrics] = useState({
    rascunho: 0, enviados: 0, revisados: 0, entregues: 0,
  });
  const [coordChartData, setCoordChartData] = useState([]);

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

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <Helmet><title>Dashboard Admin — Novos Autores do Brasil</title></Helmet>

      <WelcomeBanner name={`Bem-vindo, ${user?.name || 'Administrador'}`} subtitle="Aqui está o resumo da plataforma hoje." />

      {/* Resumo Geral */}
      <section className="space-y-4">
        <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: `${NAV}50`, fontFamily: 'Poppins, sans-serif' }}>
          Resumo Geral da Plataforma
        </h2>
        <PlatformSummaryCards
          leadsEmAtendimento={summaryMetrics.leadsEmAtendimento}
          totalCoauthors={summaryMetrics.totalCoauthors}
          chaptersInReview={summaryMetrics.chaptersInReview}
          chaptersDelivered={summaryMetrics.chaptersDelivered}
        />
      </section>

      {/* Produção Editorial */}
      <section>
        <h2 className="text-base font-bold uppercase tracking-wider mb-4" style={{ color: `${NAV}50`, fontFamily: 'Poppins, sans-serif' }}>
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
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${NAV}50` }}>{title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BrandCard>
          <div className="px-6 pt-5 pb-2">
            <h3 className="font-bold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              Coordenadores por Leads
            </h3>
            <p className="text-xs mt-0.5" style={{ color: `${NAV}50` }}>Mais quentes → Mais frios</p>
          </div>
          <div style={{ height: 320, padding: '0 16px 16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coordChartData} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={`${NAV}08`} />
                <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: `${NAV}50` }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11, fill: `${NAV}70` }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: `1px solid ${NAV}10`, boxShadow: `0 4px 16px ${NAV}10`, fontFamily: "'Be Vietnam Pro', sans-serif" }} />
                <Bar dataKey="leads" name="Leads" radius={[0, 4, 4, 0]}>
                  {coordChartData.map((_, index) => {
                    const ratio = coordChartData.length > 1 ? index / (coordChartData.length - 1) : 0;
                    const r = Math.round(172 - (172 - 63) * ratio);
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
            <p className="text-xs mt-0.5" style={{ color: `${NAV}50` }}>Progresso em relação às metas</p>
          </div>
          <div style={{ height: 320, padding: '0 16px 16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coordChartData} margin={{ left: 0, right: 24, top: 4, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={`${NAV}08`} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: `${NAV}60` }} angle={-30} textAnchor="end" interval={0} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'auto']} tick={{ fontSize: 11, fill: `${NAV}50` }} />
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
