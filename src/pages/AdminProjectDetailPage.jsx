
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ChevronRight, FolderKanban, Users, FileText, Calendar, TrendingUp } from 'lucide-react';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';

const AdminProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getTenantId } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const rawData = JSON.parse(localStorage.getItem('nab_data') || '{}');
    const tenantId = getTenantId();
    
    const proj = (rawData.projects || []).find(p => p.id === projectId && p.tenant_id === tenantId);
    if (!proj) return;

    const allUsers = (rawData.users || []).filter(u => u.tenant_id === tenantId);
    const chapters = (rawData.chapters || []).filter(c => c.project_id === projectId);
    
    const participants = allUsers.filter(u => proj.participants.includes(u.id));
    const coauthors = participants.filter(u => u.role === 'COAUTOR');
    
    const coordIds = [...new Set(coauthors.map(a => a.coordinator_id).filter(Boolean))];
    const coords = allUsers.filter(u => coordIds.includes(u.id));

    const enrichedChapters = chapters.map(c => ({
      ...c,
      authorName: coauthors.find(a => a.id === c.author_id)?.name || 'Desconhecido'
    }));

    const totalWords = chapters.reduce((sum, c) => sum + c.word_goal, 0);
    const writtenWords = chapters.reduce((sum, c) => sum + c.word_count, 0);
    const realProgress = totalWords > 0 ? Math.round((writtenWords / totalWords) * 100) : 0;
    
    const completedChapters = chapters.filter(c => ['APROVADO', 'FINALIZADO'].includes(c.status)).length;

    setData({
      proj: { ...proj, realProgress },
      coauthors,
      coords,
      chapters: enrichedChapters,
      metrics: { totalWords, writtenWords, completedChapters, totalChapters: chapters.length }
    });
  }, [projectId, getTenantId]);

  if (!data) return <div className="p-8 text-center">Carregando...</div>;

  const { proj, coauthors, coords, chapters, metrics } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Helmet><title>{proj.name} - NAB Admin</title></Helmet>

      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-2">
        <Link to="/app/projects" className="hover:text-blue-600 transition-colors">Projetos</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-800 font-medium">{proj.name}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/projects')}><ArrowLeft className="w-5 h-5"/></Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{proj.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{proj.type} • Início: {new Date(proj.start_date).toLocaleDateString('pt-BR')} • Fim: {new Date(proj.end_date).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 border border-slate-200 mb-6 p-1 rounded-lg w-full md:w-auto h-auto flex flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"><FolderKanban className="w-4 h-4 mr-2"/> Visão Geral</TabsTrigger>
          <TabsTrigger value="authors" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"><Users className="w-4 h-4 mr-2"/> Autores e Coords</TabsTrigger>
          <TabsTrigger value="chapters" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"><FileText className="w-4 h-4 mr-2"/> Capítulos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200"><CardContent className="p-5 flex flex-col justify-center items-center text-center"><TrendingUp className="w-8 h-8 text-blue-500 mb-2"/><p className="text-sm text-slate-500">Progresso Real</p><h3 className="text-3xl font-bold text-blue-600">{proj.realProgress}%</h3></CardContent></Card>
            <Card className="bg-white border-slate-200"><CardContent className="p-5 flex flex-col justify-center items-center text-center"><FileText className="w-8 h-8 text-emerald-500 mb-2"/><p className="text-sm text-slate-500">Capítulos Finalizados</p><h3 className="text-3xl font-bold text-emerald-600">{metrics.completedChapters} / {metrics.totalChapters}</h3></CardContent></Card>
            <Card className="bg-white border-slate-200"><CardContent className="p-5 flex flex-col justify-center items-center text-center"><Users className="w-8 h-8 text-purple-500 mb-2"/><p className="text-sm text-slate-500">Total Coautores</p><h3 className="text-3xl font-bold text-purple-600">{coauthors.length}</h3></CardContent></Card>
            <Card className="bg-white border-slate-200"><CardContent className="p-5 flex flex-col justify-center items-center text-center"><Calendar className="w-8 h-8 text-orange-500 mb-2"/><p className="text-sm text-slate-500">Palavras Escritas</p><h3 className="text-2xl font-bold text-orange-600">{metrics.writtenWords.toLocaleString('pt-BR')}</h3></CardContent></Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Progresso da Obra</CardTitle></CardHeader>
            <CardContent>
              <Progress value={proj.realProgress} className="h-4" indicatorColor="bg-blue-500" />
              <div className="flex justify-between mt-2 text-sm font-medium text-slate-500">
                <span>Início Literário</span>
                <span>Metade</span>
                <span>Finalização</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authors">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100"><CardTitle className="text-lg">Coautores ({coauthors.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {coauthors.map(a => (
                    <div key={a.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{a.name}</span>
                      <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => navigate(`/app/admin/coauthors/${a.id}`)}>Ver</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100"><CardTitle className="text-lg">Coordenadores Envolvidos ({coords.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {coords.map(c => (
                    <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => navigate(`/app/admin/coordinators/${c.id}`)}>Ver</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chapters">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-4">Capítulo</th>
                    <th className="px-4 py-4">Autor</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-4 py-4 text-center">Palavras</th>
                    <th className="px-4 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chapters.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-800">{c.title}</td>
                      <td className="px-4 py-4 text-slate-600">{c.authorName}</td>
                      <td className="px-4 py-4 text-center"><ChapterStatusBadge status={c.status} /></td>
                      <td className="px-4 py-4 text-center text-slate-500">{c.word_count} / {c.word_goal}</td>
                      <td className="px-4 py-4 text-center">
                        <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/app/admin/chapters/${c.id}/review`)}>Revisar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProjectDetailPage;
