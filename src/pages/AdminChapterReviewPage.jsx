
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useChapterEditor } from '@/hooks/useChapterEditor';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, AlertCircle, Edit3, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const AdminChapterReviewPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { chapter, content, wordCount, functions } = useChapterEditor(chapterId);
  const [modalType, setModalType] = useState(null); // 'APPROVE', 'REJECT', 'REOPEN'
  const [note, setNote] = useState('');
  const [authorName, setAuthorName] = useState('');

  useEffect(() => {
    if (!chapter?.author_id) return;
    supabase.from('profiles').select('name').eq('id', chapter.author_id).single()
      .then(({ data }) => { if (data?.name) setAuthorName(data.name); });
  }, [chapter?.author_id]);

  if (!chapter) {
    return <div className="p-8 text-center text-gray-500">Carregando capítulo para revisão...</div>;
  }

  const handleAction = () => {
    if (modalType === 'APPROVE') functions.updateStatus('APROVADO', note);
    if (modalType === 'REJECT') functions.updateStatus('AJUSTES_SOLICITADOS', note);
    if (modalType === 'REOPEN') functions.updateStatus('EM_EDICAO', note);
    
    setModalType(null);
    setNote('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 -m-4 lg:-m-8">
      <Helmet><title>Revisão: {chapter.title} - Admin NAB</title></Helmet>

      {/* Header */}
      <div className="bg-[#0E1A32] text-white px-6 py-4 flex justify-between items-center shrink-0 shadow-md z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate('/app/admin/chapters')}><ArrowLeft className="w-5 h-5"/></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{chapter.title}</h1>
              <ChapterStatusBadge status={chapter.status} />
            </div>
            <p className="text-gray-400 text-sm mt-1">Autor: {authorName || chapter.author_id} • Palavras: {wordCount}/{chapter.word_goal}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-500 text-gray-800 hover:bg-gray-100 bg-white" onClick={() => setModalType('REOPEN')}>
            <Edit3 className="w-4 h-4 mr-2"/> Reabrir Edição
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setModalType('REJECT')}>
            <AlertCircle className="w-4 h-4 mr-2"/> Solicitar Ajustes
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setModalType('APPROVE')}>
            <CheckCircle className="w-4 h-4 mr-2"/> Aprovar Capítulo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Editor (Read Only) */}
        <div className="flex-1 p-4 lg:p-6 overflow-hidden h-full border-r border-gray-200">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-md mb-4 font-medium text-sm">
            Modo Revisão (Somente Leitura)
          </div>
          <div className="h-[calc(100%-4rem)]">
            <RichTextEditor content={content} onChange={() => {}} readOnly={true} />
          </div>
        </div>

        {/* Notes Sidebar */}
        <div className="w-full lg:w-96 bg-white overflow-y-auto p-6 border-l border-gray-200">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-[#3B82F6]" /> Histórico de Notas
          </h3>
          
          <div className="space-y-4">
            {(!chapter.reviewer_notes || chapter.reviewer_notes.length === 0) ? (
              <p className="text-gray-500 text-sm italic">Nenhuma nota registrada.</p>
            ) : (
              chapter.reviewer_notes.map((n, i) => (
                <Card key={i} className="bg-gray-50 border border-gray-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm text-gray-800">{n.author_name || n.author || 'Revisor'}</span>
                      <span className="text-xs text-gray-500">{new Date(n.created_at || n.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{n.text}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Dialog open={!!modalType} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === 'APPROVE' && 'Aprovar Capítulo'}
              {modalType === 'REJECT' && 'Solicitar Ajustes'}
              {modalType === 'REOPEN' && 'Reabrir para Edição'}
            </DialogTitle>
            <DialogDescription>
              {modalType === 'APPROVE' && 'O capítulo será marcado como finalizado. O autor será notificado.'}
              {modalType === 'REJECT' && 'O capítulo voltará para o autor com status "Ajustes Solicitados". Adicione as instruções abaixo.'}
              {modalType === 'REOPEN' && 'O capítulo voltará para o status "Em Edição" sem marcação negativa.'}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Comentários (Opcional)</label>
            <Textarea 
              placeholder="Insira suas observações aqui..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button 
              onClick={handleAction} 
              className={
                modalType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700 text-white' : 
                modalType === 'REJECT' ? 'bg-red-600 hover:bg-red-700 text-white' : 
                'bg-[#3B82F6] hover:bg-blue-600 text-white'
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChapterReviewPage;
