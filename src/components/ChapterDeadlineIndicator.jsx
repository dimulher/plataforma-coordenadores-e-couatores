
import React from 'react';
import { CalendarClock, AlertTriangle } from 'lucide-react';

export const ChapterDeadlineIndicator = ({ deadline }) => {
  if (!deadline) return null;

  const deadlineDate = new Date(deadline);
  const now = new Date();
  
  // Strip time for strict day comparison
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusConfig = {
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CalendarClock,
    text: `Entrega em ${diffDays} dias`
  };

  if (diffDays < 0) {
    statusConfig = {
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: AlertTriangle,
      text: `Atrasado por ${Math.abs(diffDays)} dias!`
    };
  } else if (diffDays <= 3) {
    statusConfig = {
      color: 'text-red-500 bg-red-50 border-red-200',
      icon: CalendarClock,
      text: `Entrega em ${diffDays} dias`
    };
  } else if (diffDays <= 7) {
    statusConfig = {
      color: 'text-orange-500 bg-orange-50 border-orange-200',
      icon: CalendarClock,
      text: `Entrega em ${diffDays} dias`
    };
  }

  const Icon = statusConfig.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${statusConfig.color} shadow-sm w-fit`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{statusConfig.text}</span>
      <span className="text-xs opacity-70 ml-2 border-l pl-2 border-current">
        {deadlineDate.toLocaleDateString('pt-BR')}
      </span>
    </div>
  );
};
