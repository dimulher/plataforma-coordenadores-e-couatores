import React from 'react';
import { Check } from 'lucide-react';
import { NAV, BLUE } from '@/lib/brand';

export const JourneyTimeline = ({ steps, title = 'Sua Jornada' }) => {
  const doneCount = steps.filter(s => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{title}</p>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${BLUE}12`, color: BLUE }}>
          {doneCount}/{steps.length} etapas
        </span>
      </div>

      <div className="h-1.5 rounded-full mb-5 overflow-hidden" style={{ background: `${NAV}0C` }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: BLUE }} />
      </div>

      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex items-start" style={{ minWidth: 'max-content', gap: 0 }}>
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;
            const circleStyle = step.done
              ? { background: BLUE, border: `2px solid ${BLUE}` }
              : step.active
              ? { background: 'white', border: `2.5px solid ${BLUE}` }
              : { background: `${NAV}05`, border: `2px solid ${NAV}15` };

            return (
              <div key={step.id} className="flex items-start">
                <div className="flex flex-col items-center" style={{ width: 72 }}>
                  <div className="relative mb-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={circleStyle}>
                      {step.done
                        ? <Check className="w-4 h-4" style={{ color: 'white' }} strokeWidth={3} />
                        : <Icon className="w-4 h-4" style={{ color: step.active ? BLUE : `${NAV}35` }} />
                      }
                    </div>
                    {step.active && (
                      <span className="absolute inset-0 rounded-full animate-ping" style={{ background: `${BLUE}30` }} />
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: step.done || step.active ? NAV : `${NAV}45` }}>
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div style={{ width: 20, height: 2, background: step.done ? BLUE : `${NAV}12`, marginTop: 18, flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
