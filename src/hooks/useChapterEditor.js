import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useChapterEditor(chapterId) {
  const { user, isAdmin } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState('IDLE'); // IDLE, SAVING, SUCCESS, ERROR
  const [lastUpdated, setLastUpdated] = useState(null);
  const [versions, setVersions] = useState([]);

  const contentRef = useRef(content);
  useEffect(() => { contentRef.current = content; }, [content]);

  // Word count helper
  const getWordCount = (html) => {
    if (!html) return 0;
    const text = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    return text === '' ? 0 : text.split(' ').length;
  };

  // Load chapter from Supabase
  const loadChapter = useCallback(async () => {
    if (!chapterId) return;
    try {
      const { data: chap, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      if (!isAdmin() && chap.author_id !== user?.id) throw new Error('Acesso negado');

      // Load reviewer notes
      const { data: notes } = await supabase
        .from('reviewer_notes')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: true });

      // Normaliza colunas do DB para o formato esperado pelos componentes
      chap.reviewer_notes = (notes || []).map(n => ({
        ...n,
        author: n.author_name || n.author || 'Revisor',
        date: n.date || n.created_at,
        status: n.resolved ? 'Resolvida' : 'Aberta',
        tag: n.tag || 'Ajuste',
      }));

      // Load versions
      const { data: vers } = await supabase
        .from('chapter_versions')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false })
        .limit(15);

      setChapter(chap);
      setContent(chap.content_text || '');
      setVersions(vers || []);
      setLastUpdated(chap.updated_at);
    } catch (err) {
      console.error('loadChapter error:', err);
      setChapter(null);
    }
  }, [chapterId, user?.id, isAdmin]);

  useEffect(() => { loadChapter(); }, [loadChapter]);

  // Save chapter content to Supabase
  const saveChapter = async (forceType = 'Auto-save', explicitContent = null) => {
    if (!chapter) return;
    setSaveState('SAVING');
    try {
      const currentContent = explicitContent !== null ? explicitContent : contentRef.current;
      const wc = getWordCount(currentContent);
      const now = new Date().toISOString();

      // Update chapter
      const { error: updateError } = await supabase
        .from('chapters')
        .update({ content_text: currentContent, word_count: wc, updated_at: now })
        .eq('id', chapterId);

      if (updateError) throw updateError;

      // Insert version (keep last 15)
      await supabase.from('chapter_versions').insert({
        chapter_id: chapterId,
        author_id: user.id,
        type: forceType,
        word_count: wc,
        content: currentContent,
      });

      // Keep only 15 versions
      const { data: allVersions } = await supabase
        .from('chapter_versions')
        .select('id, created_at')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false });

      if (allVersions && allVersions.length > 15) {
        const toDelete = allVersions.slice(15).map(v => v.id);
        await supabase.from('chapter_versions').delete().in('id', toDelete);
      }

      setChapter(prev => ({ ...prev, content_text: currentContent, word_count: wc, updated_at: now }));
      setLastUpdated(now);
      setSaveState('SUCCESS');
      setTimeout(() => setSaveState('IDLE'), 3000);
    } catch (err) {
      console.error('saveChapter error:', err);
      setSaveState('ERROR');
    }
  };

  // Debounced auto-save (10 seconds)
  useEffect(() => {
    if (!chapter || ['ENVIADO_PARA_REVISAO', 'EM_REVISAO', 'APROVADO', 'FINALIZADO'].includes(chapter.status)) return;
    const handler = setTimeout(() => {
      if (content !== chapter.content_text) {
        saveChapter('Auto-save', content);
      }
    }, 10000);
    return () => clearTimeout(handler);
  }, [content, chapter]);

  // Update chapter title
  const updateTitle = async (newTitle) => {
    if (!chapter || !newTitle.trim()) return;
    const trimmed = newTitle.trim();
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ title: trimmed, updated_at: new Date().toISOString() })
        .eq('id', chapterId);
      if (error) throw error;
      setChapter(prev => ({ ...prev, title: trimmed }));
    } catch (err) {
      console.error('updateTitle error:', err);
      throw err;
    }
  };

  // Update chapter status
  const updateStatus = async (newStatus) => {
    try {
      const now = new Date().toISOString();
      const updates = { status: newStatus, updated_at: now };

      if (newStatus === 'ENVIADO_PARA_REVISAO') {
        updates.submitted_at = now;
        updates.current_stage = 'Revisão';
      }
      if (newStatus === 'APROVADO') {
        updates.approved_at = now;
        updates.current_stage = 'Aprovação';
      }
      if (newStatus === 'EM_EDICAO') {
        updates.current_stage = 'Entrega';
      }

      // Always save the latest content before changing status
      const latestContent = contentRef.current;
      const wc = getWordCount(latestContent);
      updates.content_text = latestContent;
      updates.word_count = wc;

      const { error } = await supabase
        .from('chapters')
        .update(updates)
        .eq('id', chapterId);

      if (error) throw error;

      setChapter(prev => ({ ...prev, ...updates, content_text: latestContent }));
      setContent(latestContent);
      setLastUpdated(now);

      // Save a version reflecting status change
      await supabase.from('chapter_versions').insert({
        chapter_id: chapterId,
        author_id: user.id,
        type: newStatus,
        word_count: wc,
        content: latestContent,
      });
    } catch (err) {
      console.error('updateStatus error:', err);
      throw err;
    }
  };

  const restoreVersion = (versionContent) => {
    setContent(versionContent);
    saveChapter('Manual Restore', versionContent);
  };

  return {
    chapter,
    content,
    setContent,
    saveState,
    lastUpdated,
    versions,
    wordCount: getWordCount(content),
    functions: {
      saveChapter: (explicitContent) => saveChapter('Manual Save', explicitContent !== undefined ? explicitContent : contentRef.current),
      updateStatus,
      updateTitle,
      restoreVersion,
      refresh: loadChapter
    }
  };
}
