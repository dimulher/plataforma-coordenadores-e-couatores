import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Search, FileText, Loader2, ChevronDown, ChevronUp, Users2 } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader } from '@/lib/brand';

const STATUS_LABELS = {
  RASCUNHO:                     'Rascunho',
  EM_EDICAO:                    'Em Edição',
  AJUSTES_SOLICITADOS:          'Ajustes Solicitados',
  ENVIADO_PARA_REVISAO:         'Enviado p/ Revisão',
  EM_REVISAO:                   'Em Revisão',
  AGUARDANDO_APROVACAO_COAUTOR: 'Aguard. Aprovação',
  APROVADO:                     'Aprovado',
  PRODUCAO:                     'Em Produção',
  FINALIZADO:                   'Finalizado',
  CONCLUIDO:                    'Concluído',
};

const STATUS_COLORS = {
  RASCUNHO:                     `${NAV}40`,
  EM_EDICAO:                    BLUE,
  AJUSTES_SOLICITADOS:          '#F59E0B',
  ENVIADO_PARA_REVISAO:         '#8B5CF6',
  EM_REVISAO:                   '#EC4899',
  AGUARDANDO_APROVACAO_COAUTOR: '#7C3AED',
  APROVADO:                     '#10B981',
  PRODUCAO:                     '#059669',
  FINALIZADO:                   '#065F46',
  CONCLUIDO:                    '#047857',
};

const CSCoauthorsPage = () => {
  const [chapters, setChapters]       = useState([]);
  const [coauthors, setCoauthors]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField]     = useState('author_name');
  const [sortAsc, setSortAsc]         = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: chaps }, { data: coauths }] = await Promise.all([
      supabase.rpc('get_all_chapters_cs'),
      supabase.rpc('get_all_coauthors_cs'),
    ]);
    setChapters(chaps || []);
    setCoauthors(coauths || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Merge coautores com seus capítulos
  const rows = coauthors.map(ca => {
    const ch = chapters.find(c => c.author_id === ca.id);
    return {
      id:           ca.id,
      name:         ca.name,
      email:        ca.email,
      chapterTitle: ch?.title || '—',
      status:       ch?.status || null,
      wordCount:    ch?.word_count ?? 0,
      wordGoal:     ch?.word_goal ?? 1500,
      deadline:     ch?.deadline || null,
      updatedAt:    ch?.updated_at || ca.created_at,
    };
  });

  const filtered = rows
    .filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const matchStatus = !filterStatus || r.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let va = a[sortField] || '';
      let vb = b[sortField] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortField === field) setSortAsc(s => !s);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }) => sortField === field
    ? (sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)
    : null;

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Coautores — CS | Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Coautores</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Visão geral de todos os coautores e o status dos seus capítulos</p>
      </div>

      <BrandCard>
        <BrandCardHeader icon={Users2} iconColor={BLUE} accentColor={BLUE} title={`${filtered.length} coautores`} />

        {/* Filtros */}
        <div className="px-5 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{ border: `1.5px solid ${NAV}18`, color: NAV, background: 'white', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
              onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1.5px solid ${NAV}18`, color: NAV, background: 'white', outline: 'none' }}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${NAV}12` }}>
                {[
                  { field: 'name',      label: 'Coautor' },
                  { field: 'status',    label: 'Status do Capítulo' },
                  { field: 'wordCount', label: 'Palavras' },
                  { field: 'deadline',  label: 'Prazo' },
                  { field: 'updatedAt', label: 'Última Atualização' },
                ].map(col => (
                  <th
                    key={col.field}
                    className="text-left pb-3 pr-4 font-semibold cursor-pointer select-none"
                    style={{ color: `${NAV}60`, fontFamily: 'Poppins, sans-serif', fontSize: 11 }}
                    onClick={() => toggleSort(col.field)}
                  >
                    {col.label}<SortIcon field={col.field} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm italic" style={{ color: `${NAV}40` }}>Nenhum coautor encontrado.</td></tr>
              ) : filtered.map(r => {
                const isLate = r.deadline && new Date(r.deadline) < new Date() && r.status && !['APROVADO','PRODUCAO','FINALIZADO','CONCLUIDO'].includes(r.status);
                const pct = r.wordGoal > 0 ? Math.min(100, Math.round((r.wordCount / r.wordGoal) * 100)) : 0;
                return (
                  <tr
                    key={r.id}
                    style={{ borderBottom: `1px solid ${NAV}08` }}
                    className="transition-colors"
                    onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}06`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="py-3 pr-4">
                      <p className="font-semibold" style={{ color: NAV }}>{r.name}</p>
                      <p className="text-xs" style={{ color: `${NAV}50` }}>{r.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      {r.status ? (
                        <span
                          className="text-[10px] font-bold px-2 py-1 rounded-lg"
                          style={{
                            background: `${STATUS_COLORS[r.status] || BLUE}18`,
                            color: STATUS_COLORS[r.status] || BLUE,
                          }}
                        >
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      ) : (
                        <span className="text-xs italic" style={{ color: `${NAV}35` }}>Sem capítulo</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: `${NAV}10` }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? '#10B981' : BLUE }} />
                        </div>
                        <span className="text-xs" style={{ color: `${NAV}60` }}>{r.wordCount}/{r.wordGoal}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {r.deadline ? (
                        <span className="text-xs" style={{ color: isLate ? RED : `${NAV}60` }}>
                          {new Date(r.deadline).toLocaleDateString('pt-BR')}
                          {isLate && ' ⚠'}
                        </span>
                      ) : <span className="text-xs" style={{ color: `${NAV}35` }}>—</span>}
                    </td>
                    <td className="py-3">
                      <span className="text-xs" style={{ color: `${NAV}50` }}>
                        {new Date(r.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </BrandCard>
    </div>
  );
};

export default CSCoauthorsPage;
