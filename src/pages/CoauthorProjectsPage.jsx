
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Users, ExternalLink, FileText, Edit3, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CHAPTER_STATUS = {
  RASCUNHO: { label: 'Rascunho', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: Edit3 },
  EM_EDICAO: { label: 'Em edição', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: Edit3 },
  ENVIADO_PARA_REVISAO: { label: 'Em Revisão', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  EM_REVISAO: { label: 'Em Revisão', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  AJUSTES_SOLICITADOS: { label: 'Ajustes Solicitados', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', icon: AlertCircle },
  APROVADO: { label: 'Aprovado', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  FINALIZADO: { label: 'Concluído', color: '#6366F1', bg: 'rgba(99,102,241,0.1)', icon: CheckCircle },
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
    const fetchData = async () => {
      try {
        // Fetch current user's profile to get coordinator_id
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('coordinator_id')
          .eq('id', user.id)
          .single();

        // Fetch coordinator's name
        if (myProfile?.coordinator_id) {
          const { data: coord } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', myProfile.coordinator_id)
            .single();
          if (coord?.name) setCoordinatorName(coord.name);
        }

        // Projects
        const { data: participations, error } = await supabase
          .from('project_participants')
          .select('project_id, projects(*)')
          .eq('user_id', user.id);

        if (error) throw error;
        const projs = participations?.map(p => p.projects).filter(Boolean) || [];
        setProjects(projs);

        // My chapters (one per project typically)
        const { data: myChapters } = await supabase
          .from('chapters')
          .select('*')
          .eq('author_id', user.id);

        // Map chapters by project_id for easy lookup
        const chapMap = {};
        (myChapters || []).forEach(ch => {
          if (ch.project_id) chapMap[ch.project_id] = ch;
        });
        setChaptersByProject(chapMap);

        // If there's one chapter without a project, use for display
        const unlinked = (myChapters || []).find(ch => !ch.project_id);
        if (unlinked) setMyChapter(unlinked);

      } catch (err) {
        console.error('CoauthorProjectsPage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" />
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
      <div
        className="mt-4 rounded-xl p-4 border"
        style={{ backgroundColor: cfg.bg, borderColor: `${cfg.color}30` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: cfg.color }} />
            <span className="text-sm font-semibold text-slate-700">Meu Capítulo</span>
          </div>
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
            style={{ color: cfg.color, backgroundColor: `${cfg.color}20` }}
          >
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        </div>

        <p className="text-sm text-slate-700 font-medium mb-2 truncate">{chapter.title || 'Sem título'}</p>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progresso da escrita</span>
            <span className="font-semibold">{wordCount.toLocaleString()} / {wordGoal.toLocaleString()} palavras ({progress}%)</span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: cfg.color }}
            />
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => navigate(`/coauthor/chapters/${chapter.id}/edit`)}
          className="w-full text-white text-xs font-semibold"
          style={{ backgroundColor: cfg.color }}
        >
          {isEditable ? <><Edit3 className="w-3.5 h-3.5 mr-1.5" /> Continuar escrevendo</> : <><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Ver meu capítulo</>}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meu Projeto - NAB Platform</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Meu Projeto</h1>
        <p className="text-slate-500">Acompanhe o projeto literário do qual você faz parte.</p>
      </div>

      {/* Se não tem projetos vinculados mas tem capítulo, mostrar o capítulo solto */}
      {projects.length === 0 && myChapter && (
        <div className="max-w-xl">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Novos Autores do Brasil</h3>
              <p className="text-sm text-slate-500 mb-2">Projeto de coautoria</p>
              {renderChapterStatus(myChapter)}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map(project => {
          const chapter = chaptersByProject[project.id];
          return (
            <Card key={project.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden flex flex-col">
              <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{project.type || 'Projeto'}</Badge>
                  <Badge className={project.status === 'ativo' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-none' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-none'}>
                    {project.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {project.name || 'Projeto sem nome'}
                </h3>

                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span><strong>Início:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span><strong>Término:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p><strong>Coordenador</strong> — {coordinatorName}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-600">Progresso do Projeto</span>
                    <span className="text-blue-600">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-1.5 bg-slate-100 mb-4" indicatorColor="bg-blue-500" />

                  {/* Chapter status block */}
                  {renderChapterStatus(chapter)}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {projects.length === 0 && !myChapter && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="font-medium">Você ainda não está participando de nenhum projeto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoauthorProjectsPage;
