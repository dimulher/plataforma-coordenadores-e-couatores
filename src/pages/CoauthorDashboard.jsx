
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCoauthorMetrics } from '@/hooks/useCoauthorMetrics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { JourneyTimeline } from '@/components/JourneyTimeline';
import { NAV, BLUE, RED, CREAM, WelcomeBanner, BrandCard, BrandCardHeader, BtnPrimary, BtnOutline } from '@/lib/brand';
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
        .update({ contract_status: 'ASSINADO', contract_signed_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Sucesso!', description: 'Contrato assinado com sucesso.' });
      await refreshProfile();
      if (refresh) refresh();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível assinar o contrato.', variant: 'destructive' });
    } finally {
      setSigning(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  const { project, chapter, mentorship } = metrics || {};
  const wordProgress = chapter?.word_goal ? Math.min(((chapter.word_count || 0) / chapter.word_goal) * 100, 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meu Painel — Novos Autores do Brasil</title></Helmet>

      {/* Welcome Banner */}
      <WelcomeBanner
        name={`Bem-vindo, ${user?.name?.split(' ')[0] || 'Autor'}!`}
        subtitle="Vamos continuar sua jornada de publicação."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Meu Capítulo */}
          <BrandCard>
            <BrandCardHeader icon={Edit3} iconColor={RED} accentColor={RED} title="Meu Capítulo" />
            <div className="px-6 py-6">
              {chapter ? (
                <div className="space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                      {chapter.title || 'Capítulo sem título'}
                    </h3>
                    <BtnPrimary
                      onClick={() => navigate(`/coauthor/chapters/${chapter.id}/edit`)}
                      icon={Edit3}
                      label="Continuar Escrevendo"
                    />
                  </div>

                  <div className="p-5 rounded-xl" style={{ background: CREAM, border: `1px solid ${NAV}0F` }}>
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="text-3xl font-bold tracking-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                          {(chapter.word_count || 0).toLocaleString('pt-BR')}
                        </span>
                        <span className="ml-2 font-medium text-sm" style={{ color: `${NAV}60` }}>palavras escritas</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: `${NAV}60` }}>
                        Meta: {(chapter.word_goal || 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${NAV}12` }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${wordProgress}%`, background: RED }}
                        />
                      </div>
                      <span className="text-sm font-bold w-10 text-right" style={{ color: NAV }}>
                        {Math.round(wordProgress)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-sm" style={{ color: `${NAV}60` }}>Nenhum capítulo atribuído.</p>
              )}
            </div>
          </BrandCard>

          {/* Timeline */}
          {chapter && (
            <BrandCard>
              <div className="px-6 py-6">
                <p
                  className="text-xs font-bold uppercase tracking-[0.15em] text-center mb-6"
                  style={{ color: BLUE, fontFamily: 'Poppins, sans-serif' }}
                >
                  Sua Jornada da Publicação
                </p>
                <JourneyTimeline currentStage={chapter.current_stage || 'Contrato'} />
              </div>
            </BrandCard>
          )}

          {/* Contrato */}
          <BrandCard>
            <BrandCardHeader
              icon={BookOpen}
              iconColor={BLUE}
              accentColor={BLUE}
              title="Meu Contrato"
              extra={
                <span
                  className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style={
                    user?.contract_status === 'ASSINADO'
                      ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                      : { background: `${RED}12`, color: RED }
                  }
                >
                  {user?.contract_status === 'ASSINADO' ? 'Assinado' : 'Pendente'}
                </span>
              }
            />
            <div className="px-6 py-6">
              <div
                className="flex items-center justify-between gap-4 p-4 rounded-xl"
                style={{ background: CREAM, border: `1px solid ${NAV}0A` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: `${BLUE}15` }}>
                    <BookOpen className="h-5 w-5" style={{ color: BLUE }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Contrato de Coautoria</p>
                    <p className="text-xs mt-0.5" style={{ color: `${NAV}60` }}>
                      {user?.contract_status === 'ASSINADO'
                        ? `Assinado em ${new Date(user.contract_signed_at).toLocaleDateString('pt-BR')}`
                        : 'O contrato foi enviado para sua assinatura.'}
                    </p>
                  </div>
                </div>
                {user?.contract_status === 'ASSINADO' ? (
                  <BtnOutline
                    onClick={() => user?.contract_url && window.open(user.contract_url, '_blank')}
                    icon={BookOpen} label="Visualizar" color={BLUE}
                  />
                ) : (
                  <BtnPrimary
                    onClick={() => { user?.contract_url && window.open(user.contract_url, '_blank'); handleSignContract(); }}
                    disabled={signing} loading={signing}
                    icon={BookOpen} label="Assinar Contrato" loadingLabel="Assinando..."
                  />
                )}
              </div>
            </div>
          </BrandCard>
        </div>

        {/* ── Right column ───────────────────────────────── */}
        <div className="space-y-6">
          {/* Avisos */}
          <BrandCard>
            <BrandCardHeader icon={Edit3} iconColor="#F59E0B" accentColor="#F59E0B" title="Últimos Avisos" />
            <div className="px-6 py-6">
              <div
                className="text-center py-8 rounded-xl border-2 border-dashed"
                style={{ borderColor: `${NAV}12` }}
              >
                <p className="text-sm mb-3" style={{ color: `${NAV}60` }}>
                  Fique atento aos comunicados da editora aqui.
                </p>
                <button
                  onClick={() => navigate('/coauthor/announcements')}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: BLUE }}
                  onMouseEnter={e => { e.currentTarget.style.color = NAV; }}
                  onMouseLeave={e => { e.currentTarget.style.color = BLUE; }}
                >
                  Ver todos os avisos →
                </button>
              </div>
            </div>
          </BrandCard>

          {/* Mentoria */}
          <BrandCard>
            <BrandCardHeader icon={Video} iconColor={BLUE} accentColor={BLUE} title="Próxima Mentoria" />
            <div className="px-6 py-6">
              {mentorship ? (
                <div className="p-4 rounded-xl" style={{ background: `${BLUE}0A`, border: `1px solid ${BLUE}20` }}>
                  <p className="font-semibold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                    {mentorship.title || 'Mentoria'}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs font-medium px-3 py-1.5 rounded-lg w-fit bg-white"
                    style={{ color: BLUE, border: `1px solid ${BLUE}20` }}>
                    <Calendar className="h-3.5 w-3.5" />
                    {mentorship.date
                      ? new Date(mentorship.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                      : 'Data não definida'}
                  </div>
                  {mentorship.link && (
                    <BtnOutline
                      onClick={() => window.open(mentorship.link, '_blank')}
                      icon={Video} label="Acessar Link" color={BLUE}
                      className="w-full mt-4 justify-center"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: `${NAV}12` }}>
                  <p className="text-sm" style={{ color: `${NAV}50` }}>Nenhuma mentoria agendada no momento.</p>
                </div>
              )}
            </div>
          </BrandCard>
        </div>
      </div>
    </div>
  );
};

export default CoauthorDashboard;
