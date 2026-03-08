
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';
import { ChapterDeadlineIndicator } from '@/components/ChapterDeadlineIndicator';
import { ArrowLeft, BookOpen, Clock, FileEdit, Mail, ChevronRight } from 'lucide-react';

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

    // Get latest activity (mocking from versions or updated_at)
    let activities = [];
    authorChapters.forEach(c => {
      if (c.versions) {
        c.versions.forEach(v => {
          activities.push({
            date: v.date,
            action: `Salvou versão: ${v.type}`,
            chapter: c.title
          });
        });
      } else {
        activities.push({
          date: c.updated_at,
          action: `Atualizou capítulo`,
          chapter: c.title
        });
      }
    });
    activities = activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    setData({ author, coord, projects: authorProjects, chapters: authorChapters, activities });
  }, [coauthorId, getTenantId]);

  if (!data) return <div className="p-8 text-center">Carregando...</div>;

  const { author, coord, projects, chapters, activities } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Helmet><title>{author.name} - NAB Admin</title></Helmet>

      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-2">
        <Link to="/app/admin/coauthors" className="hover:text-blue-600 transition-colors">Coautores</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-800 font-medium">{author.name}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/admin/coauthors')}><ArrowLeft className="w-5 h-5"/></Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{author.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>Coordenador: {coord?.name || 'Nenhum'}</span>
              <span>•</span>
              <span>Cadastrado em: {new Date(author.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
        <Button className="bg-[#0E1A32] hover:bg-slate-800 text-white"><Mail className="w-4 h-4 mr-2"/> Enviar Mensagem</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info & Activity */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500"/> Projetos Alocados</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {projects.map(p => (
                <div key={p.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                  <h4 className="font-semibold text-slate-800 text-sm">{p.name}</h4>
                  <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                    <span>Prazo Final: {new Date(p.end_date).toLocaleDateString('pt-BR')}</span>
                    <Badge variant="outline" className="bg-white">{p.type}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-medium mb-1"><span className="text-slate-600">Progresso Geral</span><span className="text-blue-600">{p.progress}%</span></div>
                    <Progress value={p.progress} className="h-1.5" indicatorColor="bg-blue-500" />
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-sm text-slate-500 text-center py-2">Nenhum projeto alocado.</p>}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-purple-500"/> Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {activities.map((act, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-500 text-slate-50 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-100 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-800 text-xs">{act.chapter}</div>
                        <time className="font-mono text-[10px] text-slate-500">{new Date(act.date).toLocaleDateString('pt-BR')}</time>
                      </div>
                      <div className="text-xs text-slate-600">{act.action}</div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-sm text-slate-500 text-center py-2 relative z-10 bg-white">Nenhuma atividade registrada.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chapters */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-slate-800">Capítulos Sob Responsabilidade</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {chapters.map(chap => {
                  const progress = chap.word_goal > 0 ? Math.min(100, Math.round((chap.word_count / chap.word_goal) * 100)) : 0;
                  return (
                    <div key={chap.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-800 text-lg">{chap.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Projeto: {projects.find(p => p.id === chap.project_id)?.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <ChapterStatusBadge status={chap.status} />
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => navigate(`/app/admin/chapters/${chap.id}/review`)}>
                            <FileEdit className="w-4 h-4 mr-1"/> Revisar / Ver
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex justify-between text-xs font-medium mb-1.5 text-slate-700">
                            <span>Progresso da Escrita</span>
                            <span>{chap.word_count} / {chap.word_goal} pal. ({progress}%)</span>
                          </div>
                          <Progress value={progress} className="h-2" indicatorColor="bg-emerald-500" />
                        </div>
                        <div className="flex justify-end">
                          <ChapterDeadlineIndicator deadline={chap.deadline} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {chapters.length === 0 && <p className="p-8 text-center text-slate-500">Nenhum capítulo atribuído.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminCoauthorDetailPage;
