
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useChapterEditor } from '@/hooks/useChapterEditor';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';
import { ChapterDeadlineIndicator } from '@/components/ChapterDeadlineIndicator';
import { ChapterVersionsPanel } from '@/components/ChapterVersionsPanel';
import { Button } from '@/components/ui/button';
import { Check, Loader2, XCircle, History, Send, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const ChapterEditorPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { chapter, content, setContent, saveState, lastUpdated, versions, wordCount, functions } = useChapterEditor(chapterId);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitNote, setSubmitNote] = useState('');

  if (!chapter) {
    return <div className="p-8 text-center text-gray-500">Carregando capítulo...</div>;
  }

  const isReadOnly = ['ENVIADO_PARA_REVISAO', 'EM_REVISAO', 'APROVADO', 'FINALIZADO'].includes(chapter.status);

  const handleSubmitReview = () => {
    functions.updateStatus('ENVIADO_PARA_REVISAO', submitNote);
    setSubmitModalOpen(false);
  };

  const getSaveIndicator = () => {
    if (saveState === 'SAVING') return <span className="flex items-center text-yellow-600 text-sm"><Loader2 className="w-4 h-4 mr-1 animate-spin"/> Salvando...</span>;
    if (saveState === 'SUCCESS') return <span className="flex items-center text-green-600 text-sm"><Check className="w-4 h-4 mr-1"/> Salvo agora</span>;
    if (saveState === 'ERROR') return <span className="flex items-center text-red-600 text-sm"><XCircle className="w-4 h-4 mr-1"/> Erro ao salvar</span>;
    
    if (lastUpdated) {
      const d = new Date(lastUpdated);
      return <span className="text-gray-400 text-sm font-medium">Última atualização: {d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}</span>;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 -m-4 lg:-m-8">
      <Helmet><title>{chapter.title} - Editor NAB</title></Helmet>

      {/* Editor Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/chapters')}><ArrowLeft className="w-5 h-5"/></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{chapter.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <ChapterStatusBadge status={chapter.status} />
              <ChapterDeadlineIndicator deadline={chapter.deadline} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            {getSaveIndicator()}
            <span className={`text-xs font-semibold ${wordCount < chapter.word_goal ? 'text-gray-500' : 'text-green-600'}`}>
              {wordCount} / {chapter.word_goal} palavras
            </span>
          </div>
          
          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>

          <Button variant="outline" onClick={() => setIsVersionsOpen(true)}>
            <History className="w-4 h-4 mr-2" /> Versões
          </Button>

          {!isReadOnly && (
            <Button onClick={() => setSubmitModalOpen(true)} className="bg-[#3B82F6] hover:bg-blue-600 text-white">
              <Send className="w-4 h-4 mr-2" /> Enviar para Revisão
            </Button>
          )}
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="flex-1 overflow-hidden relative flex">
        <div className="flex-1 p-4 lg:p-8 overflow-hidden h-full">
          {isReadOnly && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-sm">Capítulo em modo somente leitura.</p>
                <p className="text-xs">Seu capítulo foi enviado e está aguardando revisão. Você não pode editar no momento.</p>
              </div>
            </div>
          )}
          <RichTextEditor 
            content={content} 
            onChange={setContent} 
            readOnly={isReadOnly}
          />
        </div>

        <ChapterVersionsPanel 
          isOpen={isVersionsOpen} 
          onClose={() => setIsVersionsOpen(false)} 
          versions={versions}
          onRestore={(c) => {
            if(!isReadOnly) functions.restoreVersion(c);
          }}
        />
      </div>

      {/* Submit Modal */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar para Revisão</DialogTitle>
            <DialogDescription>
              Você está prestes a enviar este capítulo para a equipe editorial. 
              O editor será bloqueado até que o revisor termine a análise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <label className="block text-sm font-medium text-gray-700">Notas para o revisor (opcional)</label>
            <Textarea 
              placeholder="Ex: Tive dúvida na cena da floresta, por favor verifique se o tom está adequado."
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              className="resize-none h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitReview} className="bg-[#3B82F6] hover:bg-blue-600 text-white">Confirmar Envio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChapterEditorPage;
