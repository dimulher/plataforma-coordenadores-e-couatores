import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';
import { ChapterDeadlineIndicator } from '@/components/ChapterDeadlineIndicator';
import { ArrowLeft, BookOpen, Clock, FileEdit, Mail, ChevronRight } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BtnOutline } from '@/lib/brand';

const AdminCoauthorDetailPage = () => {
  const { coauthorId } = useParams();
  const navigate = useNavigate();
  const { getTenantId } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const rawData = JSON.parse(localStorage.getItem('nab_data') || '{}');
    const tenantId = getTenantId();

    const author = (rawData.users || []).find(u => u.id === coauthorId && u.tenant_id === tenantId);
    if (!author) return;

    const coord = (rawData.users || []).find(u => u.id === author.coordinator_id);
    const authorProjects = (rawData.projects || []).filter(p => p.tenant_id === tenantId && p.participants.includes(author.id));
    const authorChapters = (rawData.chapters || []).filter(c => c.tenant_id === tenantId && c.author_id === author.id);

    let activities = [];
    authorChapters.forEach(c => {
      if (c.versions) {
        c.versions.forEach(v => {
          activities.push({ date: v.date, action: `Salvou versão: ${v.type}`, chapter: c.title });
        });
      } else {
        activities.push({ date: c.updated_at, action: 'Atualizou capítulo', chapter: c.title });
      }
    });
    activities = activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    setData({ author, coord, projects: authorProjects, chapters: authorChapters, activities });
  }, [coauthorId, getTenantId]);

  if (!data) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  const { author, coord, projects, chapters, activities } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <Helmet><title>{author.name} — Novos Autores do Brasil</title></Helmet>

      {/* Breadcrumb */}
      <div className="flex items-center text-sm gap-2" style={{ color: `${NAV}75` }}>
        <Link to="/app/admin/coauthors" className="transition-colors" style={{ color: `${NAV}75` }}
          onMouseEnter={e => { e.currentTarget.style.color = BLUE; }}
          onMouseLeave={e => { e.currentTarget.style.color = `${NAV}75`; }}
        >Coautores</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium" style={{ color: NAV }}>{author.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4" style={{ borderBottom: `1px solid ${NAV}0A` }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/admin/coauthors')}
            className="p-2 rounded-xl transition-colors"
            style={{ color: `${NAV}75` }}
            onMouseEnter={e => { e.currentTarget.style.background = `${NAV}08`; e.currentTarget.style.color = NAV; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = `${NAV}75`; }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{author.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: `${NAV}80` }}>
              <span>Coordenador: {coord?.name || 'Nenhum'}</span>
              <span>•</span>
              <span>Cadastrado em: {new Date(author.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
        <BtnOutline icon={Mail} label="Enviar Mensagem" color={NAV} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Projetos + Atividade */}
        <div className="space-y-6 lg:col-span-1">
          {/* Projetos */}
          <BrandCard>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${NAV}08` }}>
              <BookOpen className="w-4 h-4" style={{ color: BLUE }} />
              <h3 className="font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Projetos Alocados</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {projects.map(p => (
                <div key={p.id} className="rounded-xl p-3" style={{ background: `${NAV}04`, border: `1px solid ${NAV}08` }}>
                  <h4 className="font-semibold text-sm" style={{ color: NAV }}>{p.name}</h4>
                  <div className="flex justify-between items-center mt-2 text-xs" style={{ color: `${NAV}80` }}>
                    <span>Prazo: {new Date(p.end_date).toLocaleDateString('pt-BR')}</span>
                    <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: `${BLUE}12`, color: BLUE }}>{p.type}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-medium mb-1" style={{ color: `${NAV}85` }}>
                      <span>Progresso</span>
                      <span style={{ color: BLUE }}>{p.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: `${NAV}10` }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%`, background: BLUE }} />
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-sm text-center py-2" style={{ color: `${NAV}72` }}>Nenhum projeto alocado.</p>}
            </div>
          </BrandCard>

          {/* Atividade */}
          <BrandCard>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${NAV}08` }}>
              <Clock className="w-4 h-4" style={{ color: '#8B5CF6' }} />
              <h3 className="font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Atividade Recente</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                {activities.map((act, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ background: '#8B5CF6' }} />
                      {i < activities.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: `${NAV}10` }} />}
                    </div>
                    <div className="pb-3 flex-1">
                      <p className="text-xs font-bold" style={{ color: NAV }}>{act.chapter}</p>
                      <p className="text-xs" style={{ color: `${NAV}85` }}>{act.action}</p>
                      <p className="text-[10px] mt-0.5 font-mono" style={{ color: `${NAV}70` }}>{new Date(act.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-sm text-center py-2" style={{ color: `${NAV}72` }}>Nenhuma atividade registrada.</p>}
              </div>
            </div>
          </BrandCard>
        </div>

        {/* Right: Capítulos */}
        <div className="lg:col-span-2">
          <BrandCard className="h-full">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${NAV}08` }}>
              <h3 className="font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Capítulos Sob Responsabilidade</h3>
            </div>
            <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
              {chapters.map(chap => {
                const progress = chap.word_goal > 0 ? Math.min(100, Math.round((chap.word_count / chap.word_goal) * 100)) : 0;
                return (
                  <div key={chap.id} className="p-5 transition-colors"
                    onMouseEnter={e => { e.currentTarget.style.background = `${NAV}03`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                      <div>
                        <h4 className="font-semibold text-lg" style={{ color: NAV }}>{chap.title}</h4>
                        <p className="text-xs mt-0.5" style={{ color: `${NAV}75` }}>
                          Projeto: {projects.find(p => p.id === chap.project_id)?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ChapterStatusBadge status={chap.status} />
                        <BtnOutline
                          onClick={() => navigate(`/app/admin/chapters/${chap.id}/review`)}
                          icon={FileEdit} label="Revisar / Ver" color={BLUE}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-4">
                      <div className="p-3 rounded-xl" style={{ background: `${NAV}04`, border: `1px solid ${NAV}08` }}>
                        <div className="flex justify-between text-xs font-medium mb-1.5" style={{ color: `${NAV}70` }}>
                          <span>Progresso da Escrita</span>
                          <span style={{ color: BLUE }}>{chap.word_count} / {chap.word_goal} pal. ({progress}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full" style={{ background: `${NAV}10` }}>
                          <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, background: '#10B981' }} />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <ChapterDeadlineIndicator deadline={chap.deadline} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {chapters.length === 0 && (
                <p className="p-8 text-center" style={{ color: `${NAV}72` }}>Nenhum capítulo atribuído.</p>
              )}
            </div>
          </BrandCard>
        </div>
      </div>
    </div>
  );
};

export default AdminCoauthorDetailPage;
