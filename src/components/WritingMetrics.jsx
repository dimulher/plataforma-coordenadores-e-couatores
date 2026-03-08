
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, Save, AlertCircle, RefreshCw } from 'lucide-react';

export const WritingMetrics = ({ wordCount = 0, wordGoal = 0, lastSaved, saveState }) => {
  const percentage = wordGoal > 0 ? Math.min(Math.round((wordCount / wordGoal) * 100), 100) : 0;

  const getSaveStatus = () => {
    switch(saveState) {
      case 'SAVING': return <span className="flex items-center gap-1 text-blue-600"><RefreshCw className="h-3 w-3 animate-spin" /> Salvando...</span>;
      case 'SUCCESS': return <span className="flex items-center gap-1 text-green-600"><Save className="h-3 w-3" /> Salvo</span>;
      case 'ERROR': return <span className="flex items-center gap-1 text-red-600"><AlertCircle className="h-3 w-3" /> Erro ao salvar</span>;
      default: return lastSaved ? <span className="flex items-center gap-1 text-slate-500"><Save className="h-3 w-3" /> Salvo</span> : null;
    }
  };

  return (
    <div className="bg-[#F0F9FF] border border-blue-100 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
      <div>
        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Progresso de Escrita</h3>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
            {wordCount.toLocaleString('pt-BR')} <span className="text-sm font-medium text-blue-600">/ {wordGoal.toLocaleString('pt-BR')} palavras</span>
          </span>
          <span className="text-lg font-bold text-blue-600">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-3 bg-blue-100" indicatorColor="bg-blue-500" />
      </div>

      <div className="flex items-center justify-between text-xs pt-3 border-t border-blue-200/60">
        <div className="flex items-center gap-1 text-slate-500 font-medium">
          <Clock className="h-3.5 w-3.5" />
          {lastSaved ? new Date(lastSaved).toLocaleTimeString('pt-BR') : 'Não salvo'}
        </div>
        <div className="font-medium">
          {getSaveStatus()}
        </div>
      </div>
    </div>
  );
};
