import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, TrendingUp, BarChart3, AlertCircle, Link2, Calendar, Plus, Trash2, Copy, Loader2, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const GestorDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCoordinators: 0,
        totalCoauthors: 0,
        activeChapters: 0,
        todayLeads: 0,
        recentAlerts: [],
    });

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
                const { data: coordinators } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('manager_id', user.id);

                const coordIds = (coordinators || []).map(c => c.id);

                if (coordIds.length === 0) {
                    setStats({ totalCoordinators: 0, totalCoauthors: 0, activeChapters: 0, todayLeads: 0, recentAlerts: [] });
                    setLoading(false);
                    return;
                }

                const { data: allCoauthors } = await supabase.rpc('get_all_coauthors_admin');
                const coauthors = (allCoauthors || []).filter(ca => coordIds.includes(ca.coordinator_id));
                const coauthorIds = coauthors.map(p => p.id);

                const { count: chapterCount } = await supabase
                    .from('chapters')
                    .select('*', { count: 'exact', head: true })
                    .in('author_id', coauthorIds)
                    .eq('status', 'PRODUCAO');

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const { count: todayLeadsCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .in('coordinator_id', coordIds)
                    .gte('created_at', todayStart.toISOString());

                const { data: announcementsData } = await supabase
                    .from('announcements')
                    .select('id, title, content, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                setStats({
                    totalCoordinators: coordIds.length,
                    totalCoauthors: coauthors.length,
                    activeChapters: chapterCount || 0,
                    todayLeads: todayLeadsCount || 0,
                    recentAlerts: announcementsData || [],
                });
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
        const { error } = await supabase.from('gestor_links').insert({
            gestor_id: user.id,
            type: 'PAGAMENTO',
            label: newPayment.label.trim(),
            url: newPayment.url.trim(),
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } else {
            setNewPayment({ label: '', url: '' });
            fetchLinks();
        }
        setSavingPayment(false);
    };

    const addAgendaLink = async (e) => {
        e.preventDefault();
        if (!newAgenda.label.trim() || !newAgenda.url.trim()) return;
        setSavingAgenda(true);
        const { error } = await supabase.from('gestor_links').insert({
            gestor_id: user.id,
            type: 'AGENDA',
            label: newAgenda.label.trim(),
            url: newAgenda.url.trim(),
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } else {
            setNewAgenda({ label: '', url: '' });
            fetchLinks();
        }
        setSavingAgenda(false);
    };

    const deleteLink = async (id) => {
        await supabase.from('gestor_links').delete().eq('id', id);
        fetchLinks();
    };

    const copyLink = (url) => {
        navigator.clipboard.writeText(url);
        toast({ title: 'Link copiado!' });
    };

    if (loading) return (
        <div className="flex h-[400px] items-center justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <Helmet><title>Dashboard do Gestor - NAB Platform</title></Helmet>

            {/* Welcome */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold">Bem-vindo, {user?.name?.split(' ')[0] || 'Gestor'}! 👋</h1>
                    <p className="text-blue-100 mt-2 text-lg max-w-2xl">
                        Acompanhe o desempenho do seu time de coordenadores e a produção dos coautores em tempo real.
                    </p>
                </div>
                <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Cards métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-blue-600 text-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Meus Coordenadores</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center justify-between"><div className="text-3xl font-bold">{stats.totalCoordinators}</div><Users className="h-8 w-8 opacity-20" /></div></CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-indigo-600 text-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Total de Coautores</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center justify-between"><div className="text-3xl font-bold">{stats.totalCoauthors}</div><UserPlus className="h-8 w-8 opacity-20" /></div></CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-600 text-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Capítulos em Produção</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center justify-between"><div className="text-3xl font-bold">{stats.activeChapters}</div><BarChart3 className="h-8 w-8 opacity-20" /></div></CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-500 text-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Leads Novos Hoje</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center justify-between"><div className="text-3xl font-bold">{stats.todayLeads}</div><TrendingUp className="h-8 w-8 opacity-20" /></div></CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna principal */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Links de Pagamento */}
                    <Card className="border-slate-200 shadow-sm flex flex-col">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                                <Link2 className="h-4 w-4 text-blue-500" /> Meus Links de Pagamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4 pt-4">
                            {/* Formulário */}
                            <form onSubmit={addPaymentLink} className="space-y-2">
                                <Input
                                    placeholder="Nome do produto"
                                    value={newPayment.label}
                                    onChange={e => setNewPayment(p => ({ ...p, label: e.target.value }))}
                                    className="h-9 text-sm"
                                    required
                                />
                                <Input
                                    placeholder="https://..."
                                    value={newPayment.url}
                                    onChange={e => setNewPayment(p => ({ ...p, url: e.target.value }))}
                                    className="h-9 text-sm"
                                    required
                                />
                                <Button type="submit" size="sm" disabled={savingPayment} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9">
                                    {savingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Adicionar</>}
                                </Button>
                            </form>

                            {/* Lista */}
                            <div className="space-y-2 flex-1">
                                {paymentLinks.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-2">Nenhum link cadastrado.</p>
                                ) : paymentLinks.map(lk => (
                                    <div key={lk.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{lk.label}</p>
                                            <p className="text-xs text-slate-400 truncate">{lk.url}</p>
                                        </div>
                                        <button onClick={() => copyLink(lk.url)} className="text-slate-400 hover:text-blue-500 transition-colors shrink-0" title="Copiar link">
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <a href={lk.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0" title="Abrir link">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                        <button onClick={() => deleteLink(lk.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0" title="Excluir">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Links de Agenda */}
                    <Card className="border-slate-200 shadow-sm flex flex-col">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                                <Calendar className="h-4 w-4 text-indigo-500" /> Links de Agenda
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4 pt-4">
                            {/* Adicionar minha agenda */}
                            <form onSubmit={addAgendaLink} className="space-y-2">
                                <Input
                                    placeholder="Descrição (ex: Agenda NAB)"
                                    value={newAgenda.label}
                                    onChange={e => setNewAgenda(p => ({ ...p, label: e.target.value }))}
                                    className="h-9 text-sm"
                                    required
                                />
                                <Input
                                    placeholder="https://calendly.com/..."
                                    value={newAgenda.url}
                                    onChange={e => setNewAgenda(p => ({ ...p, url: e.target.value }))}
                                    className="h-9 text-sm"
                                    required
                                />
                                <Button type="submit" size="sm" disabled={savingAgenda} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9">
                                    {savingAgenda ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Adicionar minha agenda</>}
                                </Button>
                            </form>

                            {/* Lista de todos os gestores */}
                            <div className="space-y-2 flex-1">
                                {agendaLinks.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-2">Nenhuma agenda cadastrada.</p>
                                ) : agendaLinks.map(lk => (
                                    <div key={lk.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                            {(lk.gestor_name || 'G').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{lk.label}</p>
                                            <p className="text-xs text-slate-400 truncate">{lk.gestor_name}</p>
                                        </div>
                                        <button onClick={() => copyLink(lk.url)} className="text-slate-400 hover:text-blue-500 transition-colors shrink-0" title="Copiar link">
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <a href={lk.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0" title="Abrir agenda">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                        {lk.gestor_id === user?.id && (
                                            <button onClick={() => deleteLink(lk.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0" title="Excluir">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar — Avisos */}
                <div>
                    <Card className="border-orange-100 bg-orange-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                                <AlertCircle className="h-5 w-5" /> Avisos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats.recentAlerts.length === 0 ? (
                                <p className="text-sm text-slate-400 italic text-center py-4">Nenhum aviso no momento.</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.recentAlerts.map(alert => (
                                        <div key={alert.id} className="p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
                                            <p className="text-sm font-semibold text-orange-900">{alert.title}</p>
                                            <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">{alert.content}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(alert.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GestorDashboard;
