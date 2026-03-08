
import React from 'react';

export const PlatformSummaryCards = ({
  leadsEmAtendimento = 0,
  totalCoauthors = 0,
  chaptersInReview = 0,
  chaptersDelivered = 0,
}) => {
  const cards = [
    {
      label: 'Leads em Atendimento',
      value: leadsEmAtendimento,
      icon: '📋',
      border: 'border-[#93C5FD]',
    },
    {
      label: 'Total de Coautores',
      value: totalCoauthors,
      icon: '👥',
      border: 'border-[#BFDBFE]',
    },
    {
      label: 'Capítulos p/ Revisão',
      value: chaptersInReview,
      icon: '🔍',
      border: 'border-[#FDBA74]',
    },
    {
      label: 'Capítulos Entregues',
      value: chaptersDelivered,
      icon: '✅',
      border: 'border-[#86EFAC]',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px]">
      {cards.map(card => (
        <div
          key={card.label}
          className={`h-[140px] sm:h-[160px] p-[20px] rounded-[8px] border ${card.border} bg-[rgba(255,255,255,0.95)] shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex flex-col justify-between transition-transform hover:-translate-y-1`}
        >
          <div className="flex items-center gap-2 text-[#1F2937] text-[13px] font-semibold">
            <span className="text-xl" role="img">{card.icon}</span>
            {card.label}
          </div>
          <div className="text-[32px] font-bold text-[#1F2937]">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlatformSummaryCards;
