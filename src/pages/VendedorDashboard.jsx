import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, TrendingUp, CheckCircle, Target, Loader2, Megaphone } from 'lucide-react';
import { NAV, BLUE, RED, WelcomeBanner, BrandCard, BrandCardHeader } from '@/lib/brand';

const FECHADO_STATUSES = ['FECHADO', 'COAUTOR_ATIVO'];
const ATENDIDO_STATUSES = ['CONTATO', 'QUALIFICADO', 'PROPOSTA', 'EM_ATENDIMENTO', 'EM_AVALIACAO', 'APROVADO', 'CONTRATO_ONBOARDING'];

const STATUS_COLORS = {
  NOVO:                  { bg: `${NAV}10`, color: `${NAV}80` },
  CONTATO:               { bg: `${BLUE}15`, color: BLUE },
  QUALIFICADO:           { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
  PROPOSTA:              { bg: 'rgba(245,158,11,0.12)', color: '#D97706' },
  EM_ATENDIMENTO:        { bg: 'rgba(236,72,153,0.12)', color: '#DB2777' },
  EM_AVALIACAO:          { bg: 'rgba(249,115,22,0.12)', color: '#EA580C' },
  APROVADO:              { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  CONTRATO_ONBOARDING:   { bg: 'rgba(5,150,105,0.15)', color: '#047857' },
  FECHADO:               { bg: 'rgba(16,185,129,0.2)', color: '#065F46' },
  COAUTOR_ATIVO:         { bg: 'rgba(16,185,129,0.2)', color: '#065F46' },
  PERDIDO:               { bg: `${RED}10`, color: RED },
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
      <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color: `${NAV}75` }}>{label}</p>
    </div>
  </div>
);

const VendedorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: leadsData }, { data: ann }] = await Promise.all([
      supabase.rpc('get_my_leads_as_vendedor'),
      supabase.from('announcements').select('id, title, content, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    setLeads(leadsData || []);
    setAnnouncements(ann || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
    </div>
  );

  const localDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const todayISO = `${localDate()}T00:00:00`;

  const total       = leads.length;
  const atendidosHoje = leads.filter(l => ATENDIDO_STATUSES.includes(l.status) && l.updated_at >= todayISO).length;
  const fechadosMes = (() => {
    const d = new Date();
    const firstDay = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01T00:00:00`;
    return leads.filter(l => FECHADO_STATUSES.includes(l.status) && l.updated_at >= firstDay).length;
  })();
  const taxaConversao = total > 0 ? Math.round((leads.filter(l => FECHADO_STATUSES.includes(l.status)).length / total) * 100) : 0;

  // Leads recentes ordenados por updated_at
  const recentes = [...leads].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 8);

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Dashboard Vendedor — Novos Autores do Brasil</title></Helmet>

      <WelcomeBanner
        name={`Olá, ${user?.name?.split(' ')[0] || 'Vendedor'}!`}
        subtitle="Acompanhe seus leads e mova o funil de vendas."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={ShoppingCart} iconColor={BLUE}      label="Leads Atribuídos"   value={total} />
        <MetricCard icon={TrendingUp}   iconColor="#F97316"   label="Atendidos Hoje"      value={atendidosHoje} />
        <MetricCard icon={CheckCircle}  iconColor="#10B981"   label="Fechados no Mês"     value={fechadosMes} />
        <MetricCard icon={Target}       iconColor="#8B5CF6"   label="Taxa de Conversão"   value={`${taxaConversao}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Leads recentes */}
        <div className="lg:col-span-2">
          <BrandCard>
            <BrandCardHeader icon={ShoppingCart} iconColor={BLUE} accentColor={BLUE} title="Leads Recentes" />
            <div className="px-5 pb-5 space-y-2">
              {recentes.length === 0 ? (
                <p className="text-sm italic text-center py-6" style={{ color: `${NAV}70` }}>Nenhum lead atribuído ainda.</p>
              ) : recentes.map(lead => {
                const sc = STATUS_COLORS[lead.status] || { bg: `${NAV}08`, color: `${NAV}85` };
                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
                    style={{ background: `${NAV}03`, border: `1px solid ${NAV}0C` }}
                    onClick={() => navigate('/vendedor/leads')}
                    onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}08`; e.currentTarget.style.borderColor = `${BLUE}25`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${NAV}03`; e.currentTarget.style.borderColor = `${NAV}0C`; }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: NAV }}>{lead.name}</p>
                      <p className="text-xs truncate" style={{ color: `${NAV}75` }}>{lead.email || lead.phone || '—'}</p>
                    </div>
                    <span
                      className="ml-3 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {lead.status}
                    </span>
                  </div>
                );
              })}
              {leads.length > 8 && (
                <button
                  className="w-full text-sm font-semibold py-2 rounded-xl transition-colors"
                  style={{ color: BLUE }}
                  onClick={() => navigate('/vendedor/leads')}
                >
                  Ver todos os leads ({leads.length}) →
                </button>
              )}
            </div>
          </BrandCard>
        </div>

        {/* Avisos */}
        <BrandCard>
          <BrandCardHeader icon={Megaphone} iconColor="#F59E0B" accentColor="#F59E0B" title="Avisos" />
          <div className="px-5 py-5">
            {announcements.length === 0 ? (
              <p className="text-sm italic text-center py-4" style={{ color: `${NAV}70` }}>Nenhum aviso no momento.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#92640A' }}>{a.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#B45309' }}>{a.content}</p>
                    <p className="text-[10px] mt-1" style={{ color: `${NAV}70` }}>
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BrandCard>
      </div>
    </div>
  );
};

export default VendedorDashboard;
