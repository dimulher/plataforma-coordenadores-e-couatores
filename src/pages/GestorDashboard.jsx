import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, TrendingUp, BarChart3, Link2, Calendar, Plus, Trash2, Copy, Loader2, ExternalLink, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { NAV, BLUE, RED, WelcomeBanner, BrandCard, BrandCardHeader, BtnPrimary } from '@/lib/brand';

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

const GestorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCoordinators: 0, totalCoauthors: 0, activeChapters: 0, todayLeads: 0, recentAlerts: [] });
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [agendaLinks, setAgendaLinks] = useState([]);
  const [newPayment, setNewPayment] = useState({ label: '', url: '' });
  const [newAgenda, setNewAgenda] = useState({ label: '', url: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingAgenda, setSavingAgenda] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!user?.id) return;
    const [{ data: payment }, { data: agenda }] = await Promise.all([
      supabase.from('gestor_links').select('id, label, url').eq('gestor_id', user.id).eq('type', 'PAGAMENTO').order('created_at'),
      supabase.rpc('get_all_agenda_links'),
    ]);
    setPaymentLinks(payment || []);
    setAgendaLinks(agenda || []);
  }, [user?.id]);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data: coordinators } = await supabase.from('profiles').select('id').eq('manager_id', user.id);
        const coordIds = (coordinators || []).map(c => c.id);
        if (coordIds.length === 0) {
          setStats({ totalCoordinators: 0, totalCoauthors: 0, activeChapters: 0, todayLeads: 0, recentAlerts: [] });
          setLoading(false);
          return;
        }
        const { data: allCoauthors } = await supabase.rpc('get_all_coauthors_admin');
        const coauthors = (allCoauthors || []).filter(ca => coordIds.includes(ca.coordinator_id));
        const coauthorIds = coauthors.map(p => p.id);
        const { count: chapterCount } = await supabase.from('chapters').select('*', { count: 'exact', head: true }).in('author_id', coauthorIds).eq('status', 'PRODUCAO');
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const { count: todayLeadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('coordinator_id', coordIds).gte('created_at', todayStart.toISOString());
        const { data: announcementsData } = await supabase.from('announcements').select('id, title, content, created_at').order('created_at', { ascending: false }).limit(5);
        setStats({ totalCoordinators: coordIds.length, totalCoauthors: coauthors.length, activeChapters: chapterCount || 0, todayLeads: todayLeadsCount || 0, recentAlerts: announcementsData || [] });
      } catch (err) {
        console.error('Error fetching manager stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    fetchLinks();
  }, [user?.id, fetchLinks]);

  const addPaymentLink = async (e) => {
    e.preventDefault();
    if (!newPayment.label.trim() || !newPayment.url.trim()) return;
    setSavingPayment(true);
    const { error } = await supabase.from('gestor_links').insert({ gestor_id: user.id, type: 'PAGAMENTO', label: newPayment.label.trim(), url: newPayment.url.trim() });
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); }
    else { setNewPayment({ label: '', url: '' }); fetchLinks(); }
    setSavingPayment(false);
  };

  const addAgendaLink = async (e) => {
    e.preventDefault();
    if (!newAgenda.label.trim() || !newAgenda.url.trim()) return;
    setSavingAgenda(true);
    const { error } = await supabase.from('gestor_links').insert({ gestor_id: user.id, type: 'AGENDA', label: newAgenda.label.trim(), url: newAgenda.url.trim() });
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); }
    else { setNewAgenda({ label: '', url: '' }); fetchLinks(); }
    setSavingAgenda(false);
  };

  const deleteLink = async (id) => { await supabase.from('gestor_links').delete().eq('id', id); fetchLinks(); };
  const copyLink = (url) => { navigator.clipboard.writeText(url); toast({ title: 'Link copiado!' }); };

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  const linkRowStyle = { background: `${NAV}04`, border: `1px solid ${NAV}0C` };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Dashboard do Gestor — Novos Autores do Brasil</title></Helmet>

      <WelcomeBanner
        name={`Bem-vindo, ${user?.name?.split(' ')[0] || 'Gestor'}!`}
        subtitle="Acompanhe o desempenho do seu time e a produção em tempo real."
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users}      iconColor={BLUE}      label="Meus Coordenadores"    value={stats.totalCoordinators} />
        <MetricCard icon={UserPlus}   iconColor="#8B5CF6"   label="Total de Coautores"    value={stats.totalCoauthors} />
        <MetricCard icon={BarChart3}  iconColor="#10B981"   label="Caps. em Produção"     value={stats.activeChapters} />
        <MetricCard icon={TrendingUp} iconColor="#F59E0B"   label="Leads Novos Hoje"      value={stats.todayLeads} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Links */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Links de Pagamento */}
          <BrandCard className="flex flex-col">
            <BrandCardHeader icon={Link2} iconColor={BLUE} accentColor={BLUE} title="Links de Pagamento" />
            <div className="px-5 py-5 flex flex-col gap-4 flex-1">
              <form onSubmit={addPaymentLink} className="space-y-2">
                <Input placeholder="Nome do produto" value={newPayment.label} onChange={e => setNewPayment(p => ({ ...p, label: e.target.value }))}
                  className="h-9 text-sm" style={{ borderColor: `${NAV}20`, color: NAV }} required />
                <Input placeholder="https://..." value={newPayment.url} onChange={e => setNewPayment(p => ({ ...p, url: e.target.value }))}
                  className="h-9 text-sm" style={{ borderColor: `${NAV}20`, color: NAV }} required />
                <BtnPrimary loading={savingPayment} loadingLabel="Adicionando..." label="Adicionar" icon={Plus} className="w-full justify-center" />
              </form>
              <div className="space-y-2 flex-1">
                {paymentLinks.length === 0
                  ? <p className="text-xs italic text-center py-2" style={{ color: `${NAV}40` }}>Nenhum link cadastrado.</p>
                  : paymentLinks.map(lk => (
                    <div key={lk.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={linkRowStyle}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: NAV }}>{lk.label}</p>
                        <p className="text-xs truncate" style={{ color: `${NAV}50` }}>{lk.url}</p>
                      </div>
                      <button onClick={() => copyLink(lk.url)} className="shrink-0 p-1 rounded transition-colors" style={{ color: `${NAV}40` }}
                        onMouseEnter={e => { e.currentTarget.style.color = BLUE; }} onMouseLeave={e => { e.currentTarget.style.color = `${NAV}40`; }}>
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a href={lk.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded transition-colors" style={{ color: `${NAV}40` }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#10B981'; }} onMouseLeave={e => { e.currentTarget.style.color = `${NAV}40`; }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => deleteLink(lk.id)} className="shrink-0 p-1 rounded transition-colors" style={{ color: `${NAV}30` }}
                        onMouseEnter={e => { e.currentTarget.style.color = RED; }} onMouseLeave={e => { e.currentTarget.style.color = `${NAV}30`; }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </BrandCard>

          {/* Links de Agenda */}
          <BrandCard className="flex flex-col">
            <BrandCardHeader icon={Calendar} iconColor="#8B5CF6" accentColor="#8B5CF6" title="Links de Agenda" />
            <div className="px-5 py-5 flex flex-col gap-4 flex-1">
              <form onSubmit={addAgendaLink} className="space-y-2">
                <Input placeholder="Descrição (ex: Agenda NAB)" value={newAgenda.label} onChange={e => setNewAgenda(p => ({ ...p, label: e.target.value }))}
                  className="h-9 text-sm" style={{ borderColor: `${NAV}20`, color: NAV }} required />
                <Input placeholder="https://calendly.com/..." value={newAgenda.url} onChange={e => setNewAgenda(p => ({ ...p, url: e.target.value }))}
                  className="h-9 text-sm" style={{ borderColor: `${NAV}20`, color: NAV }} required />
                <button type="submit" disabled={savingAgenda}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: '#8B5CF6', fontFamily: 'Poppins, sans-serif' }}
                  onMouseEnter={e => { if (!savingAgenda) e.currentTarget.style.background = '#7C3AED'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#8B5CF6'; }}
                >
                  {savingAgenda ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {savingAgenda ? 'Adicionando...' : 'Adicionar minha agenda'}
                </button>
              </form>
              <div className="space-y-2 flex-1">
                {agendaLinks.length === 0
                  ? <p className="text-xs italic text-center py-2" style={{ color: `${NAV}40` }}>Nenhuma agenda cadastrada.</p>
                  : agendaLinks.map(lk => (
                    <div key={lk.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={linkRowStyle}>
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                        {(lk.gestor_name || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: NAV }}>{lk.label}</p>
                        <p className="text-xs truncate" style={{ color: `${NAV}50` }}>{lk.gestor_name}</p>
                      </div>
                      <button onClick={() => copyLink(lk.url)} className="shrink-0 p-1 rounded transition-colors" style={{ color: `${NAV}40` }}
                        onMouseEnter={e => { e.currentTarget.style.color = BLUE; }} onMouseLeave={e => { e.currentTarget.style.color = `${NAV}40`; }}>
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a href={lk.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded transition-colors" style={{ color: `${NAV}40` }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#10B981'; }} onMouseLeave={e => { e.currentTarget.style.color = `${NAV}40`; }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {lk.gestor_id === user?.id && (
                        <button onClick={() => deleteLink(lk.id)} className="shrink-0 p-1 rounded transition-colors" style={{ color: `${NAV}30` }}
                          onMouseEnter={e => { e.currentTarget.style.color = RED; }} onMouseLeave={e => { e.currentTarget.style.color = `${NAV}30`; }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </BrandCard>
        </div>

        {/* Avisos */}
        <BrandCard>
          <BrandCardHeader icon={Megaphone} iconColor="#F59E0B" accentColor="#F59E0B" title="Avisos" />
          <div className="px-5 py-5">
            {stats.recentAlerts.length === 0 ? (
              <p className="text-sm italic text-center py-4" style={{ color: `${NAV}40` }}>Nenhum aviso no momento.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentAlerts.map(alert => (
                  <div key={alert.id} className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#92640A' }}>{alert.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#B45309' }}>{alert.content}</p>
                    <p className="text-[10px] mt-1" style={{ color: `${NAV}40` }}>
                      {new Date(alert.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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

export default GestorDashboard;
