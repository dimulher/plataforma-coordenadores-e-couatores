
import React, { useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Link as LinkIcon,
  Undo, Redo, RemoveFormatting
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Commands that support active state detection
const ACTIVE_COMMANDS = ['bold', 'italic', 'underline', 'strikeThrough', 'insertOrderedList', 'insertUnorderedList', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];

export const EditorToolbar = ({ onCommand, disabled }) => {
  const [activeStates, setActiveStates] = useState({});

  // Called after every command or selection change to refresh active states
  const refreshActiveStates = useCallback(() => {
    const states = {};
    ACTIVE_COMMANDS.forEach(cmd => {
      try { states[cmd] = document.queryCommandState(cmd); } catch { states[cmd] = false; }
    });
    setActiveStates(states);
  }, []);

  const handleCommand = (e, cmd, arg) => {
    e.preventDefault();
    onCommand(cmd, arg);
    // Refresh after a tick so the DOM updates first
    setTimeout(refreshActiveStates, 0);
  };

  const ToolbarBtn = ({ icon: Icon, cmd, arg = null, title, alwaysActive = false }) => {
    const isActive = !alwaysActive && activeStates[cmd];
    return (
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => handleCommand(e, cmd, arg)}
        disabled={disabled}
        title={title}
        className={`h-8 w-8 p-0 transition-all ${isActive
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 ring-1 ring-blue-300'
          : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  };

  // Update active states when selection changes inside the editor
  const handleSelectionChange = useCallback(() => {
    refreshActiveStates();
  }, [refreshActiveStates]);

  React.useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-[#F8FAFC] border-b border-slate-200 rounded-t-lg sticky top-0 z-10">

      {/* Undo/Redo/Clear */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-300">
        <ToolbarBtn icon={Undo} cmd="undo" title="Desfazer (Ctrl+Z)" alwaysActive />
        <ToolbarBtn icon={Redo} cmd="redo" title="Refazer (Ctrl+Y)" alwaysActive />
        <ToolbarBtn icon={RemoveFormatting} cmd="removeFormat" title="Limpar Formatação" alwaysActive />
      </div>

      {/* Font Selectors */}
      <div className="flex items-center gap-2 px-2 border-r border-slate-300">
        <Select disabled={disabled} onValueChange={(val) => onCommand('fontName', val)}>
          <SelectTrigger className="h-8 w-[110px] text-xs bg-white">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Times New Roman">Times</SelectItem>
            <SelectItem value="Courier New">Courier</SelectItem>
          </SelectContent>
        </Select>

        <Select disabled={disabled} onValueChange={(val) => onCommand('fontSize', val)}>
          <SelectTrigger className="h-8 w-[70px] text-xs bg-white">
            <SelectValue placeholder="Tam." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">12px</SelectItem>
            <SelectItem value="3">14px</SelectItem>
            <SelectItem value="4">16px</SelectItem>
            <SelectItem value="5">18px</SelectItem>
            <SelectItem value="6">20px</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 px-2 border-r border-slate-300">
        <ToolbarBtn icon={Heading1} cmd="formatBlock" arg="H1" title="Título 1" alwaysActive />
        <ToolbarBtn icon={Heading2} cmd="formatBlock" arg="H2" title="Título 2" alwaysActive />
        <ToolbarBtn icon={Heading3} cmd="formatBlock" arg="H3" title="Título 3" alwaysActive />
      </div>

      {/* Text Style — these support active state */}
      <div className="flex items-center gap-1 px-2 border-r border-slate-300">
        <ToolbarBtn icon={Bold} cmd="bold" title="Negrito (Ctrl+B)" />
        <ToolbarBtn icon={Italic} cmd="italic" title="Itálico (Ctrl+I)" />
        <ToolbarBtn icon={Underline} cmd="underline" title="Sublinhado (Ctrl+U)" />
        <ToolbarBtn icon={Strikethrough} cmd="strikeThrough" title="Tachado" />
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 px-2 border-r border-slate-300">
        <ToolbarBtn icon={AlignLeft} cmd="justifyLeft" title="Alinhar à Esquerda" />
        <ToolbarBtn icon={AlignCenter} cmd="justifyCenter" title="Centralizar" />
        <ToolbarBtn icon={AlignRight} cmd="justifyRight" title="Alinhar à Direita" />
        <ToolbarBtn icon={AlignJustify} cmd="justifyFull" title="Justificar" />
      </div>

      {/* Lists & Quote */}
      <div className="flex items-center gap-1 pl-2">
        <ToolbarBtn icon={ListOrdered} cmd="insertOrderedList" title="Lista Numerada" />
        <ToolbarBtn icon={List} cmd="insertUnorderedList" title="Lista com Marcadores" />
        {/* Quote toggle: if current block is blockquote → convert to P, else → BLOCKQUOTE */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            const currentBlock = document.queryCommandValue('formatBlock').toLowerCase();
            const cmd = currentBlock === 'blockquote' ? 'P' : 'BLOCKQUOTE';
            onCommand('formatBlock', cmd);
            setTimeout(refreshActiveStates, 0);
          }}
          disabled={disabled}
          title="Citação (toggle)"
          className={`h-8 w-8 p-0 transition-all ${document.queryCommandValue?.('formatBlock')?.toLowerCase() === 'blockquote'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 ring-1 ring-blue-300'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            const url = window.prompt('Digite a URL do link:');
            if (url) onCommand('createLink', url);
          }}
          title="Inserir Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
