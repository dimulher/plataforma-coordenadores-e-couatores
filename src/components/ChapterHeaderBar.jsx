
import React from 'react';
import { ArrowLeft, Send, MessageSquare as MessageSquareText, Save, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

export const ChapterHeaderBar = ({ 
  title, 
  status, 
  wordCount, 
  wordGoal, 
  deadline, 
  onSave, 
  onSubmitReview, 
  onToggleNotes, 
  notesCount,
  isReadOnly
}) => {
  const navigate = useNavigate();
  
  const getStatusColor = (s) => {
    switch (s) {
      case 'EM_EDICAO':
      case 'RASCUNHO': return 'bg-[#3B82F6] text-white';
      case 'ENVIADO_PARA_REVISAO': return 'bg-[#F59E0B] text-white';
      case 'AJUSTES_SOLICITADOS': return 'bg-[#FF6B35] text-white';
      case 'APROVADO': return 'bg-[#10B981] text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const formatStatus = (s) => {
    switch (s) {
      case 'EM_EDICAO':
      case 'RASCUNHO': return 'Em edição';
      case 'ENVIADO_PARA_REVISAO': return 'Enviado p/ revisão';
      case 'AJUSTES_SOLICITADOS': return 'Ajustes solicitados';
      case 'APROVADO': return 'Aprovado';
      default: return s || 'Desconhecido';
    }
  };

  const progress = wordGoal > 0 ? Math.min(Math.round((wordCount / wordGoal) * 100), 100) : 0;
  
  const isOverdue = deadline && new Date(deadline) < new Date();
  const daysRemaining = deadline ? Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate('/coauthor/chapters')} className="text-slate-500 hover:text-slate-800 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusColor(status)}`}>
              {formatStatus(status)}
            </span>
            {isOverdue ? (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" /> Atrasado
              </span>
            ) : daysRemaining !== null && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <Clock className="w-3 h-3" /> {daysRemaining} dias restantes
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-800 truncate">{title || 'Sem título'}</h1>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto">
        {/* Word Count Progress */}
        <div className="hidden md:flex flex-col w-48">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-600">Palavras: <strong className="text-slate-900">{wordCount}</strong> / {wordGoal}</span>
            <span className="text-blue-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <Button variant="outline" size="sm" onClick={onToggleNotes} className="relative bg-white">
            <MessageSquareText className="w-4 h-4 mr-2 text-blue-500" />
            Notas
            {notesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {notesCount}
              </span>
            )}
          </Button>
          
          {!isReadOnly && (
            <>
              <Button variant="outline" size="sm" onClick={onSave} className="bg-white">
                <Save className="w-4 h-4 mr-2" /> Salvar
              </Button>
              <Button size="sm" onClick={onSubmitReview} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="w-4 h-4 mr-2" /> Enviar p/ Revisão
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
