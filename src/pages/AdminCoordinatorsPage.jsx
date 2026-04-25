import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, UserSquare2, Users } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader } from '@/lib/brand';

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
        .from('profiles').select('id, name, email, avatar_url, role, coordinator_id, manager_id')
        .eq('role', 'COORDENADOR').order('name');
      if (error) throw error;

      const ids = (profiles || []).map(p => p.id);
      if (ids.length === 0) { setCoordinators([]); return; }

      const [{ data: coauthors }, { data: participations }, { data: gestorProfiles }] = await Promise.all([
        supabase.from('profiles').select('id, coordinator_id').in('coordinator_id', ids),
        supabase.from('project_participants').select('user_id, projects(id, name)').in('user_id', ids),
        supabase.from('profiles').select('id, name').in('id', (profiles || []).map(p => p.manager_id).filter(Boolean)),
      ]);

      const coauthorIds = (coauthors || []).map(a => a.id);
      const { data: chapters } = coauthorIds.length > 0
        ? await supabase.from('chapters').select('id, author_id, status, deadline').in('author_id', coauthorIds)
        : { data: [] };

      const gestorMap = {};
      (gestorProfiles || []).forEach(g => { gestorMap[g.id] = g.name; });
      const projectMap = {};
      (participations || []).forEach(p => { if (p.projects) projectMap[p.user_id] = p.projects.name; });

      const DELIVERED_STATUSES = ['APROVADO', 'PRODUCAO', 'FINALIZADO', 'CONCLUIDO'];
      setCoordinators((profiles || []).map(coord => {
        const coordAuthors = (coauthors || []).filter(a => a.coordinator_id === coord.id);
        const authorIds = coordAuthors.map(a => a.id);
        const coordChapters = (chapters || []).filter(c => authorIds.includes(c.author_id));
        return {
          ...coord,
          gestorName: gestorMap[coord.manager_id] || '—',
          authorsCount: coordAuthors.length,
          project_name: projectMap[coord.id] || null,
          delivered: coordChapters.filter(c => DELIVERED_STATUSES.includes(c.status)).length,
          inProgress: coordChapters.filter(c => !DELIVERED_STATUSES.includes(c.status)).length,
        };
      }));
    } catch (err) {
      console.error('AdminCoordinatorsPage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoordinators(); }, [fetchCoordinators]);

  const gestors = [...new Set(coordinators.map(c => c.gestorName).filter(n => n && n !== '—'))].sort((a, b) => a.localeCompare(b));

  const filtered = coordinators.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (c.name || '').toLowerCase().includes(term) || (c.email || '').toLowerCase().includes(term);
    const matchGestor = gestorFilter === 'ALL' || c.gestorName === gestorFilter;
    return matchSearch && matchGestor;
  });

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Gestão de Coordenadores — Novos Autores do Brasil</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Coordenadores</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Acompanhe a equipe e a produção dos coautores de cada coordenador.</p>
        </div>
        <span className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: `${BLUE}12`, color: BLUE, border: `1px solid ${BLUE}25` }}>
          {coordinators.length} cadastrado{coordinators.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-white" style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9 text-sm"
            style={{ borderColor: `${NAV}20`, color: NAV, background: `${NAV}04` }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={gestorFilter} onValueChange={setGestorFilter}>
          <SelectTrigger className="w-full md:w-56 text-sm bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
            <SelectValue placeholder="Filtrar por Líder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Líderes</SelectItem>
            {gestors.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <BrandCard>
        <BrandCardHeader icon={Users} iconColor={BLUE} accentColor={BLUE} title={`${filtered.length} coordenador${filtered.length !== 1 ? 'es' : ''}`} />
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr style={{ background: `${NAV}04`, borderBottom: `1px solid ${NAV}0C` }}>
                  {['Coordenador', 'Líder', 'Projeto', 'Coautores', 'Em Andamento', 'Entregues'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider ${i >= 3 ? 'text-center' : 'text-left'}`}
                      style={{ color: `${NAV}50` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(coord => (
                  <tr
                    key={coord.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid ${NAV}08` }}
                    onClick={() => navigate(`/app/admin/coordinators/${coord.id}`)}
                    onMouseEnter={e => { e.currentTarget.style.background = `${NAV}04`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {coord.avatar_url
                          ? <img src={coord.avatar_url} className="h-8 w-8 rounded-full object-cover shrink-0" alt="" />
                          : <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: `${BLUE}15`, color: BLUE }}>
                              {(coord.name || 'C').charAt(0).toUpperCase()}
                            </div>
                        }
                        <div>
                          <p className="font-semibold" style={{ color: NAV }}>{coord.name}</p>
                          <p className="text-xs" style={{ color: `${NAV}50` }}>{coord.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: `${NAV}70` }}>{coord.gestorName}</td>
                    <td className="px-6 py-4">
                      {coord.project_name ? (
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={
                            coord.project_name.toLowerCase().includes('paulo')
                              ? { background: `${BLUE}12`, color: BLUE }
                              : { background: `${RED}12`, color: RED }
                          }
                        >
                          {coord.project_name}
                        </span>
                      ) : <span style={{ color: `${NAV}30` }}>—</span>}
                    </td>
                    <td className="px-6 py-4 text-center font-medium" style={{ color: NAV }}>{coord.authorsCount}</td>
                    <td className="px-6 py-4 text-center font-bold" style={{ color: BLUE }}>{coord.inProgress}</td>
                    <td className="px-6 py-4 text-center font-bold" style={{ color: '#10B981' }}>{coord.delivered}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <UserSquare2 className="h-12 w-12 mx-auto mb-3" style={{ color: `${NAV}20` }} />
                      <p style={{ color: `${NAV}50` }}>Nenhum coordenador encontrado.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </BrandCard>
    </div>
  );
};

export default AdminCoordinatorsPage;
