
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoordinatorObservationModal } from '@/components/CoordinatorObservationModal';
import { Search, Users } from 'lucide-react';
import { NAV, BLUE, BrandCard, BrandCardHeader } from '@/lib/brand';


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

const getStatus = (s) => STATUS_MAP[s] || { label: s || 'Sem status', text: `${NAV}85`, bg: `${NAV}08` };

const CoordinatorCoauthorsPage = () => {
  const { getCoauthorsList, addObservation, loading } = useCoordinatorData();

  const [coauthors, setCoauthors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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

    return matchSearch && matchStatus;
  });

  const handleSaveObservation = async (obs) => {
    if (selectedCoauthor) { await addObservation(selectedCoauthor.id, obs); loadData(); }
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meus Coautores — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Meus Coautores</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Acompanhe a produção, prazos e gerencie a comunicação com a equipe.</p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-white"
        style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}70` }} />
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
      </div>

      {/* Table */}
      <BrandCard>
        <BrandCardHeader icon={Users} iconColor={BLUE} accentColor={BLUE} title={`${filtered.length} coautor${filtered.length !== 1 ? 'es' : ''}`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr style={{ background: `${NAV}04`, borderBottom: `1px solid ${NAV}0C` }}>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}75` }}>Nome do Coautor</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}75` }}>Status do Capítulo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const chap = c.currentChapter;
                const st = getStatus(chap?.status);

                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: `1px solid ${NAV}08` }}
                  >
                    <td className="px-6 py-4 font-semibold" style={{ color: NAV }}>{c.name}</td>
                    <td className="px-6 py-4">
                      {chap ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${NAV}70` }}>{c.projectNames}</span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full w-fit" style={{ color: st.text, background: st.bg }}>{st.label}</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: `${NAV}70` }}>Sem capítulo ativo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="2" className="px-6 py-12 text-center text-sm" style={{ color: `${NAV}75` }}>
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
