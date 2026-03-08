
import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote, Code, SeparatorHorizontal,
  Undo, Redo, RemoveFormatting
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RichTextEditor = ({ content, onChange, readOnly = false }) => {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content || '';
      }
    }
    isInternalChange.current = false;
  }, [content]);

  const handleInput = () => {
    isInternalChange.current = true;
    onChange(editorRef.current.innerHTML);
  };

  const execCommand = (command, value = null) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const execFormatBlock = (block) => {
    if (readOnly) return;
    document.execCommand('formatBlock', false, block);
    editorRef.current.focus();
    handleInput();
  };

  const insertHorizontalRule = () => {
    if (readOnly) return;
    document.execCommand('insertHorizontalRule', false, null);
    editorRef.current.focus();
    handleInput();
  };

  const ToolbarButton = ({ icon: Icon, onClick, title }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={readOnly}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${readOnly ? 'opacity-50 cursor-not-allowed' : 'text-gray-700'}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col h-full min-h-[500px]">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-[#F8FAFC] border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <ToolbarButton icon={Undo} onClick={() => execCommand('undo')} title="Desfazer (Ctrl+Z)" />
            <ToolbarButton icon={Redo} onClick={() => execCommand('redo')} title="Refazer (Ctrl+Y)" />
            <ToolbarButton icon={RemoveFormatting} onClick={() => execCommand('removeFormat')} title="Limpar Formatação" />
          </div>
          
          <div className="flex items-center gap-1 px-2 border-r border-gray-300">
            <ToolbarButton icon={Heading1} onClick={() => execFormatBlock('H1')} title="Título 1" />
            <ToolbarButton icon={Heading2} onClick={() => execFormatBlock('H2')} title="Título 2" />
            <ToolbarButton icon={Heading3} onClick={() => execFormatBlock('H3')} title="Título 3" />
          </div>
          
          <div className="flex items-center gap-1 px-2 border-r border-gray-300">
            <ToolbarButton icon={Bold} onClick={() => execCommand('bold')} title="Negrito (Ctrl+B)" />
            <ToolbarButton icon={Italic} onClick={() => execCommand('italic')} title="Itálico (Ctrl+I)" />
            <ToolbarButton icon={Underline} onClick={() => execCommand('underline')} title="Sublinhado (Ctrl+U)" />
            <ToolbarButton icon={Strikethrough} onClick={() => execCommand('strikeThrough')} title="Tachado" />
          </div>

          <div className="flex items-center gap-1 px-2 border-r border-gray-300">
            <ToolbarButton icon={AlignLeft} onClick={() => execCommand('justifyLeft')} title="Alinhar à Esquerda" />
            <ToolbarButton icon={AlignCenter} onClick={() => execCommand('justifyCenter')} title="Centralizar" />
            <ToolbarButton icon={AlignRight} onClick={() => execCommand('justifyRight')} title="Alinhar à Direita" />
            <ToolbarButton icon={AlignJustify} onClick={() => execCommand('justifyFull')} title="Justificar" />
          </div>

          <div className="flex items-center gap-1 pl-2">
            <ToolbarButton icon={ListOrdered} onClick={() => execCommand('insertOrderedList')} title="Lista Numerada" />
            <ToolbarButton icon={List} onClick={() => execCommand('insertUnorderedList')} title="Lista com Marcadores" />
            <ToolbarButton icon={Quote} onClick={() => execFormatBlock('BLOCKQUOTE')} title="Citação" />
            <ToolbarButton icon={SeparatorHorizontal} onClick={insertHorizontalRule} title="Linha Horizontal" />
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div 
        className="flex-1 bg-white overflow-y-auto"
        style={{ padding: '60px 40px' }} // Inspired by Google Docs margins
      >
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          className="editor-content outline-none max-w-4xl mx-auto text-gray-800 text-[16px] leading-[1.6]"
          style={{ minHeight: '100%' }}
        />
      </div>
    </div>
  );
};
