
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Eye, Clock, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NAV, BLUE, RED, BtnPrimary } from '@/lib/brand';

const STATUS = {
  RASCUNHO:              { text: BLUE,     bg: `${BLUE}15`,     label: 'Em edição' },
  EM_EDICAO:             { text: BLUE,     bg: `${BLUE}15`,     label: 'Em edição' },
  ENVIADO_PARA_REVISAO:  { text: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Enviado p/ revisão' },
  AJUSTES_SOLICITADOS:   { text: '#FF6B35', bg: 'rgba(255,107,53,0.12)', label: 'Ajustes solicitados' },
  APROVADO:              { text: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Aprovado' },
  FINALIZADO:            { text: '#6366F1', bg: 'rgba(99,102,241,0.12)', label: 'Concluído' },
};

const getStatus = (s) => STATUS[s] || { text: `${NAV}70`, bg: `${NAV}08`, label: s || 'Desconhecido' };

const fmtDateTime = (d) => {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const CoauthorChaptersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chapters, setChapters]       = useState([]);
  const [projects, setProjects]       = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig]   = useState('deadline');
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [{ data: myChapters }, { data: participations }] = await Promise.all([
          supabase.from('chapters').select('*').eq('author_id', user.id),
          supabase.from('project_participants').select('project_id, projects(*)').eq('user_id', user.id),
        ]);
        setChapters(myChapters || []);
        setProjects(participations?.map(p => p.projects) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const getProjectName = (pid) => projects.find(p => p?.id === pid)?.name || '—';

  const handleCreateChapter = async () => {
    if (!user?.id) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert({ author_id: user.id, title: 'Meu Capítulo', status: 'RASCUNHO', word_count: 0, word_goal: 1000, content_text: '' })
        .select().single();
      if (error) throw error;
      toast({ title: 'Capítulo criado!', description: 'Você pode começar a escrever agora.' });
      navigate(`/coauthor/chapters/${data.id}/edit`);
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar o capítulo.' });
    } finally {
      setCreating(false);
    }
  };

  const filtered = chapters
    .filter(c => statusFilter === 'ALL' || c.status === statusFilter)
    .sort((a, b) => {
      if (sortConfig === 'deadline') return new Date(a.deadline || 0) - new Date(b.deadline || 0);
      if (sortConfig === 'progress') {
        const pa = a.word_goal ? (a.word_count || 0) / a.word_goal : 0;
        const pb = b.word_goal ? (b.word_count || 0) / b.word_goal : 0;
        return pb - pa;
      }
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meu Capítulo — Novos Autores do Brasil</title></Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Meu Capítulo</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Escreva, gerencie e envie seu capítulo para revisão.</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-white text-sm" style={{ borderColor: `${NAV}20`, color: NAV }}>
              <SelectValue placeholder="Filtrar Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="RASCUNHO">Em edição</SelectItem>
              <SelectItem value="ENVIADO_PARA_REVISAO">Enviado p/ revisão</SelectItem>
              <SelectItem value="AJUSTES_SOLICITADOS">Ajustes solicitados</SelectItem>
              <SelectItem value="APROVADO">Aprovado</SelectItem>
              <SelectItem value="FINALIZADO">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortConfig} onValueChange={setSortConfig}>
            <SelectTrigger className="w-[160px] bg-white text-sm" style={{ borderColor: `${NAV}20`, color: NAV }}>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Prazo (mais próximo)</SelectItem>
              <SelectItem value="progress">Maior progresso</SelectItem>
              <SelectItem value="date">Última edição</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(chapter => {
          const wc       = chapter.word_count || 0;
          const wg       = chapter.word_goal  || 1;
          const progress = Math.min(Math.round((wc / wg) * 100), 100);
          const isEditable = ['RASCUNHO', 'EM_EDICAO', 'AJUSTES_SOLICITADOS'].includes(chapter.status);
          const st = getStatus(chapter.status);
          const remaining = Math.max(0, wg - wc);
          const remColor = remaining === 0 ? '#10B981' : remaining <= wg * 0.3 ? '#F59E0B' : RED;

          return (
            <div
              key={chapter.id}
              className="rounded-2xl overflow-hidden flex flex-col bg-white transition-shadow hover:shadow-md"
              style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
            >
              <div className="p-6 flex-1 flex flex-col">
                {/* Top */}
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: `${NAV}50` }}>
                      {getProjectName(chapter.project_id)}
                    </p>
                    <h3 className="text-lg font-bold leading-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                      {chapter.title || 'Sem título'}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shrink-0"
                    style={{ color: st.text, background: st.bg }}>
                    {st.label}
                  </span>
                </div>

                {/* Progress */}
                <div className="space-y-3 mb-5 flex-1">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-medium" style={{ color: `${NAV}70` }}>Progresso</span>
                      <span className="text-xs font-bold" style={{ color: NAV }}>
                        {wc.toLocaleString()} / {wg.toLocaleString()} palavras ({progress}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${NAV}10` }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: isEditable ? BLUE : '#10B981' }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px]" style={{ color: `${NAV}50` }}>Meta: {wg} palavras</span>
                      <span className="text-[11px] font-medium" style={{ color: remColor }}>
                        {remaining === 0 ? 'Meta atingida!' : `Faltam ${remaining} palavras`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: `${NAV}60` }}>
                    <Clock className="w-3.5 h-3.5" />
                    Prazo: <strong style={{ color: NAV }}>{chapter.deadline ? new Date(chapter.deadline).toLocaleDateString('pt-BR') : 'N/A'}</strong>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${NAV}0A` }}>
                  <p className="text-[11px]" style={{ color: `${NAV}40` }}>
                    Última atualização: {fmtDateTime(chapter.updated_at)}
                  </p>
                  {isEditable ? (
                    <BtnPrimary
                      onClick={() => navigate(`/coauthor/chapters/${chapter.id}/edit`)}
                      icon={Edit3} label="Continuar Escrevendo"
                      className="w-full justify-center"
                    />
                  ) : (
                    <button
                      onClick={() => navigate(`/coauthor/chapters/${chapter.id}/edit`)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: `${NAV}08`, color: NAV, border: `1.5px solid ${NAV}15` }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${NAV}12`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${NAV}08`; }}
                    >
                      <Eye className="w-4 h-4" /> Visualizar Capítulo
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl border-2 border-dashed"
            style={{ borderColor: `${NAV}12`, background: '#fff' }}>
            <PenLine className="w-12 h-12 mx-auto mb-4" style={{ color: `${NAV}25` }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              {statusFilter !== 'ALL' ? 'Nenhum capítulo com este status.' : 'Você ainda não começou a escrever.'}
            </h3>
            <p className="text-sm mb-6" style={{ color: `${NAV}60` }}>
              {statusFilter !== 'ALL'
                ? 'Tente outro filtro ou comece a escrever seu capítulo.'
                : 'Clique abaixo para criar seu capítulo.'}
            </p>
            {statusFilter === 'ALL' && (
              <BtnPrimary
                onClick={handleCreateChapter}
                disabled={creating} loading={creating}
                icon={PenLine} label="Começar a escrever meu capítulo" loadingLabel="Criando..."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoauthorChaptersPage;
