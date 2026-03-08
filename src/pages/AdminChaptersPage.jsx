
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Download, Loader2 } from 'lucide-react';

const STATUS_MAP = {
  RASCUNHO:              { label: 'Em Escrita',          color: 'bg-slate-100 text-slate-700 border-slate-300' },
  EM_EDICAO:             { label: 'Em Escrita',          color: 'bg-slate-100 text-slate-700 border-slate-300' },
  AJUSTES_SOLICITADOS:   { label: 'Em Escrita',          color: 'bg-red-100 text-red-700 border-red-200' },
  ENVIADO_PARA_REVISAO:  { label: 'Entregue p/ Revisão', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  EM_REVISAO:            { label: 'Revisão',             color: 'bg-orange-100 text-orange-800 border-orange-200' },
  APROVADO:              { label: 'Produção',            color: 'bg-blue-100 text-blue-800 border-blue-200' },
  PRODUCAO:              { label: 'Produção',            color: 'bg-blue-100 text-blue-800 border-blue-200' },
  FINALIZADO:            { label: 'Concluído',           color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CONCLUIDO:             { label: 'Concluído',           color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.RASCUNHO;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL',                   label: 'Todos os Status' },
  { value: 'EM_ESCRITA',            label: 'Em Escrita' },
  { value: 'ENVIADO_PARA_REVISAO',  label: 'Entregue p/ Revisão' },
  { value: 'EM_REVISAO',            label: 'Revisão' },
  { value: 'APROVADO',              label: 'Produção' },
  { value: 'FINALIZADO',            label: 'Concluído' },
];

const STATUS_FILTER_MAP = {
  EM_ESCRITA: ['RASCUNHO', 'EM_EDICAO', 'AJUSTES_SOLICITADOS'],
  ENVIADO_PARA_REVISAO: ['ENVIADO_PARA_REVISAO'],
  EM_REVISAO: ['EM_REVISAO'],
  APROVADO: ['APROVADO', 'PRODUCAO'],
  FINALIZADO: ['FINALIZADO', 'CONCLUIDO'],
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
      // 1. Capítulos com autor e projeto
      const { data: chapData, error: chapError } = await supabase
        .from('chapters')
        .select('id, title, status, content_text, author:author_id(id, name, coordinator_id), project:project_id(name)')
        .order('created_at', { ascending: false });

      if (chapError) throw chapError;

      // 2. Busca todos os coordenadores (role = 'COORDENADOR')
      const { data: coordData } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'COORDENADOR')
        .order('name');
      const coordMap = {};
      (coordData || []).forEach(c => { coordMap[c.id] = c.name; });
      setCoordinators(coordData || []);

      // 3. Enriquece capítulos
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

    const matchStatus = statusFilter === 'ALL' ||
      (STATUS_FILTER_MAP[statusFilter] || []).includes(c.status);

    const matchCoord = coordFilter === 'ALL' || c.coordId === coordFilter;

    return matchSearch && matchStatus && matchCoord;
  });

  return (
    <div className="space-y-6 max-w-full mx-auto">
      <Helmet><title>Produção Editorial - NAB Platform</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold text-slate-800">Produção Editorial</h1>
        <p className="text-slate-500 mt-1">Visão completa de todos os capítulos e status de entrega.</p>
      </div>

      {/* Filtros */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por capítulo ou coautor..."
              className="pl-9 bg-slate-50 border-slate-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-52">
            <Select value={coordFilter} onValueChange={setCoordFilter}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder="Filtrar por Coordenador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Coordenadores</SelectItem>
                {coordinators.map(coord => (
                  <SelectItem key={coord.id} value={coord.id}>{coord.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-52">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">Coautor</th>
                  <th className="px-5 py-4">Capítulo</th>
                  <th className="px-5 py-4">Coordenador</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{c.authorName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700 max-w-[220px] truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase mt-0.5 truncate max-w-[220px]">{c.projectName}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {c.coordName}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs gap-1"
                          onClick={() => navigate(`/app/admin/chapters/${c.id}/review`)}
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs gap-1"
                          onClick={() => handleDownload(c)}
                          disabled={!c.content_text}
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      Nenhum capítulo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminChaptersPage;
