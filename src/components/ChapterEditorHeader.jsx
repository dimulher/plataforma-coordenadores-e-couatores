
import React, { useRef, useState } from 'react';
import { RotateCcw, Download, Save, Upload, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const ChapterEditorHeader = ({
  chapter,
  wordCount = 0,
  wordGoal = 0,
  onSendForReview,
  onExportDocx,
  onReopenEdit,
  onSave,
  onImportDocx,
  onTitleChange,
  saveState,
}) => {
  const { title, status } = chapter || {};
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const getStatusStyles = (s) => {
    switch (s) {
      case 'EM_EDICAO':
      case 'RASCUNHO':
        return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'ENVIADO_PARA_REVISAO':
        return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'AJUSTES_SOLICITADOS':
        return { color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.1)' };
      case 'APROVADO':
        return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'FINALIZADO':
        return { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' };
      default:
        return { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  const formatStatus = (s) => {
    switch (s) {
      case 'EM_EDICAO':
      case 'RASCUNHO': return 'Em edição';
      case 'ENVIADO_PARA_REVISAO': return 'Enviado para revisão';
      case 'AJUSTES_SOLICITADOS': return 'Ajustes solicitados';
      case 'APROVADO': return 'Aprovado';
      case 'FINALIZADO': return 'Concluído';
      default: return s || 'Desconhecido';
    }
  };

  const getSaveLabel = () => {
    if (saveState === 'SAVING') return 'Salvando...';
    if (saveState === 'SUCCESS') return 'Salvo!';
    if (saveState === 'ERROR') return 'Erro ao salvar';
    return 'Salvar';
  };

  const statusStyle = getStatusStyles(status);
  const progressPercentage = wordGoal > 0 ? Math.min(Math.round((wordCount / wordGoal) * 100), 100) : 0;
  const canSendForReview = status === 'EM_EDICAO' || status === 'RASCUNHO' || status === 'AJUSTES_SOLICITADOS';
  const isReadOnly = ['ENVIADO_PARA_REVISAO', 'EM_REVISAO', 'APROVADO', 'FINALIZADO'].includes(status);
  const canReopen = ['ENVIADO_PARA_REVISAO', 'EM_REVISAO', 'APROVADO'].includes(status);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImportDocx) {
      onImportDocx(file);
      e.target.value = ''; // reset so same file can be re-imported
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.1)] h-[80px] px-6 flex items-center justify-between gap-4">
      {/* Left: Title & Status */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {isEditingTitle ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (titleDraft.trim()) onTitleChange?.(titleDraft.trim());
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                }
              }}
              onBlur={() => {
                if (titleDraft.trim()) onTitleChange?.(titleDraft.trim());
                setIsEditingTitle(false);
              }}
              autoFocus
              className="text-[18px] font-bold text-[#1F2937] bg-transparent border-b-2 border-[#3B82F6] outline-none flex-1 min-w-0 pr-2"
            />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                if (titleDraft.trim()) onTitleChange?.(titleDraft.trim());
                setIsEditingTitle(false);
              }}
              className="text-green-600 hover:text-green-700 p-0.5 shrink-0"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                setIsEditingTitle(false);
              }}
              className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 group">
            <h1
              className="text-[18px] font-bold text-[#1F2937] truncate"
              title={title || 'Capítulo sem título'}
            >
              {title || 'Capítulo sem título'}
            </h1>
            {!isReadOnly && onTitleChange && (
              <button
                onClick={() => {
                  setTitleDraft(title || '');
                  setIsEditingTitle(true);
                }}
                className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Editar título"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <span
          className="text-[12px] font-semibold px-3 py-1 rounded-full whitespace-nowrap hidden sm:inline-flex shrink-0"
          style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
        >
          {formatStatus(status)}
        </span>
      </div>

      {/* Center: Word Counter & Progress */}
      <div className="flex flex-col items-center justify-center flex-1 hidden md:flex">
        <span className="text-[14px] text-[#6B7280] font-medium mb-1.5">
          {wordCount} / {wordGoal} palavras
        </span>
        <div className="w-[200px]">
          <Progress
            value={progressPercentage}
            className="h-[6px] bg-[#E5E7EB]"
            indicatorColor="bg-[#3B82F6]"
          />
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center justify-end gap-2 flex-1 flex-wrap">
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Import .docx */}
        {!isReadOnly && onImportDocx && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="text-[13px] font-medium px-3 py-2 rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hidden sm:flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4" />
            Importar .docx
          </Button>
        )}

        {/* Export .docx */}
        {onExportDocx && (
          <Button
            onClick={onExportDocx}
            variant="outline"
            className="text-[13px] font-medium px-3 py-2 rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 hidden sm:flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Baixar .docx
          </Button>
        )}

        {/* Manual Save */}
        {!isReadOnly && onSave && (
          <Button
            onClick={onSave}
            variant="outline"
            disabled={saveState === 'SAVING'}
            className={`text-[13px] font-medium px-3 py-2 rounded-md hidden sm:flex items-center gap-1.5 transition-colors ${saveState === 'SUCCESS'
                ? 'border-green-300 text-green-700 bg-green-50'
                : saveState === 'ERROR'
                  ? 'border-red-300 text-red-700 bg-red-50'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Save className="h-4 w-4" />
            {getSaveLabel()}
          </Button>
        )}

        {/* Reopen for Editing */}
        {canReopen && onReopenEdit && (
          <Button
            onClick={onReopenEdit}
            className="text-[13px] font-medium px-4 py-2 rounded-md flex items-center gap-1.5 whitespace-nowrap"
            style={{ color: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.1)' }}
          >
            <RotateCcw className="h-4 w-4" />
            Reabrir para Edição
          </Button>
        )}

        {/* Send for Review */}
        {!isReadOnly && (
          <Button
            onClick={onSendForReview}
            disabled={!canSendForReview}
            className="text-[13px] font-medium px-4 py-2 rounded-md whitespace-nowrap"
            style={{
              color: canSendForReview ? '#3B82F6' : '#9CA3AF',
              backgroundColor: canSendForReview ? '#DBEAFE' : '#F3F4F6'
            }}
          >
            Enviar para Revisão
          </Button>
        )}
      </div>
    </div>
  );
};
