
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const PerformanceCards = ({ 
  progressoMedio = "—", 
  proximasEntregas = [], 
  pendenciasCriticas = [] 
}) => {
  const progressValue = progressoMedio !== "—" ? parseInt(progressoMedio, 10) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Card A: Progresso Médio da Equipe */}
      <div className="bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-[20px] rounded-[8px] flex flex-col justify-center">
        <h3 className="text-[14px] font-semibold text-gray-700 mb-4">Progresso Médio da Equipe</h3>
        <div className="text-4xl font-bold text-blue-600 mb-4">{progressoMedio}{progressoMedio !== "—" ? "%" : ""}</div>
        <div className="w-full h-[8px] bg-[#E5E7EB] rounded-[4px] overflow-hidden mb-3">
          <div 
            className="h-full bg-[#3B82F6] rounded-[4px] transition-all duration-500" 
            style={{ width: `${progressValue}%` }}
          ></div>
        </div>
        <p className="text-[12px] text-gray-500">Média dos capítulos ativos</p>
      </div>

      {/* Card B: Próximas Entregas (7 dias) */}
      <div className="bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-[20px] rounded-[8px] flex flex-col">
        <h3 className="text-[14px] font-semibold text-gray-700 mb-4">Próximas Entregas (7 dias)</h3>
        <div className="flex-1 flex flex-col gap-3 mb-4">
          {proximasEntregas.length > 0 ? (
            proximasEntregas.slice(0, 5).map((entrega, idx) => (
              <div key={idx} className="text-[13px] text-gray-700 border-b border-gray-100 pb-2 last:border-0">
                <span className="font-medium">{entrega.coautor}</span> — {entrega.capitulo} — <span className="text-gray-500">{entrega.data}</span>
              </div>
            ))
          ) : (
            <div className="text-[13px] text-gray-500 italic my-auto">Nenhuma entrega prevista.</div>
          )}
        </div>
        <div className="mt-auto flex justify-end">
          <Link to="/coordinator/coauthors" className="text-[12px] text-blue-600 hover:text-blue-800 font-medium">
            Ver Todos →
          </Link>
        </div>
      </div>

      {/* Card C: Pendências Críticas */}
      <div className="bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-[20px] rounded-[8px] flex flex-col">
        <h3 className="text-[14px] font-semibold text-gray-700 mb-4">Pendências Críticas</h3>
        <div className="flex-1 flex flex-col gap-3">
          {pendenciasCriticas.length > 0 ? (
            pendenciasCriticas.slice(0, 4).map((pendencia, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[13px] text-[#EF4444] bg-red-50 p-2 rounded border border-red-100 font-medium">
                <AlertTriangle className="w-4 h-4 text-[#EF4444] mt-0.5 flex-shrink-0" />
                <span>{pendencia}</span>
              </div>
            ))
          ) : (
            <div className="text-[13px] text-gray-500 italic my-auto">Nenhuma pendência crítica.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceCards;
