
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useChapterEditor } from '@/hooks/useChapterEditor';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';
import { ArrowLeft, CheckCircle, AlertCircle, Edit3, MessageSquare } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { NAV, BLUE, RED } from '@/lib/brand';

const AdminChapterReviewPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { chapter, content, wordCount, functions } = useChapterEditor(chapterId);
  const [modalType, setModalType] = useState(null);
  const [note, setNote] = useState('');
  const [authorName, setAuthorName] = useState('');

  useEffect(() => {
    if (!chapter?.author_id) return;
    supabase.from('profiles').select('name').eq('id', chapter.author_id).single()
      .then(({ data }) => { if (data?.name) setAuthorName(data.name); });
  }, [chapter?.author_id]);

  if (!chapter) return (
    <div className="p-8 text-center text-sm" style={{ color: `${NAV}50` }}>Carregando capítulo para revisão...</div>
  );

  const handleAction = () => {
    if (modalType === 'APPROVE') functions.updateStatus('APROVADO', note);
    if (modalType === 'REJECT')  functions.updateStatus('AJUSTES_SOLICITADOS', note);
    if (modalType === 'REOPEN')  functions.updateStatus('EM_EDICAO', note);
    setModalType(null);
    setNote('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 lg:-m-8" style={{ background: '#F8F8F0' }}>
      <Helmet><title>Revisão: {chapter.title} — Novos Autores do Brasil</title></Helmet>

      {/* Header */}
      <div
        className="text-white px-6 py-4 flex justify-between items-center shrink-0 shadow-lg z-20"
        style={{ background: NAV }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/admin/chapters')}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
            style={{ color: 'white' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{chapter.title}</h1>
              <ChapterStatusBadge status={chapter.status} />
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Autor: {authorName || chapter.author_id} · Palavras: {wordCount}/{chapter.word_goal}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setModalType('REOPEN')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1.5px solid rgba(255,255,255,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            <Edit3 className="w-4 h-4" /> Reabrir Edição
          </button>
          <button
            onClick={() => setModalType('REJECT')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: `${RED}CC`, color: 'white' }}
            onMouseEnter={e => { e.currentTarget.style.background = RED; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${RED}CC`; }}
          >
            <AlertCircle className="w-4 h-4" /> Solicitar Ajustes
          </button>
          <button
            onClick={() => setModalType('APPROVE')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: '#10B981', color: 'white' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#10B981'; }}
          >
            <CheckCircle className="w-4 h-4" /> Aprovar Capítulo
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Editor */}
        <div className="flex-1 p-4 lg:p-6 overflow-hidden h-full" style={{ borderRight: `1px solid ${NAV}12` }}>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl mb-4 text-sm font-medium"
            style={{ background: `${BLUE}10`, border: `1px solid ${BLUE}25`, color: BLUE }}
          >
            Modo Revisão — Somente Leitura
          </div>
          <div className="h-[calc(100%-4rem)]">
            <RichTextEditor content={content} onChange={() => {}} readOnly={true} />
          </div>
        </div>

        {/* Notes sidebar */}
        <div className="w-full lg:w-96 bg-white overflow-y-auto p-6" style={{ borderLeft: `1px solid ${NAV}0C` }}>
          <h3 className="font-bold text-base flex items-center gap-2 mb-6" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
            <MessageSquare className="w-5 h-5" style={{ color: BLUE }} /> Histórico de Notas
          </h3>

          <div className="space-y-4">
            {(!chapter.reviewer_notes || chapter.reviewer_notes.length === 0) ? (
              <p className="text-sm italic" style={{ color: `${NAV}40` }}>Nenhuma nota registrada.</p>
            ) : (
              chapter.reviewer_notes.map((n, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: `${NAV}04`, border: `1px solid ${NAV}0C` }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm" style={{ color: NAV }}>{n.author_name || n.author || 'Revisor'}</span>
                    <span className="text-xs" style={{ color: `${NAV}50` }}>
                      {new Date(n.created_at || n.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: `${NAV}80` }}>{n.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Dialog open={!!modalType} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              {modalType === 'APPROVE' && 'Aprovar Capítulo'}
              {modalType === 'REJECT'  && 'Solicitar Ajustes'}
              {modalType === 'REOPEN' && 'Reabrir para Edição'}
            </DialogTitle>
            <DialogDescription>
              {modalType === 'APPROVE' && 'O capítulo será marcado como aprovado. O autor será notificado.'}
              {modalType === 'REJECT'  && 'O capítulo voltará ao autor com status "Ajustes Solicitados". Adicione as instruções abaixo.'}
              {modalType === 'REOPEN' && 'O capítulo voltará para o status "Em Edição" sem marcação negativa.'}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <label className="block text-sm font-medium mb-2" style={{ color: `${NAV}80` }}>Comentários (Opcional)</label>
            <Textarea
              placeholder="Insira suas observações aqui..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none h-32"
              style={{ borderColor: `${NAV}20`, color: NAV }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button
              onClick={handleAction}
              style={{
                background: modalType === 'APPROVE' ? '#10B981' : modalType === 'REJECT' ? RED : BLUE,
                color: 'white',
                border: 'none',
              }}
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
