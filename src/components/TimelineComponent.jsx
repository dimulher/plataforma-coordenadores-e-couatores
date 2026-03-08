
import React from 'react';
import { Check } from 'lucide-react';

const STAGES = ['Contrato', 'Aulas', 'Entrega', 'Revisão', 'Aprovação', 'Lançamento'];

export const TimelineComponent = ({ currentStage }) => {
  const currentIndex = STAGES.indexOf(currentStage) !== -1 ? STAGES.indexOf(currentStage) : 0;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full z-0"></div>
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-success transition-all duration-500 rounded-full z-0" 
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        ></div>

        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={stage} className="relative z-10 flex flex-col items-center group">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 
                  ${isCompleted ? 'bg-success border-success text-white' : 
                    isCurrent ? 'bg-background border-accent text-accent shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' : 
                    'bg-background border-muted text-muted-foreground'}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}
              </div>
              <span 
                className={`absolute top-10 text-[10px] sm:text-xs font-medium whitespace-nowrap
                  ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}
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
