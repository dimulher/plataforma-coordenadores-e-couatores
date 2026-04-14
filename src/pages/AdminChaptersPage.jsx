
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Download, Loader2, BookOpen } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader, BtnOutline } from '@/lib/brand';

const STATUS_MAP = {
  RASCUNHO:             { label: 'Em Escrita',          text: BLUE,      bg: `${BLUE}12` },
  EM_EDICAO:            { label: 'Em Escrita',          text: BLUE,      bg: `${BLUE}12` },
  AJUSTES_SOLICITADOS:  { label: 'Ajustes',             text: '#FF6B35', bg: 'rgba(255,107,53,0.10)' },
  ENVIADO_PARA_REVISAO: { label: 'P/ Revisão',          text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  EM_REVISAO:           { label: 'Revisão',             text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  APROVADO:             { label: 'Produção',            text: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  PRODUCAO:             { label: 'Produção',            text: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  FINALIZADO:           { label: 'Concluído',           text: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  CONCLUIDO:            { label: 'Concluído',           text: '#10B981', bg: 'rgba(16,185,129,0.10)' },
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL',                  label: 'Todos os Status' },
  { value: 'EM_ESCRITA',           label: 'Em Escrita' },
  { value: 'ENVIADO_PARA_REVISAO', label: 'P/ Revisão' },
  { value: 'EM_REVISAO',           label: 'Revisão' },
  { value: 'APROVADO',             label: 'Produção' },
  { value: 'FINALIZADO',           label: 'Concluído' },
];

const STATUS_FILTER_MAP = {
  EM_ESCRITA:           ['RASCUNHO', 'EM_EDICAO', 'AJUSTES_SOLICITADOS'],
  ENVIADO_PARA_REVISAO: ['ENVIADO_PARA_REVISAO'],
  EM_REVISAO:           ['EM_REVISAO'],
  APROVADO:             ['APROVADO', 'PRODUCAO'],
  FINALIZADO:           ['FINALIZADO', 'CONCLUIDO'],
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || { label: status || '—', text: `${NAV}60`, bg: `${NAV}08` };
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.text, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
};

const AdminChaptersPage = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [coordFilter, setCoordFilter] = useState('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: chapData, error: chapError } = await supabase
        .from('chapters')
        .select('id, title, status, content_text, author:author_id(id, name, coordinator_id), project:project_id(name)')
        .order('created_at', { ascending: false });
      if (chapError) throw chapError;

      const { data: coordData } = await supabase.from('profiles').select('id, name').eq('role', 'COORDENADOR').order('name');
      const coordMap = {};
      (coordData || []).forEach(c => { coordMap[c.id] = c.name; });
      setCoordinators(coordData || []);

      setChapters((chapData || []).map(c => ({
        ...c,
        authorName: c.author?.name || '—',
        coordName: coordMap[c.author?.coordinator_id] || '—',
        coordId: c.author?.coordinator_id || null,
        projectName: c.project?.name || '—',
      })));
    } catch (err) {
      console.error('Error fetching chapters:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownload = (chapter) => {
    const text = chapter.content_text || '(sem conteúdo)';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chapter.title || 'capitulo'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = chapters.filter(c => {
    const matchSearch =
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (STATUS_FILTER_MAP[statusFilter] || []).includes(c.status);
    const matchCoord = coordFilter === 'ALL' || c.coordId === coordFilter;
    return matchSearch && matchStatus && matchCoord;
  });

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Produção Editorial — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Produção Editorial</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Visão completa de todos os capítulos e status de entrega.</p>
      </div>

      {/* Filtros */}
      <div
        className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-white"
        style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
          <Input
            placeholder="Buscar por capítulo ou coautor..."
            className="pl-9 text-sm"
            style={{ borderColor: `${NAV}20`, color: NAV, background: `${NAV}04` }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={coordFilter} onValueChange={setCoordFilter}>
          <SelectTrigger className="w-full md:w-52 text-sm bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
            <SelectValue placeholder="Por Coordenador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Coordenadores</SelectItem>
            {coordinators.map(coord => (
              <SelectItem key={coord.id} value={coord.id}>{coord.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-52 text-sm bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
            <SelectValue placeholder="Por Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <BrandCard>
        <BrandCardHeader icon={BookOpen} iconColor={BLUE} accentColor={BLUE} title={`${filtered.length} capítulo${filtered.length !== 1 ? 's' : ''}`} />
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: `${NAV}04`, borderBottom: `1px solid ${NAV}0C` }}>
                  {['Coautor', 'Capítulo', 'Coordenador', 'Status', 'Ações'].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${i >= 3 ? 'text-center' : 'text-left'}`}
                      style={{ color: `${NAV}50` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr
                    key={c.id}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${NAV}08` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${NAV}04`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-5 py-4 font-semibold" style={{ color: NAV }}>{c.authorName}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium max-w-[220px] truncate" style={{ color: NAV }}>{c.title}</p>
                      <p className="text-[10px] uppercase mt-0.5 truncate max-w-[220px]" style={{ color: `${NAV}40` }}>{c.projectName}</p>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: `${NAV}70` }}>{c.coordName}</td>
                    <td className="px-5 py-4 text-center"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <BtnOutline
                          onClick={() => navigate(`/app/admin/chapters/${c.id}/review`)}
                          icon={Eye} label="Ver" color={BLUE}
                          className="px-3 py-1.5 text-xs"
                        />
                        <BtnOutline
                          onClick={() => handleDownload(c)}
                          icon={Download} label="Baixar" color={NAV}
                          className="px-3 py-1.5 text-xs"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-sm" style={{ color: `${NAV}50` }}>
                      Nenhum capítulo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </BrandCard>
    </div>
  );
};

export default AdminChaptersPage;
