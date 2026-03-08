
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const CoauthorsTable = ({ coauthors = [], onCobrar }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [projectFilter, setProjectFilter] = useState('Todos');

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'em rascunho': return 'bg-[#E5E7EB] text-gray-800 border-gray-200';
      case 'em edição': return 'bg-[#DBEAFE] text-blue-800 border-blue-200';
      case 'revisão': return 'bg-[#FEF3C7] text-yellow-800 border-yellow-200';
      case 'aprovado': return 'bg-[#DCFCE7] text-green-800 border-green-200';
      case 'atrasado': return 'bg-[#FFE5E5] text-red-800 border-red-200';
      default: return 'bg-[#E5E7EB] text-gray-800 border-gray-200';
    }
  };

  const filteredCoauthors = coauthors.filter(c => {
    const matchesSearch = c.coautor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesProject = projectFilter === 'Todos' || c.projeto === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const uniqueProjects = ['Todos', ...new Set(coauthors.map(c => c.projeto))];

  return (
    <div className="bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-[20px] rounded-[8px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-lg font-bold text-gray-900">Visão dos Coautores</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Status: Todos</option>
            <option value="Em rascunho">Em rascunho</option>
            <option value="Em edição">Em edição</option>
            <option value="Revisão">Revisão</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Atrasado">Atrasado</option>
          </select>

          <select 
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            {uniqueProjects.map(p => (
              <option key={p} value={p}>{p === 'Todos' ? 'Projeto: Todos' : p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-[13px] font-semibold text-gray-600">Coautor</th>
              <th className="py-3 px-4 text-[13px] font-semibold text-gray-600">Projeto/Capítulo</th>
              <th className="py-3 px-4 text-[13px] font-semibold text-gray-600">Status</th>
              <th className="py-3 px-4 text-[13px] font-semibold text-gray-600 min-w-[120px]">Progresso</th>
              <th className="py-3 px-4 text-[13px] font-semibold text-gray-600">Última atualização</th>
              <th className="py-3 px-4 text-[13px] font-semibold text-gray-600">Prazo</th>
              <th className="py-3 px-4 text-[13px] font-semibold text-gray-600 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoauthors.length > 0 ? (
              filteredCoauthors.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">{item.coautor}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <div className="font-medium text-gray-800">{item.projeto}</div>
                    <div className="text-[12px] text-gray-500">{item.capitulo}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${item.progresso}%` }}
                        ></div>
                      </div>
                      <span className="text-[12px] text-gray-600 font-medium w-8">{item.progresso}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.ultimaAtualizacao || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.prazo || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`/coordinator/coauthors/${item.id || idx}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Ver
                      </Link>
                      <button 
                        onClick={() => onCobrar(item.coautor)}
                        className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                      >
                        Cobrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-sm text-gray-500">
                  Sem dados no momento
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoauthorsTable;
