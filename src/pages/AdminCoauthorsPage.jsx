import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search, Loader2, Users2, BookOpen, ImageIcon, FileText,
  ExternalLink, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';

const STATUS_MAP = {
  RASCUNHO:             { label: 'Em Escrita',          color: 'bg-slate-100 text-slate-700' },
  EM_EDICAO:            { label: 'Em Escrita',          color: 'bg-slate-100 text-slate-700' },
  AJUSTES_SOLICITADOS:  { label: 'Ajustes',             color: 'bg-red-100 text-red-700' },
  ENVIADO_PARA_REVISAO: { label: 'P/ Revisão',          color: 'bg-yellow-100 text-yellow-800' },
  EM_REVISAO:           { label: 'Revisão',             color: 'bg-orange-100 text-orange-800' },
  APROVADO:             { label: 'Produção',            color: 'bg-blue-100 text-blue-800' },
  PRODUCAO:             { label: 'Produção',            color: 'bg-blue-100 text-blue-800' },
  FINALIZADO:           { label: 'Concluído',           color: 'bg-emerald-100 text-emerald-800' },
  CONCLUIDO:            { label: 'Concluído',           color: 'bg-emerald-100 text-emerald-800' },
};

const TABS = ['capitulos', 'foto', 'contrato'];

const CoauthorFolder = ({ author, navigate }) => {
  const [activeTab, setActiveTab] = useState('capitulos');
  const [expanded, setExpanded] = useState(false);

  const initials = (author.name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
      {/* Folder tab strip */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
        <button
          onClick={() => { setActiveTab('capitulos'); setExpanded(true); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-r border-slate-200 transition-colors ${activeTab === 'capitulos' && expanded ? 'bg-white text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Capítulos
          <span className="ml-1 bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-[10px]">{author.chapters.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('foto'); setExpanded(true); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-r border-slate-200 transition-colors ${activeTab === 'foto' && expanded ? 'bg-white text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Foto
        </button>
        <button
          onClick={() => { setActiveTab('contrato'); setExpanded(true); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-r border-slate-200 transition-colors ${activeTab === 'contrato' && expanded ? 'bg-white text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-3.5 h-3.5" /> Contrato
        </button>
        <button
          onClick={() => setExpanded(v => !v)}
          className="ml-auto px-3 text-slate-400 hover:text-slate-600 transition-colors"
          title={expanded ? 'Recolher' : 'Expandir'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Card header: coautor info */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {author.avatar_url
            ? <img src={author.avatar_url} className="h-10 w-10 rounded-full object-cover border border-slate-200" alt="" />
            : <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0 border border-blue-200">
                {initials}
              </div>
          }
          <div>
            <p className="font-bold text-slate-800">{author.name}</p>
            <p className="text-xs text-slate-400">{author.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
            {author.coordinatorName}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-blue-600 hover:bg-blue-50 text-xs"
            onClick={() => navigate(`/app/admin/coauthors/${author.id}`)}
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> Ver perfil
          </Button>
        </div>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
          {/* CAPÍTULOS */}
          {activeTab === 'capitulos' && (
            <div className="space-y-2">
              {author.chapters.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-3">Nenhum capítulo atribuído.</p>
              ) : (
                author.chapters.map(chap => {
                  const cfg = STATUS_MAP[chap.status] || STATUS_MAP.RASCUNHO;
                  return (
                    <div key={chap.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800 truncate max-w-[260px]">{chap.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase mt-0.5">{chap.projectName || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-blue-600 p-1 h-auto"
                          onClick={() => navigate(`/app/admin/chapters/${chap.id}/review`)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* FOTO */}
          {activeTab === 'foto' && (
            <div className="flex flex-col items-center gap-3 py-4">
              {author.avatar_url ? (
                <>
                  <img
                    src={author.avatar_url}
                    className="h-28 w-28 rounded-full object-cover border-2 border-slate-200 shadow"
                    alt={author.name}
                  />
                  <p className="text-xs text-slate-500">Foto de perfil cadastrada</p>
                  <a
                    href={author.avatar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir imagem
                  </a>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageIcon className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Nenhuma foto cadastrada</p>
                </div>
              )}
            </div>
          )}

          {/* CONTRATO */}
          {activeTab === 'contrato' && (
            <div className="flex flex-col items-center gap-3 py-4">
              {author.contract_url ? (
                <>
                  <FileText className="w-10 h-10 text-blue-400" />
                  <p className="text-sm text-slate-600 font-medium">Contrato disponível</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      author.contract_status === 'ASSINADO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {author.contract_status === 'ASSINADO' ? 'Assinado' : author.contract_status || 'Enviado'}
                    </span>
                    <a
                      href={author.contract_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir contrato
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <FileText className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Nenhum contrato cadastrado</p>
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
      // Busca coordenadores via RPC (contorna RLS)
      const { data: coordRpc } = await supabase.rpc('get_all_coordinators_admin');
      const coordProfiles = (coordRpc || []).map(c => ({ id: c.id, name: c.name }));
      const coordMap = {};
      coordProfiles.forEach(c => { coordMap[c.id] = c.name; });
      setCoordinators(coordProfiles);

      // Busca coautores via RPC (contorna RLS)
      const { data: coauthorRpc, error } = await supabase.rpc('get_all_coauthors_admin');
      if (error) throw error;
      const coauthorProfiles = (coauthorRpc || []).map(c => ({ ...c, role: 'COAUTOR' }));

      // Coordenadores com dados completos (do RPC)
      const coordAuthors = (coordRpc || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        avatar_url: c.avatar_url,
        coordinator_id: c.id,
        contract_url: c.contract_url || null,
        contract_status: c.contract_status || null,
        role: 'COORDENADOR',
      }));

      const allProfiles = [...(coauthorProfiles || []), ...coordAuthors]
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      const ids = allProfiles.map(p => p.id);

      // Busca capítulos com projeto
      const { data: chapters } = ids.length > 0
        ? await supabase
            .from('chapters')
            .select('id, author_id, title, status, project:project_id(name)')
            .in('author_id', ids)
        : { data: [] };

      const enriched = allProfiles.map(author => ({
        ...author,
        coordinatorName: author.role === 'COORDENADOR' ? author.name : (coordMap[author.coordinator_id] || 'Sem Coordenador'),
        coordId: author.coordinator_id || null,
        chapters: (chapters || [])
          .filter(c => c.author_id === author.id)
          .map(c => ({ ...c, projectName: c.project?.name || '—' })),
      }));

      setCoauthors(enriched);
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
      <Helmet><title>Gestão de Coautores - NAB Platform</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Coautores</h1>
          <p className="text-slate-500 mt-1">Pastas individuais com capítulos, foto e contrato de cada autor.</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 font-medium">
          {coauthors.length} coautor{coauthors.length !== 1 ? 'es' : ''} cadastrado{coauthors.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, email ou coordenador..."
            className="pl-9 bg-white border-slate-200"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={coordFilter} onValueChange={setCoordFilter}>
          <SelectTrigger className="w-full md:w-64 bg-white border-slate-200">
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

      {/* Lista de pastas */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users2 className="h-12 w-12 opacity-20 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum coautor encontrado.</p>
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
