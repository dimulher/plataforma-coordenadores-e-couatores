
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoordinatorObservationModal } from '@/components/CoordinatorObservationModal';
import { Search, ArrowUpDown } from 'lucide-react';

const timeAgo = (dateStr) => {
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)} dias`;
};

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

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div></div>;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getDaysRem = (date) => Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

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
      else if (deadlineFilter === '7DIAS' && (days >= 0 && days <= 7)) matchDeadline = true;
      else if (deadlineFilter === '30DIAS' && (days >= 0 && days <= 30)) matchDeadline = true;
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
    if (sortConfig.key === 'progress') {
      return sortConfig.direction === 'asc' ? a.progress - b.progress : b.progress - a.progress;
    }
    if (sortConfig.key === 'lastUpdate') {
      const d1 = new Date(a.lastUpdate).getTime();
      const d2 = new Date(b.lastUpdate).getTime();
      return sortConfig.direction === 'asc' ? d1 - d2 : d2 - d1;
    }
    return 0;
  });

  const handleSaveObservation = async (obs) => {
    if (selectedCoauthor) {
      await addObservation(selectedCoauthor.id, obs);
      loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-full mx-auto">
      <Helmet><title>Meus Coautores - NAB Platform</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold text-slate-800">Meus Coautores</h1>
        <p className="text-slate-500 mt-1">Acompanhe a produção individual, prazos e gerencie a comunicação com a equipe.</p>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por coautor ou projeto..."
              className="pl-9 bg-slate-50 border-slate-200 text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-800"><SelectValue placeholder="Por Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="EM_ESCRITA">Em escrita</SelectItem>
                <SelectItem value="EM_REVISAO">Em revisão</SelectItem>
                <SelectItem value="REVISADO">Revisado</SelectItem>
                <SelectItem value="PRODUCAO">Produção</SelectItem>
                <SelectItem value="CONCLUIDO">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-800"><SelectValue placeholder="Por Prazo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Prazos</SelectItem>
                <SelectItem value="ATRASADOS">Atrasados</SelectItem>
                <SelectItem value="7DIAS">Próximos 7 dias</SelectItem>
                <SelectItem value="30DIAS">Próximos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nome do Coautor</th>
                <th className="px-6 py-4">Status do Capítulo</th>
                <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('deadline')}>
                  <div className="flex items-center justify-center gap-1">Prazo <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => {
                const chap = c.currentChapter;
                const daysRem = chap ? getDaysRem(chap.deadline) : null;
                const statusDisplay = getStatusDisplay(chap?.status);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 cursor-pointer transition-all duration-200" onClick={() => navigate(`/coordinator/coauthors/${c.id}`)}>
                    <td className="px-6 py-5 font-semibold text-slate-800 align-middle">{c.name}</td>
                    <td className="px-6 py-5 align-middle">
                      {chap ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] text-slate-500 font-medium uppercase truncate">{c.projectNames}</p>
                          <div className={`text-xs font-bold px-3 py-1 rounded-full border w-fit ${statusDisplay.color}`}>
                            {statusDisplay.label}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Sem capítulo ativo</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center align-middle">
                      {chap ? (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${daysRem < 0 ? 'bg-red-50 text-red-600 border border-red-100' : daysRem <= 7 ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                          {new Date(chap.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-500">Nenhum coautor encontrado com os filtros atuais.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

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
