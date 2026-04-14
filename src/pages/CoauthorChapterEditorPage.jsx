
import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useChapterEditor } from '@/hooks/useChapterEditor';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ChapterEditorHeader } from '@/components/ChapterEditorHeader';
import { ChapterGuidePanel } from '@/components/ChapterGuidePanel';
import { EditorNotesPanel } from '@/components/EditorNotesPanel';
import { useToast } from '@/hooks/use-toast';

// Strip HTML to plain text for word count fallback
const htmlToText = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};

// Export to .docx using docx package
const exportToDocx = async (htmlContent, filename = 'capitulo') => {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

  // Strip HTML tags and convert to paragraphs
  const tmp = document.createElement('div');
  tmp.innerHTML = htmlContent || '';

  const paragraphs = [];
  tmp.querySelectorAll('p, h1, h2, h3, br, div').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent || '';
    if (tag === 'h1') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1 }));
    } else if (tag === 'h2') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 }));
    } else if (tag === 'h3') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 }));
    } else if (text.trim()) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text, size: 28, font: 'Arial' })] }));
    }
  });

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: tmp.textContent || 'Capítulo vazio.', size: 28, font: 'Arial' })] }));
  }

  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  const blob = await Packer.toBlob(doc);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const CoauthorChapterEditorPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { chapter, content, setContent, saveState, lastUpdated, wordCount, functions } = useChapterEditor(chapterId);

  const handleTitleChange = async (newTitle) => {
    try {
      await functions.updateTitle(newTitle);
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o título.' });
    }
  };
  const editorRef = useRef(null);

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [currentWordGoal, setCurrentWordGoal] = useState(1000);
  const [isReadOnly, setIsReadOnly] = useState(false);
  // Keep a ref to latest content so ref callback can access it
  const latestContentRef = useRef('');

  useEffect(() => {
    if (chapter) {
      setIsReady(true);
      setCurrentWordGoal(chapter.word_goal || 1000);
      setIsReadOnly(['ENVIADO_PARA_REVISAO', 'EM_REVISAO', 'APROVADO', 'FINALIZADO'].includes(chapter.status));
      if (chapter.status === 'AJUSTES_SOLICITADOS') {
        setIsNotesOpen(true);
      }
    }
  }, [chapter]);

  // Keep latestContentRef in sync so the editorRef callback can read the current content
  useEffect(() => { latestContentRef.current = content; }, [content]);

  // Ref callback wrapped in useCallback so React doesn't re-call it on every render.
  // With stable identity, React only calls this when the DOM element mounts/unmounts.
  const setEditorRef = React.useCallback((el) => {
    editorRef.current = el;
    if (el) {
      el.innerHTML = latestContentRef.current || '';
    }
  }, []); // empty deps — intentionally runs only on mount

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    // Find if cursor is inside a blockquote
    let node = range.startContainer;
    let blockquote = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'BLOCKQUOTE') { blockquote = node; break; }
      node = node.parentNode;
    }

    if (!blockquote) return;

    // Backspace at start of blockquote → convert to paragraph and exit
    if (e.key === 'Backspace' && range.startOffset === 0 && range.collapsed) {
      e.preventDefault();
      document.execCommand('formatBlock', false, 'P');
      handleInput();
      return;
    }

    // Enter on an empty blockquote line → exit blockquote
    if (e.key === 'Enter' && !e.shiftKey) {
      const text = blockquote.textContent.trim();
      if (text === '') {
        e.preventDefault();
        document.execCommand('formatBlock', false, 'P');
        handleInput();
      }
    }
  };

  const handleCommand = (cmd, arg) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  const handleSubmitReview = () => {
    try {
      functions.updateStatus('ENVIADO_PARA_REVISAO');
      toast({ title: 'Sucesso!', description: 'Capítulo enviado para revisão com sucesso.' });
      setTimeout(() => navigate('/coauthor/chapters'), 1500);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar o capítulo para revisão.' });
    }
  };

  const handleExportDocx = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const rawContent = editorRef.current?.innerHTML || content || '';
      const safeFilename = (chapter?.title || 'capitulo')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      await exportToDocx(rawContent, safeFilename);
      toast({ title: 'Arquivo exportado!', description: 'Seu capítulo foi baixado em formato .docx.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao exportar', description: 'Não foi possível gerar o arquivo .docx.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleReopenEdit = async () => {
    try {
      await functions.updateStatus('EM_EDICAO');
      toast({ title: 'Capítulo reaberto!', description: 'Você pode editar seu capítulo novamente.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível reabrir o capítulo para edição.' });
    }
  };

  const handleSave = async () => {
    try {
      const currentContent = editorRef.current?.innerHTML || content || '';
      await functions.saveChapter(currentContent);
      toast({ title: 'Salvo!', description: 'Seu capítulo foi salvo com sucesso.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível salvar o capítulo.' });
    }
  };

  const handleImportDocx = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Dynamic import to avoid Node.js build being used at compile time
      const mammoth = await import('mammoth/mammoth.browser.min.js').catch(
        () => import('mammoth')
      );
      const lib = mammoth.default || mammoth;
      const result = await lib.convertToHtml({ arrayBuffer });
      const importedHtml = result.value || '';
      if (editorRef.current) {
        editorRef.current.innerHTML = importedHtml;
        handleInput();
      }
      setContent(importedHtml);
      await functions.saveChapter(importedHtml);
      toast({ title: 'Importado!', description: `"${file.name}" foi importado com sucesso.` });
    } catch (err) {
      console.error('Import docx error:', err);
      toast({ variant: 'destructive', title: 'Erro ao importar', description: 'Não foi possível importar o arquivo. Certifique-se de que é um .docx válido.' });
    }
  };

  if (!isReady || !chapter) return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><div className="animate-spin h-8 w-8 border-b-2 border-[#3B82F6] rounded-full"></div></div>;

  const notes = chapter.reviewer_notes || [];

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -m-4 lg:-m-8 bg-[#F3F4F6] relative overflow-hidden">
      <Helmet><title>Editor: {chapter.title || 'Capítulo'} - NAB Platform</title></Helmet>

      <ChapterEditorHeader
        chapter={chapter}
        wordCount={wordCount}
        wordGoal={currentWordGoal}
        onSendForReview={handleSubmitReview}
        onExportDocx={handleExportDocx}
        onReopenEdit={handleReopenEdit}
        onSave={handleSave}
        onImportDocx={handleImportDocx}
        onTitleChange={handleTitleChange}
        saveState={saveState}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-[850px] mx-auto w-full flex-1 flex flex-col shadow-sm rounded-xl overflow-hidden border border-gray-200">

            {!isReadOnly && <EditorToolbar onCommand={handleCommand} disabled={isReadOnly} />}

            <div className="flex-1 bg-white relative">
              <div
                className="absolute inset-0 overflow-y-auto custom-scrollbar"
                style={{ padding: '60px 80px' }}
              >
                {isReadOnly ? (
                  <div
                    className="editor-content text-gray-800 text-[16px] leading-[1.8]"
                    style={{ minHeight: '600px' }}
                    dangerouslySetInnerHTML={{ __html: content || '<p style="color:#9ca3af">Nenhum conteúdo ainda.</p>' }}
                  />
                ) : (
                  <div
                    ref={setEditorRef}
                    contentEditable={true}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    className="editor-content outline-none text-gray-800 text-[16px] leading-[1.8] min-h-full"
                    suppressContentEditableWarning={true}
                    placeholder="Comece a escrever seu capítulo aqui..."
                    style={{ minHeight: '600px' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Guide Sidebar (Retractable) */}
        <ChapterGuidePanel
          isOpen={isGuideOpen}
          onToggle={() => setIsGuideOpen(!isGuideOpen)}
          wordCount={wordCount}
          wordGoal={currentWordGoal}
          onWordGoalChange={setCurrentWordGoal}
          deadline={chapter.deadline}
          lastUpdatedDate={lastUpdated}
          lastSubmittedDate={chapter.submitted_at}
          projectRules="Certifique-se de seguir o tom de voz acordado na mentoria inicial. Mantenha os parágrafos curtos para facilitar a leitura."
        />

        {/* Notes Drawer */}
        <EditorNotesPanel
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          notes={notes}
          onMarkResolved={(idx) => {
            toast({ title: 'Nota resolvida', description: 'Você marcou esta nota como resolvida com sucesso.' });
          }}
        />
      </div>
    </div>
  );
};

export default CoauthorChapterEditorPage;
