
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';
import { CoordinatorObservationModal } from '@/components/CoordinatorObservationModal';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, MessageSquarePlus, ChevronRight, Circle, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader, BtnPrimary, BtnOutline } from '@/lib/brand';

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

  if (loading || !data) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  const { author, projects, currentChapter, progress, activities } = data;
  const daysRem = currentChapter
    ? Math.ceil((new Date(currentChapter.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const riskStyle = daysRem === null
    ? { bg: `${NAV}08`, text: `${NAV}85`, border: `${NAV}12` }
    : daysRem < 0
    ? { bg: `${RED}10`, text: RED, border: `${RED}30` }
    : daysRem <= 7
    ? { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' }
    : { bg: 'rgba(16,185,129,0.1)', text: '#10B981', border: 'rgba(16,185,129,0.3)' };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <Helmet><title>{author.name} — Novos Autores do Brasil</title></Helmet>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/coordinator/coauthors" className="font-medium transition-colors" style={{ color: BLUE }}
          onMouseEnter={e => { e.currentTarget.style.color = NAV; }}
          onMouseLeave={e => { e.currentTarget.style.color = BLUE; }}>
          Meus Coautores
        </Link>
        <ChevronRight className="w-4 h-4" style={{ color: `${NAV}70` }} />
        <span className="font-semibold" style={{ color: NAV }}>{author.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6"
        style={{ borderBottom: `1px solid ${NAV}10` }}>
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{author.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <span className="text-sm" style={{ color: `${NAV}85` }}>{author.email}</span>
            {projects.map(p => (
              <span key={p.id} className="text-sm font-medium flex items-center gap-1 px-2 py-0.5 rounded-md"
                style={{ color: BLUE, background: `${BLUE}12`, border: `1px solid ${BLUE}25` }}>
                {p.name} <ExternalLink className="w-3 h-3" />
              </span>
            ))}
            {projects.length === 0 && <span className="text-sm" style={{ color: `${NAV}70` }}>Sem projeto</span>}
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <BtnOutline onClick={() => navigate('/coordinator/coauthors')} icon={ArrowLeft} label="Voltar" color={NAV} />
          <BtnPrimary onClick={() => setObsModalOpen(true)} icon={MessageSquarePlus} label="Observação Interna" />
        </div>
      </div>

      {/* Chapter card */}
      {currentChapter ? (
        <BrandCard>
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{currentChapter.title}</h2>
                <div className="flex items-center gap-3">
                  <ChapterStatusBadge status={currentChapter.status} />
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold"
                    style={{ background: riskStyle.bg, color: riskStyle.text, border: `1.5px solid ${riskStyle.border}` }}
                  >
                    <Circle className="w-2.5 h-2.5 fill-current" />
                    {daysRem < 0 ? `Atrasado ${Math.abs(daysRem)} dias` : daysRem === 0 ? 'Entrega Hoje' : `${daysRem} dias para entrega`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium mb-1" style={{ color: `${NAV}85` }}>Prazo Final</p>
                  <p className="text-xl font-bold flex items-center justify-end gap-2" style={{ color: NAV }}>
                    <Clock className="w-5 h-5" style={{ color: `${NAV}75` }} />
                    {new Date(currentChapter.deadline).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {(currentChapter.status === 'ENVIADO_PARA_REVISAO' || currentChapter.status === 'EM_REVISAO') && (
                  <div className="flex gap-2">
                    <BtnOutline
                      onClick={async () => {
                        setIsUpdating(true);
                        const success = await updateChapterStatus(currentChapter.id, 'REVISAR', author.id);
                        if (success) { await loadData(); toast({ title: 'Revisão solicitada' }); }
                        setIsUpdating(false);
                      }}
                      disabled={isUpdating}
                      icon={AlertCircle} label="Solicitar Ajustes" color={RED}
                    />
                    <BtnPrimary
                      onClick={async () => {
                        setIsUpdating(true);
                        const success = await updateChapterStatus(currentChapter.id, 'APROVADO', author.id);
                        if (success) { await loadData(); toast({ title: 'Capítulo aprovado!' }); }
                        setIsUpdating(false);
                      }}
                      disabled={isUpdating}
                      icon={CheckCircle} label="Aprovar Capítulo"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}75` }}>Progresso de Escrita</span>
                <span className="font-bold" style={{ color: NAV }}>
                  {currentChapter.word_count.toLocaleString('pt-BR')} / {currentChapter.word_goal.toLocaleString('pt-BR')} palavras
                  <span className="ml-2" style={{ color: BLUE }}>({progress}%)</span>
                </span>
              </div>
              <div className="h-10 rounded-xl overflow-hidden relative" style={{ background: `${NAV}0C`, border: `1px solid ${NAV}10` }}>
                <div
                  className="h-full flex items-center justify-end px-4 transition-all duration-500 rounded-xl"
                  style={{ width: `${progress}%`, background: BLUE }}
                >
                  {progress > 10 && <span className="text-white font-bold text-sm drop-shadow">{progress}%</span>}
                </div>
              </div>
              <p className="text-right text-xs" style={{ color: `${NAV}75` }}>
                Última edição: {timeAgoFull(currentChapter.updated_at)}
              </p>
            </div>
          </div>
        </BrandCard>
      ) : (
        <div
          className="py-12 text-center rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${NAV}12`, background: 'white', color: `${NAV}75` }}
        >
          Nenhum capítulo ativo ou pendente para este coautor no momento.
        </div>
      )}

      {/* Activity timeline */}
      <BrandCard>
        <BrandCardHeader icon={Clock} iconColor={BLUE} accentColor={BLUE}
          title={`Histórico de Atividades`}
          extra={<span className="text-xs" style={{ color: `${NAV}75` }}>Últimas 10</span>}
        />
        <div className="px-6 py-6">
          <div className="relative ml-3 md:ml-4 space-y-8" style={{ borderLeft: `2px solid ${NAV}0C` }}>
            {activities.slice(0, 10).map((act) => {
              const date = new Date(act.date);
              const isObs = act.type === 'observation';
              const isMsg = act.type === 'message';
              const dotColor = isObs ? '#8B5CF6' : isMsg ? BLUE : '#10B981';

              return (
                <div key={act.id} className="relative pl-6 md:pl-8">
                  <div
                    className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 bg-white"
                    style={{ borderColor: dotColor, boxShadow: `0 0 0 2px ${dotColor}30` }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
                    <span className="text-sm font-bold" style={{ color: NAV }}>{act.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: `${NAV}75` }}>
                      <Clock className="w-3 h-3" />
                      {date.toLocaleDateString('pt-BR')} · {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className="p-4 rounded-xl text-sm leading-relaxed"
                    style={{
                      background: `${dotColor}08`,
                      border: `1px solid ${dotColor}20`,
                      color: `${NAV}80`,
                    }}
                  >
                    {act.details}
                  </div>
                </div>
              );
            })}
            {activities.length === 0 && (
              <div className="pl-6 text-sm" style={{ color: `${NAV}75` }}>Nenhuma atividade registrada no histórico.</div>
            )}
          </div>
        </div>
      </BrandCard>

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
