
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SaveIndicator } from './SaveIndicator';
import { Send, MessageSquare, Save, History, Clock } from 'lucide-react';

export const ChapterStickyHeader = ({
  title,
  status,
  wordCount,
  wordGoal,
  deadline,
  lastUpdated,
  onSave,
  onSubmitReview,
  onViewNotes,
  onViewVersions,
  notesCount,
  isReadOnly,
  saveState
}) => {
  const [realTimeUpdate, setRealTimeUpdate] = useState('');

  useEffect(() => {
    if (!lastUpdated) {
      setRealTimeUpdate('Nenhuma atualização');
      return;
    }
    
    const updateTime = () => {
      const date = new Date(lastUpdated);
      const now = new Date();
      if (now.getDate() === date.getDate() && now.getMonth() === date.getMonth()) {
         setRealTimeUpdate(`Última atualização: ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      } else {
         setRealTimeUpdate(`Última atualização: ${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getStatusColor = (s) => {
    switch (s) {
      case 'EM_EDICAO':
      case 'RASCUNHO': return 'bg-[#3B82F6] text-white';
      case 'ENVIADO_PARA_REVISAO': return 'bg-[#F59E0B] text-white';
      case 'AJUSTES_SOLICITADOS': return 'bg-[#FF6B35] text-white';
      case 'APROVADO': return 'bg-[#10B981] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatStatus = (s) => {
    switch (s) {
      case 'EM_EDICAO':
      case 'RASCUNHO': return 'Em edição';
      case 'ENVIADO_PARA_REVISAO': return 'Enviado';
      case 'AJUSTES_SOLICITADOS': return 'Ajustes solicitados';
      case 'APROVADO': return 'Aprovado';
      default: return s || 'Desconhecido';
    }
  };

  const progressPercentage = wordGoal > 0 ? Math.min(Math.round((wordCount / wordGoal) * 100), 100) : 0;

  return (
    <div 
      className="sticky top-[64px] z-40 bg-white border-b border-[#E5E7EB] shadow-sm px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 transition-all"
      style={{ minHeight: '80px' }}
    >
      {/* Left Section: Title & Status */}
      <div className="flex flex-col min-w-0 flex-1 w-full lg:w-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 truncate" title={title || 'Capítulo sem título'}>
            {title || 'Capítulo sem título'}
          </h1>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${getStatusColor(status)}`}>
            {formatStatus(status)}
          </span>
        </div>
      </div>

      {/* Center Section: Word Counter */}
      <div className="flex flex-col w-full lg:max-w-[400px] flex-1">
        <div className="flex justify-between items-end mb-1.5 text-sm">
          <span className="font-semibold text-gray-700">
            Palavras: {wordCount} / META ({wordGoal}) — {progressPercentage}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2.5 bg-gray-100 w-full" indicatorColor="bg-[#3B82F6]" />
      </div>

      {/* Right Section: Time, Save Indicator & Actions */}
      <div className="flex items-center gap-4 flex-1 justify-end w-full lg:w-auto flex-wrap">
        
        <div className="hidden xl:flex items-center text-xs text-gray-500 font-medium">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {realTimeUpdate}
        </div>

        <SaveIndicator state={saveState} />

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewVersions} 
            className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hidden sm:flex"
          >
            <History className="w-4 h-4 mr-2" /> Versões
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewNotes} 
            className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 relative"
          >
            <MessageSquare className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Ver Notas</span>
            {notesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {notesCount}
              </span>
            )}
          </Button>

          {!isReadOnly && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSave}
                className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              >
                <Save className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Salvar</span>
              </Button>
              
              {(status === 'EM_EDICAO' || status === 'RASCUNHO' || status === 'AJUSTES_SOLICITADOS') && (
                <Button 
                  size="sm" 
                  onClick={onSubmitReview} 
                  className="bg-[#3B82F6] hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Enviar para Revisão</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
