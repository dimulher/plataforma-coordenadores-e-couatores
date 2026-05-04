import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Users, Search, Copy, Check, UserSquare2 } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader, BtnPrimary } from '@/lib/brand';

const GestorCoordinatorsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [coordinators, setCoordinators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [projects, setProjects] = useState([]);

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
        const { data, error } = await supabase.rpc('get_my_coordinators');
        if (error) throw error;
        const coords = data || [];

        if (coords.length > 0) {
          const coordIds = coords.map(c => c.id);
          const [{ data: stats }, { data: participations }] = await Promise.all([
            supabase.rpc('get_team_stats'),
            supabase.from('project_participants').select('user_id, projects(id, name)').in('user_id', coordIds),
          ]);

          const statsMap = {};
          (stats || []).forEach(s => { statsMap[s.coordinator_id] = s; });

          const projectMap = {};
          (participations || []).forEach(p => { if (p.projects) projectMap[p.user_id] = p.projects.name; });

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

  const filtered = coordinators.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'C';

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meus Coordenadores — Novos Autores do Brasil</title></Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Meus Coordenadores</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Gerencie e acompanhe o desempenho dos seus coordenadores.</p>
        </div>
        <BtnPrimary onClick={() => setInviteOpen(v => !v)} icon={UserSquare2} label="Convidar Coordenador" />
      </div>

      {/* Modal de convite */}
      {inviteOpen && (
        <BrandCard>
          <BrandCardHeader icon={UserSquare2} iconColor={BLUE} accentColor={BLUE} title="Links de Convite" />
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm" style={{ color: `${NAV}70` }}>
              Compartilhe o link do projeto com o novo coordenador. Ele será vinculado ao seu time ao se cadastrar.
            </p>
            {projects.length === 0
              ? <p className="text-sm italic text-center py-4" style={{ color: `${NAV}70` }}>Nenhum projeto ativo encontrado.</p>
              : projects.map(proj => {
                  const link = `${window.location.origin}/register/coordinator/${user?.id}/${proj.id}`;
                  const isSP = proj.name.toLowerCase().includes('paulo');
                  const isPT = proj.name.toLowerCase().includes('portugal');
                  const labelStyle = isSP
                    ? { color: '#009C3B', background: 'rgba(0,156,59,0.10)', border: '1.5px solid rgba(0,156,59,0.25)' }
                    : isPT
                    ? { color: '#CC0000', background: 'rgba(204,0,0,0.08)', border: '1.5px solid rgba(204,0,0,0.20)' }
                    : { color: `${NAV}85`, background: `${NAV}06`, border: `1.5px solid ${NAV}12` };
                  return (
                    <div key={proj.id} className="space-y-1.5">
                      <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={labelStyle}>{proj.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          value={link} readOnly
                          className="flex-1 px-3 py-2 rounded-xl text-xs font-mono"
                          style={{ border: `1.5px solid ${NAV}15`, color: `${NAV}70`, background: `${NAV}04`, outline: 'none' }}
                        />
                        <button
                          onClick={() => copyLink(link, proj.id)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{ background: copiedId === proj.id ? 'rgba(16,185,129,0.12)' : BLUE, color: copiedId === proj.id ? '#10B981' : 'white' }}
                        >
                          {copiedId === proj.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })
            }
            <div className="mt-2 p-4 rounded-xl" style={{ background: `${BLUE}08`, border: `1px solid ${BLUE}20` }}>
              <p className="text-xs leading-relaxed font-medium" style={{ color: BLUE }}>
                <strong>Importante:</strong> Cada link é exclusivo para o projeto. O coordenador será vinculado ao seu time ao se cadastrar.
              </p>
            </div>
          </div>
        </BrandCard>
      )}

      {/* Tabela */}
      <BrandCard>
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${NAV}08` }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}70` }} />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-9 bg-white text-sm"
              style={{ borderColor: `${NAV}20`, color: NAV }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: `${NAV}04` }}>
                {['Coordenador', 'Projeto', 'Leads', 'Coautores'].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}75` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(coord => (
                <tr
                  key={coord.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderTop: `1px solid ${NAV}08` }}
                  onClick={() => navigate(`/manager/coordinators/${coord.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.background = `${NAV}04`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9" style={{ border: `1.5px solid ${BLUE}25` }}>
                        {coord.avatar_url && <AvatarImage src={coord.avatar_url} />}
                        <AvatarFallback style={{ background: `${BLUE}15`, color: BLUE, fontWeight: 700, fontSize: '0.8rem' }}>
                          {getInitials(coord.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: NAV }}>{coord.name}</p>
                        <p className="text-xs" style={{ color: `${NAV}75` }}>{coord.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {coord.project_name ? (() => {
                      const isSP = coord.project_name.toLowerCase().includes('paulo');
                      return (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={isSP
                          ? { background: `${BLUE}12`, color: BLUE }
                          : { background: `${RED}12`, color: RED }
                        }>
                          {coord.project_name}
                        </span>
                      );
                    })() : <span className="text-xs italic" style={{ color: `${NAV}55` }}>—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: `${BLUE}10`, color: BLUE }}>{coord.leads}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.10)', color: '#10B981' }}>{coord.coautores}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <Users className="h-12 w-12 mx-auto mb-3" style={{ color: `${NAV}20` }} />
                    <p className="font-medium" style={{ color: `${NAV}75` }}>Nenhum coordenador encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BrandCard>
    </div>
  );
};

export default GestorCoordinatorsPage;
