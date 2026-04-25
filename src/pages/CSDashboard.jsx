import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, FileText, CheckCircle, AlertCircle, BarChart3, Loader2, TrendingUp } from 'lucide-react';
import { NAV, BLUE, RED, WelcomeBanner, BrandCard, BrandCardHeader } from '@/lib/brand';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_LABELS = {
  RASCUNHO:                     'Rascunho',
  EM_EDICAO:                    'Em Edição',
  AJUSTES_SOLICITADOS:          'Ajustes Solicitados',
  ENVIADO_PARA_REVISAO:         'Enviado p/ Revisão',
  EM_REVISAO:                   'Em Revisão',
  AGUARDANDO_APROVACAO_COAUTOR: 'Aguard. Aprovação',
  APROVADO:                     'Aprovado',
  PRODUCAO:                     'Em Produção',
  FINALIZADO:                   'Finalizado',
  CONCLUIDO:                    'Concluído',
};

const STATUS_COLORS = {
  RASCUNHO:                     `${NAV}40`,
  EM_EDICAO:                    BLUE,
  AJUSTES_SOLICITADOS:          '#F59E0B',
  ENVIADO_PARA_REVISAO:         '#8B5CF6',
  EM_REVISAO:                   '#EC4899',
  AGUARDANDO_APROVACAO_COAUTOR: '#7C3AED',
  APROVADO:                     '#10B981',
  PRODUCAO:                     '#059669',
  FINALIZADO:                   '#065F46',
  CONCLUIDO:                    '#047857',
};

const MetricCard = ({ icon: Icon, iconColor, label, value }) => (
  <div
    className="rounded-2xl p-5 flex items-center gap-4 bg-white"
    style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
  >
    <span className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0" style={{ background: `${iconColor}15` }}>
      <Icon className="w-6 h-6" style={{ color: iconColor }} />
    </span>
    <div>
      <p className="text-2xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color: `${NAV}50` }}>{label}</p>
    </div>
  </div>
);

const CSDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [coauthors, setCoauthors] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: chaps }, { data: coauths }] = await Promise.all([
      supabase.rpc('get_all_chapters_cs'),
      supabase.rpc('get_all_coauthors_cs'),
    ]);
    setChapters(chaps || []);
    setCoauthors(coauths || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
    </div>
  );

  const inReview    = chapters.filter(c => ['EM_REVISAO', 'ENVIADO_PARA_REVISAO', 'AGUARDANDO_APROVACAO_COAUTOR'].includes(c.status)).length;
  const approved    = chapters.filter(c => ['APROVADO', 'PRODUCAO', 'FINALIZADO', 'CONCLUIDO'].includes(c.status)).length;
  const overdue     = chapters.filter(c => c.deadline && new Date(c.deadline) < new Date() && !['APROVADO','PRODUCAO','FINALIZADO','CONCLUIDO'].includes(c.status)).length;

  // Funil por status
  const statusCounts = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    status: label,
    count: chapters.filter(c => c.status === key).length,
    color: STATUS_COLORS[key],
  })).filter(s => s.count > 0);

  // Últimos 10 coautores sem capítulo (word_count = 0 ou null)
  const needsAttention = chapters
    .filter(c => !['APROVADO','PRODUCAO','FINALIZADO','CONCLUIDO'].includes(c.status))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 8);

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Dashboard CS — Novos Autores do Brasil</title></Helmet>

      <WelcomeBanner
        name={`Olá, ${user?.name?.split(' ')[0] || 'CS'}!`}
        subtitle="Acompanhe o status editorial de todos os coautores."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users}       iconColor={BLUE}      label="Total Coautores"    value={coauthors.length} />
        <MetricCard icon={BarChart3}   iconColor="#8B5CF6"   label="Em Revisão"         value={inReview} />
        <MetricCard icon={CheckCircle} iconColor="#10B981"   label="Aprovados"          value={approved} />
        <MetricCard icon={AlertCircle} iconColor={RED}       label="Atrasados"          value={overdue} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Funil editorial */}
        <BrandCard>
          <BrandCardHeader icon={TrendingUp} iconColor="#8B5CF6" accentColor="#8B5CF6" title="Funil Editorial" />
          <div className="px-5 pb-5">
            {statusCounts.length === 0 ? (
              <p className="text-sm italic text-center py-6" style={{ color: `${NAV}40` }}>Nenhum capítulo cadastrado.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusCounts} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: `${NAV}60` }} />
                  <YAxis type="category" dataKey="status" width={130} tick={{ fontSize: 11, fill: `${NAV}80` }} />
                  <Tooltip
                    formatter={(v) => [v, 'Capítulos']}
                    contentStyle={{ border: `1px solid ${NAV}18`, borderRadius: 10, fontSize: 12, color: NAV }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {statusCounts.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </BrandCard>

        {/* Capítulos que precisam de atenção */}
        <BrandCard>
          <BrandCardHeader icon={FileText} iconColor={RED} accentColor={RED} title="Requerem Atenção" />
          <div className="px-5 pb-5 space-y-2">
            {needsAttention.length === 0 ? (
              <p className="text-sm italic text-center py-6" style={{ color: `${NAV}40` }}>Tudo em dia!</p>
            ) : needsAttention.map(ch => {
              const isLate = ch.deadline && new Date(ch.deadline) < new Date();
              return (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: `${NAV}03`, border: `1px solid ${isLate ? RED : NAV}${isLate ? '30' : '0C'}` }}
                  onClick={() => navigate('/cs/coauthors')}
                  onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${NAV}03`; }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: NAV }}>{ch.author_name}</p>
                    <p className="text-xs truncate" style={{ color: `${NAV}55` }}>{ch.title}</p>
                  </div>
                  <span
                    className="ml-3 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                    style={{
                      background: `${STATUS_COLORS[ch.status] || BLUE}18`,
                      color: STATUS_COLORS[ch.status] || BLUE,
                    }}
                  >
                    {STATUS_LABELS[ch.status] || ch.status}
                  </span>
                </div>
              );
            })}
          </div>
        </BrandCard>
      </div>
    </div>
  );
};

export default CSDashboard;
