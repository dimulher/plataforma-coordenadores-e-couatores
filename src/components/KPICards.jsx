
import React from 'react';
import { Target, Users, Edit3, ClipboardList, AlertTriangle } from 'lucide-react';

const KPICards = ({ 
  leadsIndicados = "—", 
  coautoresAtivos = "—", 
  capitulosAndamento = "—", 
  enviadosRevisao = "—", 
  capitulosAtrasados = "—" 
}) => {
  const isAtrasado = capitulosAtrasados !== "—" && Number(capitulosAtrasados) > 0;

  const cards = [
    {
      label: "Leads Indicados",
      value: leadsIndicados,
      icon: <Target className="w-8 h-8 text-blue-500 mb-4" />,
      microtext: "últimos 30 dias",
      bgClass: "bg-white",
    },
    {
      label: "Coautores Ativos",
      value: coautoresAtivos,
      icon: <Users className="w-8 h-8 text-green-500 mb-4" />,
      bgClass: "bg-white",
    },
    {
      label: "Capítulos em Andamento",
      value: capitulosAndamento,
      icon: <Edit3 className="w-8 h-8 text-purple-500 mb-4" />,
      bgClass: "bg-white",
    },
    {
      label: "Enviados p/ Revisão",
      value: enviadosRevisao,
      icon: <ClipboardList className="w-8 h-8 text-amber-500 mb-4" />,
      bgClass: "bg-white",
    },
    {
      label: "Capítulos Atrasados",
      value: capitulosAtrasados,
      icon: <AlertTriangle className={`w-8 h-8 mb-4 ${isAtrasado ? 'text-red-600' : 'text-gray-400'}`} />,
      bgClass: isAtrasado ? "bg-[#FFE5E5]" : "bg-white",
      borderColor: isAtrasado ? "border-red-200" : "border-[#E5E7EB]"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`border ${card.borderColor || 'border-[#E5E7EB]'} shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-[20px] rounded-[8px] flex flex-col ${card.bgClass}`}
        >
          {card.icon}
          <div className="text-[32px] md:text-[36px] font-bold text-gray-900 leading-none mb-1">
            {card.value}
          </div>
          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
            {card.label}
          </div>
          {card.microtext && (
            <div className="text-[12px] text-gray-400">
              {card.microtext}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPICards;
