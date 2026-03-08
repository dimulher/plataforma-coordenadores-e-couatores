
import React from 'react';
import { Check } from 'lucide-react';

const STAGES = ['Contrato', 'Aulas', 'Entrega', 'Revisão', 'Aprovação', 'Lançamento'];

export const JourneyTimeline = ({ currentStage }) => {
  const currentIndex = STAGES.indexOf(currentStage) !== -1 ? STAGES.indexOf(currentStage) : 0;

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 rounded-full z-0"></div>
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-blue-500 transition-all duration-500 rounded-full z-0" 
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        ></div>

        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={stage} className="relative z-10 flex flex-col items-center group cursor-help">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    isCurrent ? 'bg-white border-blue-500 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' : 
                    'bg-white border-slate-300 text-slate-400'}`}
                title={isCurrent ? `Estágio Atual: ${stage}` : stage}
              >
                {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : <span className="text-sm font-bold">{index + 1}</span>}
              </div>
              <span 
                className={`absolute top-12 text-xs font-bold whitespace-nowrap px-2 py-1 rounded
                  ${isCurrent ? 'text-blue-700 bg-blue-50' : 'text-slate-500'}`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
