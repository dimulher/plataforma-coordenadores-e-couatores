
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoordinatorObservationModal } from '@/components/CoordinatorObservationModal';
import { Search, ArrowUpDown, Users } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader } from '@/lib/brand';

const timeAgo = (dateStr) => {
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)} dias`;
};

const STATUS_MAP = {
  RASCUNHO:             { label: 'Em escrita',  text: BLUE,      bg: `${BLUE}12` },
  EM_EDICAO:            { label: 'Em escrita',  text: BLUE,      bg: `${BLUE}12` },
  AJUSTES_SOLICITADOS:  { label: 'Ajustes',     text: '#FF6B35', bg: 'rgba(255,107,53,0.10)' },
  ENVIADO_PARA_REVISAO: { label: 'Em revisão',  text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  EM_REVISAO:           { label: 'Em revisão',  text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  APROVADO:             { label: 'Revisado',    text: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  PRODUCAO:             { label: 'Produção',    text: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  FINALIZADO:           { label: 'Concluído',   text: `${NAV}70`, bg: `${NAV}08` },
  CONCLUIDO:            { label: 'Concluído',   text: `${NAV}70`, bg: `${NAV}08` },
};

const getStatus = (s) => STATUS_MAP[s] || { label: s || 'Sem status', text: `${NAV}60`, bg: `${NAV}08` };

const CoordinatorCoauthorsPage = () => {
  const { getCoauthorsList, addObservation, loading } = useCoordinatorData();
  const navigate = useNavigate();
  const [coauthors, setCoauthors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deadlineFilter, setDeadlineFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'deadline', direction: 'asc' });
  const [selectedCoauthor, setSelectedCoauthor] = useState(null);

  const loadData = async () => {
    const data = await getCoauthorsList();
    if (data) setCoauthors(data);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getDaysRem = (date) => Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const filtered = coauthors.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.projectNames.toLowerCase().includes(searchTerm.toLowerCase());

    let matchStatus = true;
    if (statusFilter !== 'ALL') {
      const st = c.currentChapter?.status;
      if (statusFilter === 'EM_ESCRITA' && !['RASCUNHO', 'EM_EDICAO', 'AJUSTES_SOLICITADOS'].includes(st)) matchStatus = false;
      if (statusFilter === 'EM_REVISAO' && !['ENVIADO_PARA_REVISAO', 'EM_REVISAO'].includes(st)) matchStatus = false;
      if (statusFilter === 'REVISADO' && st !== 'APROVADO') matchStatus = false;
      if (statusFilter === 'PRODUCAO' && st !== 'PRODUCAO') matchStatus = false;
      if (statusFilter === 'CONCLUIDO' && !['FINALIZADO', 'CONCLUIDO'].includes(st)) matchStatus = false;
    }

    let matchDeadline = true;
    if (deadlineFilter !== 'ALL' && c.currentChapter) {
      const days = getDaysRem(c.currentChapter.deadline);
      if (deadlineFilter === 'ATRASADOS' && days < 0) matchDeadline = true;
      else if (deadlineFilter === '7DIAS' && days >= 0 && days <= 7) matchDeadline = true;
      else if (deadlineFilter === '30DIAS' && days >= 0 && days <= 30) matchDeadline = true;
      else matchDeadline = false;
    } else if (deadlineFilter !== 'ALL') {
      matchDeadline = false;
    }

    return matchSearch && matchStatus && matchDeadline;
  }).sort((a, b) => {
    if (sortConfig.key === 'deadline') {
      const d1 = a.currentChapter ? new Date(a.currentChapter.deadline).getTime() : 9999999999999;
      const d2 = b.currentChapter ? new Date(b.currentChapter.deadline).getTime() : 9999999999999;
      return sortConfig.direction === 'asc' ? d1 - d2 : d2 - d1;
    }
    if (sortConfig.key === 'progress') return sortConfig.direction === 'asc' ? a.progress - b.progress : b.progress - a.progress;
    if (sortConfig.key === 'lastUpdate') {
      const d1 = new Date(a.lastUpdate).getTime();
      const d2 = new Date(b.lastUpdate).getTime();
      return sortConfig.direction === 'asc' ? d1 - d2 : d2 - d1;
    }
    return 0;
  });

  const handleSaveObservation = async (obs) => {
    if (selectedCoauthor) { await addObservation(selectedCoauthor.id, obs); loadData(); }
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meus Coautores — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Meus Coautores</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Acompanhe a produção, prazos e gerencie a comunicação com a equipe.</p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-white"
        style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
          <Input
            placeholder="Buscar por coautor ou projeto..."
            className="pl-9 text-sm"
            style={{ borderColor: `${NAV}20`, color: NAV, background: `${NAV}04` }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 text-sm bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
            <SelectValue placeholder="Por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Status</SelectItem>
            <SelectItem value="EM_ESCRITA">Em escrita</SelectItem>
            <SelectItem value="EM_REVISAO">Em revisão</SelectItem>
            <SelectItem value="REVISADO">Revisado</SelectItem>
            <SelectItem value="PRODUCAO">Produção</SelectItem>
            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
          <SelectTrigger className="w-full md:w-48 text-sm bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
            <SelectValue placeholder="Por Prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Prazos</SelectItem>
            <SelectItem value="ATRASADOS">Atrasados</SelectItem>
            <SelectItem value="7DIAS">Próximos 7 dias</SelectItem>
            <SelectItem value="30DIAS">Próximos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <BrandCard>
        <BrandCardHeader icon={Users} iconColor={BLUE} accentColor={BLUE} title={`${filtered.length} coautor${filtered.length !== 1 ? 'es' : ''}`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr style={{ background: `${NAV}04`, borderBottom: `1px solid ${NAV}0C` }}>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}50` }}>Nome do Coautor</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}50` }}>Status do Capítulo</th>
                <th
                  className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: `${NAV}50` }}
                  onClick={() => handleSort('deadline')}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Prazo <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const chap = c.currentChapter;
                const daysRem = chap ? getDaysRem(chap.deadline) : null;
                const st = getStatus(chap?.status);

                return (
                  <tr
                    key={c.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid ${NAV}08` }}
                    onClick={() => navigate(`/coordinator/coauthors/${c.id}`)}
                    onMouseEnter={e => { e.currentTarget.style.background = `${NAV}04`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-6 py-4 font-semibold" style={{ color: NAV }}>{c.name}</td>
                    <td className="px-6 py-4">
                      {chap ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${NAV}40` }}>{c.projectNames}</span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full w-fit" style={{ color: st.text, background: st.bg }}>{st.label}</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: `${NAV}40` }}>Sem capítulo ativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {chap ? (
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
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-sm" style={{ color: `${NAV}50` }}>
                    Nenhum coautor encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BrandCard>

      <CoordinatorObservationModal
        isOpen={!!selectedCoauthor}
        onClose={() => setSelectedCoauthor(null)}
        onSave={handleSaveObservation}
        coauthorName={selectedCoauthor?.name}
      />
    </div>
  );
};

export default CoordinatorCoauthorsPage;
