
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle, ArrowRight, BookOpen, Globe, ExternalLink, Loader2, Clock } from 'lucide-react';
import { NAV, BLUE, RED, WelcomeBanner, BrandCard, BrandCardHeader, BtnOutline } from '@/lib/brand';

const toSlug = (name) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

const STATUS_MAP = {
  RASCUNHO:              { label: 'Em escrita',   text: BLUE,      bg: `${BLUE}12` },
  EM_EDICAO:             { label: 'Em escrita',   text: BLUE,      bg: `${BLUE}12` },
  AJUSTES_SOLICITADOS:   { label: 'Ajustes',      text: '#FF6B35', bg: 'rgba(255,107,53,0.10)' },
  ENVIADO_PARA_REVISAO:  { label: 'Em revisão',   text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  EM_REVISAO:            { label: 'Em revisão',   text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  APROVADO:              { label: 'Revisado',     text: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  PRODUCAO:              { label: 'Produção',     text: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  FINALIZADO:            { label: 'Concluído',    text: `${NAV}80`, bg: `${NAV}08` },
  CONCLUIDO:             { label: 'Concluído',    text: `${NAV}80`, bg: `${NAV}08` },
};

const getStatus = (s) => STATUS_MAP[s] || { label: s || 'Sem status', text: `${NAV}60`, bg: `${NAV}08` };

const MetricTile = ({ icon: Icon, iconColor, label, value }) => (
  <div
    className="rounded-2xl p-5 flex flex-col items-center justify-center text-center bg-white"
    style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
  >
    <span className="flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: `${iconColor}15` }}>
      <Icon className="w-5 h-5" style={{ color: iconColor }} />
    </span>
    <span className="text-2xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{value}</span>
    <span className="text-[11px] font-medium uppercase tracking-wider mt-1" style={{ color: `${NAV}50` }}>{label}</span>
  </div>
);

const CoordinatorDashboard = () => {
  const { getDashboardMetrics, getCoauthorsList, loading } = useCoordinatorData();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [topCoauthors, setTopCoauthors] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [siteRequest, setSiteRequest] = useState(null);
  const [registerRoute, setRegisterRoute] = useState('register/coautor');

  useEffect(() => {
    const load = async () => {
      const [m, c] = await Promise.all([getDashboardMetrics(), getCoauthorsList()]);
      if (m) setMetrics(m);
      if (c) {
        const sorted = [...c]
          .filter(a => a.currentChapter)
          .sort((a, b) => new Date(a.currentChapter.deadline) - new Date(b.currentChapter.deadline))
          .slice(0, 5);
        setTopCoauthors(sorted);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('site_requests').select('*').eq('coordinator_id', user.id).maybeSingle()
      .then(({ data }) => setSiteRequest(data || null));

    async function detectRoute() {
      const { data: rows } = await supabase.from('project_participants').select('project_id').eq('user_id', user.id).limit(1);
      const projectId = rows?.[0]?.project_id;
      if (!projectId) return;
      const { data: proj } = await supabase.from('projects').select('name').eq('id', projectId).limit(1);
      const name = proj?.[0]?.name?.toLowerCase() || '';
      if (name.includes('paulo')) setRegisterRoute('register/autor-sp');
    }
    detectRoute();
  }, [user?.id]);

  const handleRequestWebsite = async () => {
    setRequesting(true);
    try {
      const now = new Date().toISOString();
      const slug = toSlug(user.name);
      const websiteUrl = `${window.location.origin}/${registerRoute}/${slug}`;
      await supabase.from('profiles').update({ referral_code: slug }).eq('id', user.id);

      let gestorName = null;
      if (user.manager_id) {
        const { data: gestor } = await supabase.from('profiles').select('name').eq('id', user.manager_id).single();
        gestorName = gestor?.name || null;
      }

      const { data: existing } = await supabase.from('site_requests').select('id').eq('coordinator_id', user.id).maybeSingle();
      let reqData, reqError;

      if (existing?.id) {
        ({ data: reqData, error: reqError } = await supabase.from('site_requests')
          .update({ status: 'CONCLUIDO', requested_at: now, coordinator_name: user.name, gestor_name: gestorName, website_url: websiteUrl })
          .eq('id', existing.id).select().single());
      } else {
        ({ data: reqData, error: reqError } = await supabase.from('site_requests')
          .insert({ coordinator_id: user.id, coordinator_name: user.name, gestor_name: gestorName, status: 'CONCLUIDO', requested_at: now, website_url: websiteUrl })
          .select().single());
      }

      if (reqError) throw reqError;
      setSiteRequest(reqData);

      fetch('https://n8n.prosperamentor.com.br/webhook/linksolit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name: user.name, email: user.email, phone: user.phone, cpf: user.cpf, website_url: websiteUrl, requested_at: now }),
      }).catch(() => {});

      toast({ title: 'Site gerado!', description: 'Seu link de captação já está disponível.' });
    } catch (error) {
      toast({ title: 'Erro na solicitação', description: error.message, variant: 'destructive' });
    } finally {
      setRequesting(false);
    }
  };

  if (loading || !metrics) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  const getSiteButton = () => {
    if (siteRequest?.status === 'CONCLUIDO' || siteRequest?.website_url || user?.website_url) {
      return (
        <BtnOutline
          onClick={() => {
            const url = siteRequest?.website_url || user?.website_url || `${window.location.origin}/${registerRoute}/${toSlug(user.name)}`;
            window.open(url, '_blank');
          }}
          icon={ExternalLink} label="Ver Site" color={BLUE}
        />
      );
    }
    if (siteRequest?.status === 'PENDENTE') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1.5px solid rgba(245,158,11,0.25)' }}>
          <Clock className="w-4 h-4" /> Em análise
        </span>
      );
    }
    if (siteRequest?.status === 'EM_ANDAMENTO') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: `${BLUE}10`, color: BLUE, border: `1.5px solid ${BLUE}25` }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Em desenvolvimento
        </span>
      );
    }
    return (
      <BtnOutline
        onClick={handleRequestWebsite} disabled={requesting} loading={requesting}
        icon={Globe} label="Solicitar site" loadingLabel="Solicitando..." color={BLUE}
      />
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Painel do Coordenador — Novos Autores do Brasil</title></Helmet>

      <WelcomeBanner
        name={`Bem-vindo, ${user?.name?.split(' ')[0] || 'Coordenador'}!`}
        subtitle="Gerencie sua equipe e acompanhe a produção."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile icon={Users}        iconColor={BLUE}      label="Leads Indicados"     value={metrics.leadsIndicados} />
        <MetricTile icon={Users}        iconColor="#8B5CF6"   label="Coautores Ativos"    value={metrics.coautoresAtivos} />
        <MetricTile icon={BookOpen}     iconColor="#F59E0B"   label="Caps. em Andamento"  value={metrics.chaptersInProgress} />
        <MetricTile icon={CheckCircle}  iconColor="#10B981"   label="Enviados p/ Revisão" value={metrics.chaptersInReview} />
      </div>

      {/* Próximas Entregas */}
      <BrandCard>
        <BrandCardHeader icon={CheckCircle} iconColor="#10B981" accentColor="#10B981" title="Próximas Entregas"
          extra={
            <button
              onClick={() => navigate('/coordinator/coauthors')}
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: BLUE }}
              onMouseEnter={e => { e.currentTarget.style.color = NAV; }}
              onMouseLeave={e => { e.currentTarget.style.color = BLUE; }}
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: `${NAV}04`, borderBottom: `1px solid ${NAV}0C` }}>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}50` }}>Nome</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}50` }}>Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}50` }}>Prazo</th>
              </tr>
            </thead>
            <tbody>
              {topCoauthors.map((author) => {
                const chap = author.currentChapter;
                const daysRem = Math.ceil((new Date(chap.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const st = getStatus(chap?.status);
                return (
                  <tr
                    key={author.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid ${NAV}08` }}
                    onClick={() => navigate(`/coordinator/coauthors/${author.id}`)}
                    onMouseEnter={e => { e.currentTarget.style.background = `${NAV}04`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-6 py-4 font-semibold" style={{ color: NAV }}>{author.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${NAV}40` }}>{author.projectNames}</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full w-fit" style={{ color: st.text, background: st.bg }}>{st.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={
                          daysRem < 0
                            ? { background: `${RED}12`, color: RED }
                            : daysRem <= 7
                            ? { background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }
                            : { background: `${NAV}08`, color: `${NAV}60` }
                        }
                      >
                        {new Date(chap.deadline).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {topCoauthors.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center text-sm" style={{ color: `${NAV}50` }}>
                    Nenhum capítulo em andamento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BrandCard>

      {/* Site de divulgação */}
      <BrandCard>
        <BrandCardHeader icon={Globe} iconColor={BLUE} accentColor={BLUE} title="Site de Divulgação" extra={getSiteButton()} />
        <div className="px-6 py-5">
          {siteRequest?.status === 'CONCLUIDO' && siteRequest?.website_url ? (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Globe className="h-4 w-4 shrink-0" style={{ color: '#10B981' }} />
              <a href={siteRequest.website_url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium hover:underline" style={{ color: '#10B981' }}>
                {siteRequest.website_url}
              </a>
            </div>
          ) : (
            <p className="text-sm" style={{ color: `${NAV}60` }}>
              Gere e compartilhe seu link de captação personalizado para registrar novos coautores.
            </p>
          )}
        </div>
      </BrandCard>
    </div>
  );
};

export default CoordinatorDashboard;
