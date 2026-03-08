import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users, Search, Filter, UserSquare2, Copy, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const GestorCoordinatorsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [coordinators, setCoordinators] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [projects, setProjects] = useState([]);
    const { toast } = useToast();

    const copyLink = (url, id) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast({ title: 'Link copiado!' });
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        supabase.from('projects').select('id, name').eq('status', 'ativo').order('name')
            .then(({ data }) => setProjects(data || []));
    }, []);

    useEffect(() => {
        async function fetchCoordinators() {
            if (!user?.id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .rpc('get_my_coordinators');

                if (error) throw error;
                const coords = data || [];

                if (coords.length > 0) {
                    const coordIds = coords.map(c => c.id);

                    const [{ data: stats }, { data: participations }] = await Promise.all([
                        supabase.rpc('get_team_stats'),
                        supabase
                            .from('project_participants')
                            .select('user_id, projects(id, name)')
                            .in('user_id', coordIds),
                    ]);

                    const statsMap = {};
                    (stats || []).forEach(s => { statsMap[s.coordinator_id] = s; });

                    const projectMap = {};
                    (participations || []).forEach(p => {
                        if (p.projects) projectMap[p.user_id] = p.projects.name;
                    });

                    setCoordinators(coords.map(c => ({
                        ...c,
                        leads: Number(statsMap[c.id]?.lead_count || 0),
                        coautores: Number(statsMap[c.id]?.coauthor_count || 0),
                        project_name: projectMap[c.id] || null,
                    })));
                } else {
                    setCoordinators([]);
                }
            } catch (err) {
                console.error('Error fetching coordinators:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchCoordinators();
    }, [user?.id]);

    const filteredCoordinators = coordinators.filter(coord =>
        coord.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coord.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'C';
    };

    if (loading) return <div className="flex h-[400px] items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div></div>;

    return (
        <div className="space-y-6">
            <Helmet><title>Meus Coordenadores - NAB Platform</title></Helmet>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meus Coordenadores</h1>
                    <p className="text-slate-500">Gerencie e acompanhe o desempenho dos seus coordenadores.</p>
                </div>
                <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <UserSquare2 className="h-4 w-4 mr-2" /> Convidar Coordenador
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Convidar Coordenador</DialogTitle>
                            <DialogDescription>
                                Compartilhe o link do projeto com o novo coordenador. Ele será vinculado ao seu time e ao projeto correspondente.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 pt-2">
                            {projects.length === 0 ? (
                                <p className="text-sm text-slate-400 italic text-center py-4">Nenhum projeto ativo encontrado.</p>
                            ) : projects.map(proj => {
                                const link = `${window.location.origin}/register/coordinator/${user?.id}/${proj.id}`;
                                return (
                                    <div key={proj.id} className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{proj.name}</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={link}
                                                readOnly
                                                className="bg-slate-50 border-slate-200 text-xs h-9"
                                            />
                                            <Button size="sm" className="px-3 shrink-0 h-9" onClick={() => copyLink(link, proj.id)}>
                                                {copiedId === proj.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-2 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                <strong>Importante:</strong> Cada link é exclusivo para o projeto. O coordenador será vinculado ao seu time e ao projeto ao se cadastrar.
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome ou email..."
                                className="pl-10 h-11 border-slate-200 focus:ring-blue-500 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-11 rounded-xl">
                            <Filter className="h-4 w-4 mr-2" /> Filtros
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Coordenador</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Projeto</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Leads</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Coautores</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCoordinators.map((coord) => (
                                    <tr key={coord.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/manager/coordinators/${coord.id}`)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border border-slate-200">
                                                    {coord.avatar_url && <AvatarImage src={coord.avatar_url} />}
                                                    <AvatarFallback className="bg-blue-50 text-blue-600 font-bold whitespace-nowrap">
                                                        {getInitials(coord.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-slate-800">{coord.name}</div>
                                                    <div className="text-xs text-slate-500">{coord.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {coord.project_name
                                                ? (() => {
                                                    const isSP = coord.project_name.toLowerCase().includes('paulo');
                                                    return (
                                                        <Badge variant="outline" className={`whitespace-nowrap ${isSP ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                            {coord.project_name}
                                                        </Badge>
                                                    );
                                                  })()
                                                : <span className="text-xs text-slate-300 italic">—</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{coord.leads}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">{coord.coautores}</Badge>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCoordinators.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Users className="h-12 w-12 opacity-20" />
                                                <p>Nenhum coordenador encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GestorCoordinatorsPage;
