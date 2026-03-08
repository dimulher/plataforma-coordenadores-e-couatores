import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, UserSquare2 } from 'lucide-react';

const AdminCoordinatorsPage = () => {
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gestorFilter, setGestorFilter] = useState('ALL');

  const fetchCoordinators = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, role, coordinator_id, manager_id')
        .eq('role', 'COORDENADOR')
        .order('name');

      if (error) throw error;

      const ids = (profiles || []).map(p => p.id);
      if (ids.length === 0) { setCoordinators([]); return; }

      const [{ data: coauthors }, { data: participations }, { data: gestorProfiles }] = await Promise.all([
        supabase.from('profiles').select('id, coordinator_id').in('coordinator_id', ids),
        supabase.from('project_participants').select('user_id, projects(id, name)').in('user_id', ids),
        supabase.from('profiles').select('id, name').in('id', (profiles || []).map(p => p.manager_id).filter(Boolean)),
      ]);

      // Capítulos dos coautores
      const coauthorIds = (coauthors || []).map(a => a.id);
      const { data: chapters } = coauthorIds.length > 0
        ? await supabase.from('chapters').select('id, author_id, status, deadline').in('author_id', coauthorIds)
        : { data: [] };

      const now = Date.now();
      const gestorMap = {};
      (gestorProfiles || []).forEach(g => { gestorMap[g.id] = g.name; });

      const projectMap = {};
      (participations || []).forEach(p => {
        if (p.projects) projectMap[p.user_id] = p.projects.name;
      });

      const enriched = (profiles || []).map(coord => {
        const coordAuthors = (coauthors || []).filter(a => a.coordinator_id === coord.id);
        const authorIds = coordAuthors.map(a => a.id);
        const coordChapters = (chapters || []).filter(c => authorIds.includes(c.author_id));

        const DELIVERED_STATUSES = ['APROVADO', 'PRODUCAO', 'FINALIZADO', 'CONCLUIDO'];
        const delivered = coordChapters.filter(c => DELIVERED_STATUSES.includes(c.status)).length;
        const inProgress = coordChapters.filter(c => !DELIVERED_STATUSES.includes(c.status)).length;

        return {
          ...coord,
          gestorName: gestorMap[coord.manager_id] || '—',
          authorsCount: coordAuthors.length,
          project_name: projectMap[coord.id] || null,
          delivered,
          inProgress,
        };
      });

      setCoordinators(enriched);
    } catch (err) {
      console.error('AdminCoordinatorsPage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoordinators(); }, [fetchCoordinators]);

  const gestors = [...new Set(
    coordinators.map(c => c.gestorName).filter(n => n && n !== '—')
  )].sort((a, b) => a.localeCompare(b));

  const filtered = coordinators.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term);
    const matchGestor = gestorFilter === 'ALL' || c.gestorName === gestorFilter;
    return matchSearch && matchGestor;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Helmet><title>Gestão de Coordenadores - NAB Platform</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Coordenadores</h1>
          <p className="text-slate-500 mt-1">Acompanhe a equipe e a produção dos coautores de cada coordenador.</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 font-medium">
          {coordinators.length} coordenador{coordinators.length !== 1 ? 'es' : ''} cadastrado{coordinators.length !== 1 ? 's' : ''}
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-9 bg-slate-50 border-slate-200 text-slate-900"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={gestorFilter} onValueChange={setGestorFilter}>
              <SelectTrigger className="w-full md:w-56 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Filtrar por Gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Gestores</SelectItem>
                {gestors.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Coordenador</th>
                  <th className="px-6 py-4">Gestor</th>
                  <th className="px-6 py-4">Projeto</th>
                  <th className="px-6 py-4 text-center">Coautores</th>
                  <th className="px-6 py-4 text-center">Caps. em Andamento</th>
                  <th className="px-6 py-4 text-center">Caps. Entregues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(coord => (
                  <tr key={coord.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/app/admin/coordinators/${coord.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {coord.avatar_url
                          ? <img src={coord.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="" />
                          : <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                              {(coord.name || 'C').charAt(0).toUpperCase()}
                            </div>
                        }
                        <div>
                          <p className="font-semibold text-slate-800">{coord.name}</p>
                          <p className="text-xs text-slate-400">{coord.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{coord.gestorName}</td>
                    <td className="px-6 py-4">
                      {coord.project_name
                        ? (() => {
                            const isSP = coord.project_name.toLowerCase().includes('paulo');
                            return (
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isSP ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {coord.project_name}
                              </span>
                            );
                          })()
                        : <span className="text-xs text-slate-300 italic">—</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-center text-slate-700 font-medium">{coord.authorsCount}</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-medium">{coord.inProgress}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-emerald-600 font-bold">{coord.delivered}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <UserSquare2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">Nenhum coordenador encontrado.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminCoordinatorsPage;
