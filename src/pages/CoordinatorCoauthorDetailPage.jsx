
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';
import { CoordinatorObservationModal } from '@/components/CoordinatorObservationModal';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, MessageSquarePlus, ChevronRight, Circle, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

const timeAgoFull = (dateStr) => {
  const d = new Date(dateStr);
  const diff = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `Hoje às ${time}`;
  if (diff === 1) return `Ontem às ${time}`;
  return `há ${diff} dias às ${time}`;
};

const CoordinatorCoauthorDetailPage = () => {
  const { coauthorId } = useParams();
  const navigate = useNavigate();
  const { getCoauthorDetails, addObservation, updateChapterStatus, loading } = useCoordinatorData();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    const d = await getCoauthorDetails(coauthorId);
    if (d) setData(d);
  };

  useEffect(() => { loadData(); }, [coauthorId]);

  const handleSaveObservation = async (obs) => {
    await addObservation(coauthorId, obs);
    loadData();
  };

  if (loading || !data) return <div className="flex h-64 items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div></div>;

  const { author, projects, currentChapter, progress, activities } = data;
  const daysRem = currentChapter ? Math.ceil((new Date(currentChapter.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  const getRiskColor = (days) => {
    if (days === null) return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'fill-slate-400' };
    if (days < 0) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'fill-red-500 text-red-500' };
    if (days <= 7) return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'fill-yellow-500 text-yellow-500' };
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'fill-green-500 text-green-500' };
  };

  const risk = getRiskColor(daysRem);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <Helmet><title>{author.name} - Detalhes do Coautor</title></Helmet>

      {/* Section 1: Header */}
      <div>
        <div className="flex items-center text-sm text-slate-500 gap-2 mb-4">
          <Link to="/coordinator/coauthors" className="hover:text-blue-600 transition-colors font-medium">Meus Coautores</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-semibold">{author.name}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{author.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span className="text-slate-500 text-sm">{author.email}</span>
              <span className="text-slate-300 hidden md:inline">•</span>
              {projects.map(p => (
                <span key={p.id} className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                  {p.name} <ExternalLink className="w-3 h-3" />
                </span>
              ))}
              {projects.length === 0 && <span className="text-sm text-slate-400">Sem projeto</span>}
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button variant="outline" className="border-slate-300 text-slate-700" onClick={() => navigate('/coordinator/coauthors')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={() => setObsModalOpen(true)}>
              <MessageSquarePlus className="w-4 h-4 mr-2" /> Observação Interna
            </Button>
          </div>
        </div>
      </div>

      {/* Section 2 & 3 & 4: Status and Progress */}
      {currentChapter ? (
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">{currentChapter.title}</h2>
                <div className="flex items-center gap-3">
                  <ChapterStatusBadge status={currentChapter.status} />
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${risk.bg} ${risk.text} ${risk.border}`}>
                    <Circle className={`w-2.5 h-2.5 ${risk.dot}`} />
                    {daysRem < 0 ? `Atrasado ${Math.abs(daysRem)} dias` : daysRem === 0 ? 'Entrega Hoje' : `${daysRem} dias para entrega`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium mb-1">Prazo Final</p>
                  <p className="text-xl font-bold text-slate-800 flex items-center justify-end gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    {new Date(currentChapter.deadline).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {(currentChapter.status === 'ENVIADO_PARA_REVISAO' || currentChapter.status === 'EM_REVISAO') && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      disabled={isUpdating}
                      onClick={async () => {
                        setIsUpdating(true);
                        const success = await updateChapterStatus(currentChapter.id, 'REVISAR', author.id);
                        if (success) {
                          await loadData();
                          toast({ title: 'Revisão solicitada', description: 'O coautor será notificado.' });
                        }
                        setIsUpdating(false);
                      }}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" /> Solicitar Ajustes
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isUpdating}
                      onClick={async () => {
                        setIsUpdating(true);
                        const success = await updateChapterStatus(currentChapter.id, 'APROVADO', author.id);
                        if (success) {
                          await loadData();
                          toast({ title: 'Capítulo aprovado!', description: 'Parabéns ao coautor.' });
                        }
                        setIsUpdating(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Aprovar Capítulo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Large Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Progresso de Escrita</span>
                <span className="text-lg font-bold text-slate-800">
                  {currentChapter.word_count.toLocaleString('pt-BR')} / {currentChapter.word_goal.toLocaleString('pt-BR')} palavras <span className="text-blue-600 ml-1">({progress}%)</span>
                </span>
              </div>
              <div className="h-10 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
                <div
                  className="h-full bg-blue-500 transition-all duration-500 ease-out flex items-center justify-end px-4"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 10 && <span className="text-white font-bold text-sm drop-shadow-md">{progress}%</span>}
                </div>
              </div>
              <p className="text-right text-xs text-slate-500 font-medium mt-2">
                Última edição: {timeAgoFull(currentChapter.updated_at)}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-slate-50 border-dashed border-slate-300">
          <div className="py-12 text-center text-slate-500">
            Nenhum capítulo ativo ou pendente para este coautor no momento.
          </div>
        </Card>
      )}

      {/* Section 5: Activity Timeline */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          Histórico de Atividades <span className="text-sm font-normal text-slate-500">(Últimas 10)</span>
        </h3>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="relative border-l-2 border-slate-100 ml-3 md:ml-4 space-y-8">
            {activities.slice(0, 10).map((act, i) => {
              const date = new Date(act.date);
              const isObs = act.type === 'observation';
              const isMsg = act.type === 'message';
              const dotColor = isObs ? 'bg-indigo-500 border-indigo-200' : isMsg ? 'bg-blue-500 border-blue-200' : 'bg-emerald-500 border-emerald-200';
              const bgColor = isObs ? 'bg-indigo-50/50 border-indigo-100' : isMsg ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100';

              return (
                <div key={act.id} className="relative pl-6 md:pl-8">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 shadow-sm ${dotColor}`}></div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
                    <span className="text-sm font-bold text-slate-800">{act.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleDateString('pt-BR')} | {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={`p-4 rounded-lg border ${bgColor} text-sm text-slate-700 leading-relaxed shadow-sm`}>
                    {act.details}
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && (
              <div className="pl-6 text-slate-500 text-sm">Nenhuma atividade registrada no histórico.</div>
            )}
          </div>
        </div>
      </div>

      <CoordinatorObservationModal
        isOpen={obsModalOpen}
        onClose={() => setObsModalOpen(false)}
        onSave={handleSaveObservation}
        coauthorName={author.name}
      />
    </div>
  );
};

export default CoordinatorCoauthorDetailPage;
