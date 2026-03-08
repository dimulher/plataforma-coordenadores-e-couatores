import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const GestorDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCoordinators: 0,
        totalCoauthors: 0,
        activeChapters: 0,
        todayLeads: 0,
        teamProgress: 0,
        recentAlerts: [],
        hotCoordinators: []
    });

    useEffect(() => {
        async function fetchStats() {
            if (!user?.id) return;
            setLoading(true);
            try {
                // Fetch my coordinators
                const { data: coordinators } = await supabase
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .eq('manager_id', user.id);

                const coordIds = (coordinators || []).map(c => c.id);

                if (coordIds.length === 0) {
                    setStats({ totalCoordinators: 0, totalCoauthors: 0, activeChapters: 0, todayLeads: 0, teamProgress: 0, recentAlerts: [] });
                    setLoading(false);
                    return;
                }

                // Fetch coauthors for these coordinators to calculate "Hot Coordinators"
                const { data: coauthors } = await supabase
                    .from('profiles')
                    .select('id, coordinator_id')
                    .in('coordinator_id', coordIds);

                const coauthorCountMap = (coauthors || []).reduce((acc, curr) => {
                    acc[curr.coordinator_id] = (acc[curr.coordinator_id] || 0) + 1;
                    return acc;
                }, {});

                const hotCoords = (coordinators || []).map(c => ({
                    id: c.id,
                    name: c.name,
                    avatar: c.avatar_url,
                    count: coauthorCountMap[c.id] || 0
                })).sort((a, b) => b.count - a.count).slice(0, 5);

                // Fetch total counts for the summary cards
                const { count: coauthorCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .in('coordinator_id', coordIds);

                const { count: chapterCount } = await supabase
                    .from('chapters')
                    .select('*', { count: 'exact', head: true })
                    .in('author_id', (coauthors || []).map(p => p.id))
                    .eq('status', 'PRODUCAO');

                // Leads de hoje vinculados a coordenadores do gestor
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const { count: todayLeadsCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .in('coordinator_id', coordIds)
                    .gte('created_at', todayStart.toISOString());

                // Busca os últimos avisos do admin
                const { data: announcementsData } = await supabase
                    .from('announcements')
                    .select('id, title, content, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                setStats({
                    totalCoordinators: coordIds.length,
                    totalCoauthors: coauthorCount || 0,
                    activeChapters: chapterCount || 0,
                    todayLeads: todayLeadsCount || 0,
                    teamProgress: 45,
                    recentAlerts: announcementsData || [],
                    hotCoordinators: hotCoords
                });
            } catch (err) {
                console.error('Error fetching manager stats:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [user?.id]);

    if (loading) return <div className="flex h-[400px] items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div></div>;

    return (
        <div className="space-y-8 pb-12">
            <Helmet><title>Dashboard do Gestor - NAB Platform</title></Helmet>

            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        Bem-vindo, {user?.name?.split(' ')[0] || 'Gestor'}! 👋
                    </h1>
                    <p className="text-blue-100 mt-2 text-lg max-w-2xl">
                        Acompanhe o desempenho do seu time de coordenadores e a produção dos coautores em tempo real.
                    </p>
                </div>
                <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header section with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-blue-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">Meus Coordenadores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{stats.totalCoordinators}</div>
                            <Users className="h-8 w-8 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-indigo-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">Total de Coautores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{stats.totalCoauthors}</div>
                            <UserPlus className="h-8 w-8 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-emerald-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">Capítulos em Produção</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{stats.activeChapters}</div>
                            <BarChart3 className="h-8 w-8 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-amber-500 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">Leads Novos Hoje</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{stats.todayLeads}</div>
                            <TrendingUp className="h-8 w-8 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span>Visão Geral do Time</span>
                                <Button variant="outline" size="sm">Ver Relatórios</Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                        <span className="text-slate-600">Progresso Médio de Escrita</span>
                                        <span className="text-blue-600">{stats.teamProgress}%</span>
                                    </div>
                                    <Progress value={stats.teamProgress} className="h-2" />
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Metas da Semana</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-xs text-slate-500 mb-1 leading-tight">Fechamentos esperados</p>
                                            <p className="text-xl font-bold text-slate-800 tracking-tight">12/20</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-xs text-slate-500 mb-1 leading-tight">Novos Coautores</p>
                                            <p className="text-xl font-bold text-slate-800 tracking-tight">8/15</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hot Coordinators Table */}
                    <Card className="overflow-hidden border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                <TrendingUp className="h-5 w-5 text-orange-500" /> Coordenadores "Mais Quentes"
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-4 font-semibold">Coordenador</th>
                                            <th className="px-6 py-4 font-semibold text-center">Invites (Coautores)</th>
                                            <th className="px-6 py-4 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {stats.hotCoordinators && stats.hotCoordinators.length > 0 ? stats.hotCoordinators.map((coord, index) => (
                                            <tr key={coord.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <span className="font-medium text-slate-700">{coord.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                                                        <UserPlus className="h-3.5 w-3.5" />
                                                        {coord.count}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs">
                                                    <span className="text-emerald-600 font-medium">Em crescimento</span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-8 text-center text-slate-400 italic">
                                                    Nenhum coordenador com convites ativos ainda.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
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
