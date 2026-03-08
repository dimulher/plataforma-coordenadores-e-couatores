
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, ArrowRight, BookOpen, Globe, ExternalLink, Loader2, Clock } from 'lucide-react';

const toSlug = (name) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

const CoordinatorDashboard = () => {
  const { getDashboardMetrics, getCoauthorsList, loading } = useCoordinatorData();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [topCoauthors, setTopCoauthors] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [siteRequest, setSiteRequest] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [m, c] = await Promise.all([
        getDashboardMetrics(),
        getCoauthorsList(),
      ]);
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
    supabase
      .from('site_requests')
      .select('*')
      .eq('coordinator_id', user.id)
      .maybeSingle()
      .then(({ data }) => setSiteRequest(data || null));
  }, [user?.id]);

  const handleRequestWebsite = async () => {
    setRequesting(true);
    try {
      const now = new Date().toISOString();

      const slug = toSlug(user.name);
    const websiteUrl = `${window.location.origin}/register/coautor/${slug}`;

    // Salva o slug no referral_code do perfil para lookup posterior
    await supabase.from('profiles').update({ referral_code: slug }).eq('id', user.id);

      // Busca o gestor
      let gestorName = null;
      if (user.manager_id) {
        const { data: gestor } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.manager_id)
          .single();
        gestorName = gestor?.name || null;
      }

      // Verifica se já existe uma solicitação
      const { data: existing } = await supabase
        .from('site_requests')
        .select('id')
        .eq('coordinator_id', user.id)
        .maybeSingle();

      let reqData, reqError;

      if (existing?.id) {
        ({ data: reqData, error: reqError } = await supabase
          .from('site_requests')
          .update({
            status: 'CONCLUIDO',
            requested_at: now,
            coordinator_name: user.name,
            gestor_name: gestorName,
            website_url: websiteUrl,
          })
          .eq('id', existing.id)
          .select()
          .single());
      } else {
        ({ data: reqData, error: reqError } = await supabase
          .from('site_requests')
          .insert({
            coordinator_id: user.id,
            coordinator_name: user.name,
            gestor_name: gestorName,
            status: 'CONCLUIDO',
            requested_at: now,
            website_url: websiteUrl,
          })
          .select()
          .single());
      }

      if (reqError) throw reqError;
      setSiteRequest(reqData);

      // Notifica o webhook (best-effort)
      fetch('https://n8n.prosperamentor.com.br/webhook/linksolit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: user.cpf,
          website_url: websiteUrl,
          requested_at: now,
        }),
      }).catch(() => {});

      toast({ title: 'Site gerado!', description: 'Seu link de captação já está disponível.' });
    } catch (error) {
      console.error('Error requesting website:', error);
      toast({ title: 'Erro na solicitação', description: error.message, variant: 'destructive' });
    } finally {
      setRequesting(false);
    }
  };

  if (loading || !metrics) return <div className="flex h-64 items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div></div>;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'RASCUNHO':
      case 'EM_EDICAO':
      case 'AJUSTES_SOLICITADOS':
        return { label: 'Em escrita', color: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'ENVIADO_PARA_REVISAO':
      case 'EM_REVISAO':
        return { label: 'Em revisão', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' };
      case 'APROVADO':
        return { label: 'Revisado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'PRODUCAO':
        return { label: 'Produção', color: 'bg-purple-50 text-purple-700 border-purple-100' };
      case 'FINALIZADO':
      case 'CONCLUIDO':
        return { label: 'Concluído', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      default:
        return { label: status || 'Sem status', color: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Helmet><title>Painel do Coordenador - NAB Platform</title></Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Painel do Coordenador</h1>
          <p className="text-slate-500 mt-1">Visão geral da sua captação e produção da equipe.</p>
        </div>
        <div>
          {siteRequest?.status === 'CONCLUIDO' || siteRequest?.website_url || user?.website_url ? (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={() => {
                const url = siteRequest?.website_url || user?.website_url || `${window.location.origin}/register/coautor/${toSlug(user.name)}`;
                window.open(url, '_blank');
              }}
            >
              <Globe className="w-4 h-4" />
              Ver Site
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Button>
          ) : siteRequest?.status === 'PENDENTE' ? (
            <Button variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 gap-2 cursor-default" disabled>
              <Clock className="w-4 h-4" />
              Solicitação em análise
            </Button>
          ) : siteRequest?.status === 'EM_ANDAMENTO' ? (
            <Button variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 gap-2 cursor-default" disabled>
              <Loader2 className="w-4 h-4 animate-spin" />
              Site em desenvolvimento
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-2"
              onClick={handleRequestWebsite}
              disabled={requesting}
            >
              {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-blue-500" />}
              {requesting ? 'Solicitando...' : 'Solicitar site de divulgação'}
            </Button>
          )}
        </div>
      </div>

      {/* Section 1: Captação KPIs */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Captação e Equipe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-5 flex flex-col justify-center items-center text-center"><Users className="w-8 h-8 text-blue-500 mb-2 bg-blue-50 p-1.5 rounded-lg" /><h3 className="text-2xl font-bold text-slate-800">{metrics.leadsIndicados}</h3><p className="text-xs text-slate-500 font-medium uppercase mt-1">Leads Indicados</p></CardContent></Card>
          <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-5 flex flex-col justify-center items-center text-center"><Users className="w-8 h-8 text-purple-500 mb-2 bg-purple-50 p-1.5 rounded-lg" /><h3 className="text-2xl font-bold text-slate-800">{metrics.coautoresAtivos}</h3><p className="text-xs text-slate-500 font-medium uppercase mt-1">Coautores Ativos</p></CardContent></Card>
          <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-5 flex flex-col justify-center items-center text-center"><BookOpen className="w-8 h-8 text-orange-500 mb-2 bg-orange-50 p-1.5 rounded-lg" /><h3 className="text-2xl font-bold text-slate-800">{metrics.chaptersInProgress}</h3><p className="text-xs text-slate-500 font-medium uppercase mt-1">Caps. em Andamento</p></CardContent></Card>
          <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-5 flex flex-col justify-center items-center text-center"><CheckCircle className="w-8 h-8 text-emerald-500 mb-2 bg-emerald-50 p-1.5 rounded-lg" /><h3 className="text-2xl font-bold text-slate-800">{metrics.chaptersInReview}</h3><p className="text-xs text-slate-500 font-medium uppercase mt-1">Enviados p/ Revisão</p></CardContent></Card>
        </div>
      </section>


      {/* Section 3: Resumo de Produção */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Resumo de Produção (Próximas Entregas)</h2>
          <Button variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => navigate('/coordinator/coauthors')}>Ver Todos <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Status do Capítulo</th>
                  <th className="px-6 py-4 text-right">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topCoauthors.map(author => {
                  const chap = author.currentChapter;
                  const daysRem = Math.ceil((new Date(chap.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const statusDisplay = getStatusDisplay(chap?.status);

                  return (
                    <tr key={author.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate(`/coordinator/coauthors/${author.id}`)}>
                      <td className="px-6 py-4 font-semibold text-slate-800">{author.name}</td>
                      <td className="px-6 py-4 mt-1">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] text-slate-500 font-medium uppercase truncate">{author.projectNames}</p>
                          <div className={`text-xs font-bold px-3 py-1 rounded-full border w-fit ${statusDisplay.color}`}>
                            {statusDisplay.label}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${daysRem < 0 ? 'bg-red-50 text-red-600 border border-red-100' : daysRem <= 7 ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                          {new Date(chap.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {topCoauthors.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-slate-500">Nenhum capítulo em andamento.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default CoordinatorDashboard;
