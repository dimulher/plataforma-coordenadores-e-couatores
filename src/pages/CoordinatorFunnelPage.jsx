
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const COLUMNS = [
  { id: 'INDICADO', title: 'Indicado' },
  { id: 'EM_ATENDIMENTO', title: 'Em Atend.' },
  { id: 'EM_AVALIACAO', title: 'Em Avaliação' },
  { id: 'APROVADO', title: 'Aprovado' },
  { id: 'COAUTOR_ATIVO', title: 'Coautor Ativo' },
  { id: 'NAO_APROVADO', title: 'Não Aprovado' },
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
      <Helmet><title>Relatório - NAB Platform</title></Helmet>

      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Relatório</h1>
            <p className="text-slate-500 mt-1">Acompanhe o funil dos seus indicados.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar candidato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(column => {
              const columnCands = filtered.filter(c => c.status === column.id);
              return (
                <div key={column.id} className="w-64 flex flex-col rounded-xl border bg-slate-50/50 border-slate-200 p-3">
                  <div className="flex justify-between items-center mb-3 px-1 shrink-0">
                    <h3 className="text-sm font-bold text-slate-700">{column.title}</h3>
                    <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-200">
                      {columnCands.length}
                    </Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2 custom-scrollbar">
                    {columnCands.map(cand => (
                      <div key={cand.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-sm text-slate-800 truncate">{cand.name}</h4>
                        {cand.phone && <p className="text-xs text-slate-500 mt-0.5">{cand.phone}</p>}
                      </div>
                    ))}
                    {columnCands.length === 0 && (
                      <div className="h-16 flex items-center justify-center text-xs text-slate-400">Vazio</div>
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
