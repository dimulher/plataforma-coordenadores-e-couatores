import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Loader2, Users2, BookOpen, ImageIcon, FileText,
  ExternalLink, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';
import { NAV, BLUE, RED, BrandCard } from '@/lib/brand';

const STATUS_MAP = {
  RASCUNHO:             { label: 'Em Escrita', text: BLUE,      bg: `${BLUE}12` },
  EM_EDICAO:            { label: 'Em Escrita', text: BLUE,      bg: `${BLUE}12` },
  AJUSTES_SOLICITADOS:  { label: 'Ajustes',    text: '#FF6B35', bg: 'rgba(255,107,53,0.10)' },
  ENVIADO_PARA_REVISAO: { label: 'P/ Revisão', text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  EM_REVISAO:           { label: 'Revisão',    text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  APROVADO:             { label: 'Produção',   text: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  PRODUCAO:             { label: 'Produção',   text: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  FINALIZADO:           { label: 'Concluído',  text: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  CONCLUIDO:            { label: 'Concluído',  text: '#10B981', bg: 'rgba(16,185,129,0.10)' },
};

const CoauthorFolder = ({ author, navigate }) => {
  const [activeTab, setActiveTab] = useState('capitulos');
  const [expanded, setExpanded] = useState(false);
  const initials = (author.name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const tabs = [
    { key: 'capitulos', label: 'Capítulos', icon: BookOpen, count: author.chapters.length },
    { key: 'foto',      label: 'Foto',      icon: ImageIcon },
    { key: 'contrato',  label: 'Contrato',  icon: FileText },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white transition-shadow hover:shadow-md"
      style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
    >
      {/* Tab strip */}
      <div className="flex text-xs font-semibold" style={{ borderBottom: `1px solid ${NAV}0C`, background: `${NAV}04` }}>
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setExpanded(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 transition-colors"
            style={{
              borderRight: `1px solid ${NAV}0C`,
              background: activeTab === key && expanded ? 'white' : 'transparent',
              color: activeTab === key && expanded ? BLUE : `${NAV}60`,
            }}
            onMouseEnter={e => { if (!(activeTab === key && expanded)) e.currentTarget.style.color = NAV; }}
            onMouseLeave={e => { if (!(activeTab === key && expanded)) e.currentTarget.style.color = `${NAV}60`; }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${NAV}12`, color: `${NAV}60` }}>
                {count}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setExpanded(v => !v)}
          className="ml-auto px-3 transition-colors"
          style={{ color: `${NAV}40` }}
          onMouseEnter={e => { e.currentTarget.style.color = NAV; }}
          onMouseLeave={e => { e.currentTarget.style.color = `${NAV}40`; }}
          title={expanded ? 'Recolher' : 'Expandir'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {author.avatar_url
            ? <img src={author.avatar_url} className="h-10 w-10 rounded-full object-cover shrink-0" style={{ border: `2px solid ${BLUE}30` }} alt="" />
            : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: `${BLUE}15`, color: BLUE, border: `2px solid ${BLUE}25` }}>
                {initials}
              </div>
            )
          }
          <div>
            <p className="font-bold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{author.name}</p>
            <p className="text-xs" style={{ color: `${NAV}50` }}>{author.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${NAV}08`, color: `${NAV}60`, border: `1px solid ${NAV}10` }}>
            {author.coordinatorName}
          </span>
          <button
            onClick={() => navigate(`/app/admin/coauthors/${author.id}`)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: BLUE, background: `${BLUE}0D` }}
            onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}0D`; }}
          >
            <Eye className="w-3.5 h-3.5" /> Ver perfil
          </button>
        </div>
      </div>

      {/* Expandable */}
      {expanded && (
        <div className="px-5 py-4" style={{ borderTop: `1px solid ${NAV}08`, background: `${NAV}03` }}>
          {activeTab === 'capitulos' && (
            <div className="space-y-2">
              {author.chapters.length === 0 ? (
                <p className="text-sm text-center py-3" style={{ color: `${NAV}50` }}>Nenhum capítulo atribuído.</p>
              ) : (
                author.chapters.map(chap => {
                  const cfg = STATUS_MAP[chap.status] || { label: chap.status, text: `${NAV}60`, bg: `${NAV}08` };
                  return (
                    <div key={chap.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3"
                      style={{ border: `1px solid ${NAV}0C` }}>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[260px]" style={{ color: NAV }}>{chap.title}</p>
                        <p className="text-[10px] uppercase mt-0.5 font-bold tracking-wider" style={{ color: `${NAV}40` }}>{chap.projectName || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.text, background: cfg.bg }}>{cfg.label}</span>
                        <button
                          onClick={() => navigate(`/app/admin/chapters/${chap.id}/review`)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: `${NAV}50` }}
                          onMouseEnter={e => { e.currentTarget.style.color = BLUE; e.currentTarget.style.background = `${BLUE}10`; }}
                          onMouseLeave={e => { e.currentTarget.style.color = `${NAV}50`; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'foto' && (
            <div className="flex flex-col items-center gap-3 py-4">
              {author.avatar_url ? (
                <>
                  <img src={author.avatar_url} className="h-28 w-28 rounded-full object-cover shadow"
                    style={{ border: `3px solid ${BLUE}30` }} alt={author.name} />
                  <p className="text-xs" style={{ color: `${NAV}50` }}>Foto de perfil cadastrada</p>
                  <a href={author.avatar_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium" style={{ color: BLUE }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir imagem
                  </a>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2" style={{ color: `${NAV}30` }}>
                  <ImageIcon className="w-10 h-10" />
                  <p className="text-sm" style={{ color: `${NAV}50` }}>Nenhuma foto cadastrada</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contrato' && (
            <div className="flex flex-col items-center gap-3 py-4">
              {author.contract_url ? (
                <>
                  <FileText className="w-10 h-10" style={{ color: BLUE }} />
                  <p className="text-sm font-medium" style={{ color: NAV }}>Contrato disponível</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={
                        author.contract_status === 'ASSINADO'
                          ? { background: 'rgba(16,185,129,0.10)', color: '#10B981' }
                          : { background: 'rgba(245,158,11,0.10)', color: '#F59E0B' }
                      }
                    >
                      {author.contract_status === 'ASSINADO' ? 'Assinado' : author.contract_status || 'Enviado'}
                    </span>
                    <a href={author.contract_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium" style={{ color: BLUE }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir contrato
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2" style={{ color: `${NAV}30` }}>
                  <FileText className="w-10 h-10" />
                  <p className="text-sm" style={{ color: `${NAV}50` }}>Nenhum contrato cadastrado</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminCoauthorsPage = () => {
  const navigate = useNavigate();
  const [coauthors, setCoauthors] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [coordFilter, setCoordFilter] = useState('ALL');

  const fetchCoauthors = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: coordRaw }, { data: coauthorRaw, error }] = await Promise.all([
        supabase.from('profiles').select('id, name, email, avatar_url, contract_url, contract_status').eq('role', 'COORDENADOR').order('name'),
        supabase.from('profiles').select('id, name, email, avatar_url, coordinator_id, contract_url, contract_status').eq('role', 'COAUTOR').order('name'),
      ]);
      if (error) throw error;

      const coordMap = {};
      (coordRaw || []).forEach(c => { coordMap[c.id] = c.name; });
      setCoordinators((coordRaw || []).map(c => ({ id: c.id, name: c.name })));

      const allProfiles = [
        ...(coauthorRaw || []).map(c => ({ ...c, role: 'COAUTOR' })),
        ...(coordRaw || []).map(c => ({ ...c, role: 'COORDENADOR', coordinator_id: c.id })),
      ].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      const ids = allProfiles.map(p => p.id);
      const { data: chapters } = ids.length > 0
        ? await supabase.from('chapters').select('id, author_id, title, status, project:project_id(name)').in('author_id', ids)
        : { data: [] };

      setCoauthors(allProfiles.map(author => ({
        ...author,
        coordinatorName: author.role === 'COORDENADOR' ? author.name : (coordMap[author.coordinator_id] || 'Sem Coordenador'),
        coordId: author.coordinator_id || null,
        chapters: (chapters || [])
          .filter(c => c.author_id === author.id)
          .map(c => ({ ...c, projectName: c.project?.name || '—' })),
      })));
    } catch (err) {
      console.error('AdminCoauthorsPage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoauthors(); }, [fetchCoauthors]);

  const filtered = coauthors.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.coordinatorName || '').toLowerCase().includes(term);
    const matchCoord = coordFilter === 'ALL' || c.coordId === coordFilter;
    return matchSearch && matchCoord;
  });

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Gestão de Coautores — Novos Autores do Brasil</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Coautores</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Pastas individuais com capítulos, foto e contrato de cada autor.</p>
        </div>
        <span
          className="text-sm font-semibold px-4 py-2 rounded-xl"
          style={{ background: `${BLUE}12`, color: BLUE, border: `1px solid ${BLUE}25` }}
        >
          {coauthors.length} cadastrado{coauthors.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div
        className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-white"
        style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
          <Input
            placeholder="Buscar por nome, email ou coordenador..."
            className="pl-9 text-sm"
            style={{ borderColor: `${NAV}20`, color: NAV, background: `${NAV}04` }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={coordFilter} onValueChange={setCoordFilter}>
          <SelectTrigger className="w-full md:w-64 text-sm bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
            <SelectValue placeholder="Filtrar por Coordenador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Coordenadores</SelectItem>
            {coordinators.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${NAV}12`, background: 'white' }}>
          <Users2 className="h-12 w-12 mb-3" style={{ color: `${NAV}25` }} />
          <p className="font-medium" style={{ color: `${NAV}60` }}>Nenhum coautor encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(author => (
            <CoauthorFolder key={author.id} author={author} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCoauthorsPage;
