
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ClipboardList, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const ChapterGuidePanel = ({
  isOpen,
  onToggle,
  wordCount = 0,
  wordGoal: initialWordGoal,
  onWordGoalChange,
  deadline,
  checklistItems = [
    { id: 1, text: 'Problema', done: false },
    { id: 2, text: 'Sintoma', done: false },
    { id: 3, text: 'Causa', done: false },
    { id: 4, text: 'Consequência', done: false },
    { id: 5, text: 'Solução', done: false },
    { id: 6, text: 'Jornada do Herói', done: false },
    { id: 7, text: 'Fundamentação', done: false }
  ],
  lastSubmittedDate,
  lastUpdatedDate
}) => {
  const [checklist, setChecklist] = useState(checklistItems);
  const [localWordGoal, setLocalWordGoal] = useState(initialWordGoal || 1500);

  useEffect(() => {
    if (initialWordGoal) setLocalWordGoal(initialWordGoal);
  }, [initialWordGoal]);

  const toggleItem = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Nunca';
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysDifference === 0) {
      const hoursDiff = Math.round((new Date(dateString) - new Date()) / (1000 * 60 * 60));
      if (hoursDiff === 0) {
        const minDiff = Math.round((new Date(dateString) - new Date()) / (1000 * 60));
        return minDiff === 0 ? 'Agora mesmo' : rtf.format(minDiff, 'minute');
      }
      return rtf.format(hoursDiff, 'hour');
    }
    return rtf.format(daysDifference, 'day');
  };

  const wordsRemaining = Math.max(0, localWordGoal - wordCount);
  const progressPercentage = localWordGoal > 0 ? (wordCount / localWordGoal) * 100 : 0;

  let progressColor = 'text-[#EF4444]'; // Red <50%
  if (progressPercentage >= 80) progressColor = 'text-[#10B981]'; // Green >=80%
  else if (progressPercentage >= 50) progressColor = 'text-[#F59E0B]'; // Yellow 50-79%

  const daysUntilDeadline = deadline ? Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const showSmartAlert = progressPercentage < 30 && daysUntilDeadline !== null && daysUntilDeadline < 7;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className={`fixed top-1/2 -translate-y-1/2 z-40 bg-white shadow-md border-gray-200 transition-all duration-300 ${isOpen ? 'right-[300px] rounded-r-none' : 'right-0 rounded-r-none'}`}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: 50 }}
            animate={{ width: 300, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-[#F9FAFB] border-l border-[#E5E7EB] h-full flex flex-col shrink-0 overflow-hidden shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]"
          >
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                <ClipboardList className="w-5 h-5 text-[#3B82F6]" />
                Guia do Capítulo
              </h2>

              {/* Smart Alert */}
              {showSmartAlert && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-xs font-medium flex gap-2 items-start shadow-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-600 mt-0.5" />
                  <p>⚠️ Atenção: Faltam {wordsRemaining} palavras e {daysUntilDeadline} dias para o prazo.</p>
                </div>
              )}

              {/* Word Goal */}
              <div className="mb-8">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider block mb-2">Meta de Palavras</span>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-500">Meta:</span>
                    <span className="text-sm font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-md">
                      {localWordGoal} palavras
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${progressColor}`}>
                      Faltam {wordsRemaining} palavras
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Estrutura Sugerida</h3>
                <div className="space-y-2">
                  {checklist.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className="flex items-start gap-3 p-2.5 bg-white rounded-md border border-gray-100 shadow-sm cursor-pointer hover:border-[#10B981] transition-colors group"
                    >
                      {item.done ? (
                        <CheckSquare className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 group-hover:text-[#10B981] shrink-0 mt-0.5 transition-colors" />
                      )}
                      <span className={`text-sm leading-tight pt-0.5 ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>


              {/* Meta Info */}
              <div className="mt-auto pt-6 border-t border-gray-200 space-y-3">
                <div className="text-xs">
                  <span className="text-gray-500 block mb-0.5">Última versão enviada:</span>
                  <span className="font-medium text-gray-700">
                    {lastSubmittedDate ? new Date(lastSubmittedDate).toLocaleString('pt-BR') : 'Nenhuma versão enviada'}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500 block mb-0.5">Última atualização:</span>
                  <span className="font-medium text-gray-700">{getRelativeTime(lastUpdatedDate)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
