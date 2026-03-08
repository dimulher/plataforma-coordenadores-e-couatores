import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCoauthorMetrics } from '@/hooks/useCoauthorMetrics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { JourneyTimeline } from '@/components/JourneyTimeline';
import { BookOpen, Calendar, Video, Edit3 } from 'lucide-react';

const CoauthorDashboard = () => {
  const { metrics, loading, refresh } = useCoauthorMetrics();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signing, setSigning] = useState(false);

  const handleSignContract = async () => {
    if (!user?.id) return;
    setSigning(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          contract_status: 'ASSINADO',
          contract_signed_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Contrato assinado com sucesso.",
      });

      await refreshProfile();
      if (refresh) refresh();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível assinar o contrato.",
        variant: "destructive"
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div></div>;

  const { project, chapter, mentorship } = metrics || {};
  const wordProgress = chapter?.word_goal ? Math.min(((chapter.word_count || 0) / chapter.word_goal) * 100, 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      <Helmet><title>Dashboard do Autor - NAB Platform</title></Helmet>

      {/* Welcome Banner */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo, {user?.name || 'Autor'}! 👋</h1>
          <p className="text-blue-100 text-lg">Vamos continuar sua jornada de publicação.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Chapter & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Meu Capítulo (Main Section) */}
          <Card className="border-blue-200 shadow-md bg-blue-50/30">
            <CardHeader className="pb-4 border-b border-blue-100">
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-500" /> Meu Capítulo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {chapter ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-800">{chapter.title || 'Capítulo sem título'}</h3>
                    <Button
                      onClick={() => navigate(`/coauthor/chapters/${chapter.id}/edit`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-10 px-6 font-semibold shrink-0"
                    >
                      <Edit3 className="h-4 w-4 mr-2" /> Continuar Escrevendo
                    </Button>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="text-3xl font-bold text-blue-600 tracking-tight">{chapter.word_count != null ? chapter.word_count.toLocaleString('pt-BR') : 0}</span>
                        <span className="text-slate-400 ml-2 font-medium">palavras escritas</span>
                      </div>
                      <span className="text-sm text-slate-500 font-medium">Meta: {chapter.word_goal != null ? chapter.word_goal.toLocaleString('pt-BR') : 0}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={wordProgress} className="h-3 flex-1 bg-slate-100" indicatorColor="bg-blue-500" />
                      <span className="text-sm font-bold text-slate-700 w-10 text-right">{Math.round(wordProgress)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 py-4">Nenhum capítulo atribuído.</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          {chapter && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-6">
                <h4 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider text-center">Sua Jornada da Publicação</h4>
                <JourneyTimeline currentStage={chapter.current_stage || 'Contrato'} />
              </CardContent>
            </Card>
          )}

          {/* Meu Contrato (Replacing Projeto Atual) */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-500" /> Meu Contrato</span>
                <Badge className={`${(user?.contract_status === 'ASSINADO') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} border-none uppercase text-[10px]`}>
                  {(user?.contract_status === 'ASSINADO') ? 'Assinado' : 'Pendente'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Contrato de Coautoria</h4>
                    <p className="text-sm text-slate-500">
                      {(user?.contract_status === 'ASSINADO')
                        ? `Assinado em ${new Date(user.contract_signed_at).toLocaleDateString('pt-BR')}`
                        : 'O contrato foi enviado para sua assinatura.'}
                    </p>
                  </div>
                </div>

                <Button
                  variant={(user?.contract_status === 'ASSINADO') ? "outline" : "default"}
                  onClick={() => {
                    if (user?.contract_url) {
                      window.open(user.contract_url, '_blank');
                    }
                    if (user?.contract_status !== 'ASSINADO') {
                      handleSignContract();
                    }
                  }}
                  disabled={signing}
                  className={(user?.contract_status === 'ASSINADO') ? "border-blue-200 text-blue-700 hover:bg-blue-50" : "bg-blue-600 hover:bg-blue-700"}
                >
                  {signing ? 'Assinando...' : (user?.contract_status === 'ASSINADO') ? 'Visualizar Contrato' : 'Assinar Contrato'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Announcements & Mentorship */}
        <div className="space-y-8">
          {/* Avisos Section (Replacing Chapter Sidebar) */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-50">
              <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-orange-500" /> Últimos Avisos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center py-6 text-slate-500 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  <p className="text-sm">Fique atento aos comunicados da editora aqui.</p>
                  <Button
                    variant="link"
                    className="mt-2 text-blue-600 h-auto p-0 font-semibold"
                    onClick={() => navigate('/coauthor/announcements')}
                  >
                    Ver todos os avisos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-500" /> Próxima Mentoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentorship ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
                  <h4 className="font-semibold text-indigo-900">{mentorship.title || 'Mentoria'}</h4>
                  <div className="flex items-center gap-2 mt-3 text-sm font-medium text-indigo-700 bg-white w-fit px-3 py-1.5 rounded-md border border-indigo-100 shadow-sm">
                    <Calendar className="h-4 w-4" />
                    {mentorship.date ? new Date(mentorship.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data não definida'}
                  </div>
                  <Button variant="outline" className="w-full mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-white" onClick={() => mentorship.link ? window.open(mentorship.link, '_blank') : null} disabled={!mentorship.link}>
                    Acessar Link
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 border border-dashed border-slate-200 rounded-lg">
                  Nenhuma mentoria agendada no momento.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoauthorDashboard;
