
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { NAV, BLUE, RED } from '@/lib/brand';

const COLUMNS = [
  { id: 'INDICADO',       title: 'Indicado',       color: `${NAV}50` },
  { id: 'EM_ATENDIMENTO', title: 'Em Atend.',       color: BLUE },
  { id: 'EM_AVALIACAO',   title: 'Em Avaliação',    color: '#F59E0B' },
  { id: 'APROVADO',       title: 'Aprovado',        color: '#10B981' },
  { id: 'COAUTOR_ATIVO',  title: 'Coautor Ativo',   color: '#8B5CF6' },
  { id: 'NAO_APROVADO',   title: 'Não Aprovado',    color: RED },
];

const CoordinatorFunnelPage = () => {
  const { getFunnelCandidates } = useCoordinatorData();
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getFunnelCandidates().then(data => { if (data) setCandidates(data); });
  }, []);

  const filtered = candidates.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Relatório — Novos Autores do Brasil</title></Helmet>

      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Relatório</h1>
            <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Acompanhe o funil dos seus indicados.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
            <Input
              placeholder="Buscar candidato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white text-sm"
              style={{ borderColor: `${NAV}20`, color: NAV }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(column => {
              const columnCands = filtered.filter(c => c.status === column.id);
              return (
                <div
                  key={column.id}
                  className="w-64 flex flex-col rounded-2xl p-3"
                  style={{ background: `${column.color}08`, border: `1px solid ${column.color}20` }}
                >
                  <div className="flex justify-between items-center mb-3 px-1 shrink-0">
                    <h3 className="text-sm font-bold" style={{ color: column.color, fontFamily: 'Poppins, sans-serif' }}>
                      {column.title}
                    </h3>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${column.color}15`, color: column.color }}
                    >
                      {columnCands.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
                    {columnCands.map(cand => (
                      <div
                        key={cand.id}
                        className="bg-white p-3 rounded-xl transition-shadow hover:shadow-sm"
                        style={{ border: `1px solid ${NAV}0C`, boxShadow: `0 1px 3px ${NAV}06` }}
                      >
                        <h4 className="font-semibold text-sm truncate" style={{ color: NAV }}>{cand.name}</h4>
                        {cand.phone && <p className="text-xs mt-0.5" style={{ color: `${NAV}55` }}>{cand.phone}</p>}
                      </div>
                    ))}
                    {columnCands.length === 0 && (
                      <div className="h-16 flex items-center justify-center text-xs" style={{ color: `${NAV}30` }}>Vazio</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default CoordinatorFunnelPage;
