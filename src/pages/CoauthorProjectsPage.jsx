
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { BookOpen, Calendar, Users, ExternalLink, FileText, Edit3, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BtnPrimary, BtnOutline } from '@/lib/brand';

const CHAPTER_STATUS = {
  RASCUNHO:             { label: 'Rascunho',          color: BLUE,      bg: `${BLUE}12`,                   icon: Edit3 },
  EM_EDICAO:            { label: 'Em edição',          color: BLUE,      bg: `${BLUE}12`,                   icon: Edit3 },
  ENVIADO_PARA_REVISAO: { label: 'Em Revisão',         color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',        icon: Clock },
  EM_REVISAO:           { label: 'Em Revisão',         color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',        icon: Clock },
  AJUSTES_SOLICITADOS:  { label: 'Ajustes Solicitados',color: '#FF6B35', bg: 'rgba(255,107,53,0.10)',        icon: AlertCircle },
  APROVADO:             { label: 'Aprovado',           color: '#10B981', bg: 'rgba(16,185,129,0.10)',        icon: CheckCircle },
  FINALIZADO:           { label: 'Concluído',          color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)',        icon: CheckCircle },
};

const CoauthorProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [chaptersByProject, setChaptersByProject] = useState({});
  const [myChapter, setMyChapter] = useState(null);
  const [coordinatorName, setCoordinatorName] = useState('Atribuído pela plataforma');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data: myProfile } = await supabase.from('profiles').select('coordinator_id').eq('id', user.id).single();
        if (myProfile?.coordinator_id) {
          const { data: coord } = await supabase.from('profiles').select('name').eq('id', myProfile.coordinator_id).single();
          if (coord?.name) setCoordinatorName(coord.name);
        }
        const { data: participations, error } = await supabase.from('project_participants').select('project_id, projects(*)').eq('user_id', user.id);
        if (error) throw error;
        const projs = participations?.map(p => p.projects).filter(Boolean) || [];
        setProjects(projs);
        const { data: myChapters } = await supabase.from('chapters').select('*').eq('author_id', user.id);
        const chapMap = {};
        (myChapters || []).forEach(ch => { if (ch.project_id) chapMap[ch.project_id] = ch; });
        setChaptersByProject(chapMap);
        const unlinked = (myChapters || []).find(ch => !ch.project_id);
        if (unlinked) setMyChapter(unlinked);
      } catch (err) {
        console.error('CoauthorProjectsPage fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  const renderChapterStatus = (chapter) => {
    if (!chapter) return null;
    const cfg = CHAPTER_STATUS[chapter.status] || CHAPTER_STATUS['RASCUNHO'];
    const Icon = cfg.icon;
    const wordCount = chapter.word_count || 0;
    const wordGoal = chapter.word_goal || 5000;
    const progress = Math.min(Math.round((wordCount / wordGoal) * 100), 100);
    const isEditable = ['RASCUNHO', 'EM_EDICAO', 'AJUSTES_SOLICITADOS'].includes(chapter.status);

    return (
      <div className="mt-4 rounded-xl p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: cfg.color }} />
            <span className="text-sm font-semibold" style={{ color: NAV }}>Meu Capítulo</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full" style={{ color: cfg.color, background: `${cfg.color}20` }}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        </div>
        <p className="text-sm font-medium mb-3 truncate" style={{ color: NAV }}>{chapter.title || 'Sem título'}</p>
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: `${NAV}85` }}>
            <span>Progresso da escrita</span>
            <span className="font-semibold">{wordCount.toLocaleString()} / {wordGoal.toLocaleString()} ({progress}%)</span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.6)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, background: cfg.color }} />
          </div>
        </div>
        {isEditable
          ? <BtnPrimary onClick={() => navigate(`/coauthor/chapters/${chapter.id}/edit`)} icon={Edit3} label="Continuar escrevendo" className="w-full justify-center" />
          : <BtnOutline onClick={() => navigate(`/coauthor/chapters/${chapter.id}/edit`)} icon={ExternalLink} label="Ver meu capítulo" color={cfg.color} className="w-full justify-center" />
        }
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meu Projeto — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Meu Projeto</h1>
        <p className="text-sm" style={{ color: `${NAV}85` }}>Acompanhe o projeto literário do qual você faz parte.</p>
      </div>

      {projects.length === 0 && myChapter && (
        <div className="max-w-xl">
          <BrandCard>
            <div className="h-1.5 w-full rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${BLUE}, ${RED})` }} />
            <div className="p-6">
              <h3 className="text-lg font-bold mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Novos Autores do Brasil</h3>
              <p className="text-sm" style={{ color: `${NAV}85` }}>Projeto de coautoria</p>
              {renderChapterStatus(myChapter)}
            </div>
          </BrandCard>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map(project => {
          const chapter = chaptersByProject[project.id];
          return (
            <BrandCard key={project.id} className="flex flex-col hover:shadow-md transition-shadow">
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${BLUE}, ${RED})` }} />
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: `${BLUE}12`, color: BLUE }}>
                    {project.type || 'Projeto'}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={project.status === 'ativo'
                      ? { background: 'rgba(16,185,129,0.10)', color: '#10B981' }
                      : { background: `${NAV}08`, color: `${NAV}85` }
                    }>
                    {project.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-4 line-clamp-2" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                  {project.name || 'Projeto sem nome'}
                </h3>

                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm" style={{ color: `${NAV}70` }}>
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: `${NAV}70` }} />
                    <span><strong>Início:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: `${NAV}70` }}>
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: `${NAV}70` }} />
                    <span><strong>Término:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm" style={{ color: `${NAV}70` }}>
                    <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: `${NAV}70` }} />
                    <p><strong>Coordenador</strong> — {coordinatorName}</p>
                  </div>
                </div>

                <div className="pt-4 mt-auto" style={{ borderTop: `1px solid ${NAV}0A` }}>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span style={{ color: `${NAV}85` }}>Progresso do Projeto</span>
                    <span style={{ color: BLUE }}>{project.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: `${NAV}10` }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${project.progress || 0}%`, background: BLUE }} />
                  </div>
                  {renderChapterStatus(chapter)}
                </div>
              </div>
            </BrandCard>
          );
        })}

        {projects.length === 0 && !myChapter && (
          <div className="col-span-full py-12 text-center rounded-2xl border-2 border-dashed"
            style={{ borderColor: `${NAV}12`, background: 'white' }}>
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: `${NAV}25` }} />
            <p className="font-medium" style={{ color: `${NAV}85` }}>Você ainda não está participando de nenhum projeto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoauthorProjectsPage;
