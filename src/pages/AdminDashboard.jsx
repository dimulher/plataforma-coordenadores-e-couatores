
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

// New StatusCard Component for Produção Editorial
const STATUS_CARD_STYLES = {
  rascunho:  { bg: 'bg-[#E6F0FF]', border: 'border-[#B3D9FF]', icon: '✏️' },
  revisao:   { bg: 'bg-[#FFF7D6]', border: 'border-[#FFE5A3]', icon: '🔍' },
  revisado:  { bg: 'bg-[#EDE9FE]', border: 'border-[#C4B5FD]', icon: '✔️' },
  entregue:  { bg: 'bg-[#D1FAE5]', border: 'border-[#6EE7B7]', icon: '📦' },
};

const StatusCard = ({ title, value, type }) => {
  const style = STATUS_CARD_STYLES[type] || { bg: 'bg-gray-100', border: 'border-gray-200', icon: '⚪' };
  return (
    <div className={`p-6 rounded-lg border shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center text-center ${style.bg} ${style.border}`}>
      <div className="text-[32px] mb-2">{style.icon}</div>
      <div className="text-[36px] font-bold text-[#1F2937] leading-none mb-1">{value}</div>
      <div className="text-[13px] text-[#6B7280] font-medium">{title}</div>
    </div>
  );
};

const AdminDashboard = () => {
  const { metrics, loading } = useAdminMetrics();
  const [summaryMetrics, setSummaryMetrics] = useState({
    leadsEmAtendimento: 0,
    totalCoauthors: 0,
    chaptersInReview: 0,
    chaptersDelivered: 0,
  });
  const [editorialMetrics, setEditorialMetrics] = useState({
    rascunho: 0,
    enviados: 0,
    revisados: 0,
    entregues: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
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
    };
    fetchMetrics();
  }, []);

  const [coordChartData, setCoordChartData] = useState([]);

  useEffect(() => {
    const fetchCoordData = async () => {
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

      const data = coords.map(c => ({
        name: (c.name || '').split(' ').slice(0, 2).join(' '),
        leads: leadsMap[c.id] || 0,
        coautores: coauthorsMap[c.id] || 0,
      })).sort((a, b) => b.leads - a.leads);

      setCoordChartData(data);
    };
    fetchCoordData();
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#1B0F3B,#4A148C)] p-4 md:p-8 -m-4 md:-m-8">
      <Helmet>
        <title>Dashboard Admin | NAB Platform</title>
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Welcome Banner */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          <h1 className="text-3xl font-bold">Bem-vindo, Administrador</h1>
          <p className="text-purple-100 mt-1">Aqui está o que está acontecendo na plataforma hoje.</p>
        </div>

        {/* Platform Summary Section */}
        <section>
          <h2 className="text-[20px] font-bold text-white mb-[24px] flex items-center gap-2">
            📊 Resumo Geral da Plataforma
          </h2>
          <PlatformSummaryCards
            leadsEmAtendimento={summaryMetrics.leadsEmAtendimento}
            totalCoauthors={summaryMetrics.totalCoauthors}
            chaptersInReview={summaryMetrics.chaptersInReview}
            chaptersDelivered={summaryMetrics.chaptersDelivered}
          />
        </section>

        {/* Produção Editorial Section */}
        <section className="bg-[rgba(255,255,255,0.95)] rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          <h2 className="text-[20px] font-bold text-[#1F2937] mb-[24px] flex items-center gap-2 border-b pb-4">
            📚 Produção Editorial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatusCard
              title="Em Rascunho"
              value={editorialMetrics.rascunho}
              type="rascunho"
            />
            <StatusCard
              title="Enviados p/ Revisão"
              value={editorialMetrics.enviados}
              type="revisao"
            />
            <StatusCard
              title="Revisados"
              value={editorialMetrics.revisados}
              type="revisado"
            />
            <StatusCard
              title="Entregues"
              value={editorialMetrics.entregues}
              type="entregue"
            />
          </div>
        </section>

        {/* Coordinator Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-[rgba(255,255,255,0.95)] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-none">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">🔥 Coordenadores por Leads (Mais Quentes → Mais Frios)</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coordChartData} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="leads" name="Leads" radius={[0, 4, 4, 0]}>
                    {coordChartData.map((_, index) => {
                      const ratio = coordChartData.length > 1 ? index / (coordChartData.length - 1) : 0;
                      const r = Math.round(239 - (239 - 59) * ratio);
                      const g = Math.round(68 + (130 - 68) * ratio);
                      const b = Math.round(68 + (246 - 68) * ratio);
                      return <Cell key={index} fill={`rgb(${r},${g},${b})`} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[rgba(255,255,255,0.95)] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-none">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">🎯 Metas de Coautores por Coordenador</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coordChartData} margin={{ left: 0, right: 24, top: 4, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <ReferenceLine y={3} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Meta 3', position: 'right', fontSize: 10, fill: '#F59E0B' }} />
                  <ReferenceLine y={6} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Meta 6', position: 'right', fontSize: 10, fill: '#10B981' }} />
                  <ReferenceLine y={9} stroke="#3B82F6" strokeDasharray="4 4" label={{ value: 'Meta 9', position: 'right', fontSize: 10, fill: '#3B82F6' }} />
                  <ReferenceLine y={12} stroke="#8B5CF6" strokeDasharray="4 4" label={{ value: 'Meta 12', position: 'right', fontSize: 10, fill: '#8B5CF6' }} />
                  <Bar dataKey="coautores" name="Coautores" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
