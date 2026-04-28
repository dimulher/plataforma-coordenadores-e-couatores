import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useCoauthorMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    project: null, chapter: null, mentorship: null, announcements: []
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch active project (first project the user participates in)
      const { data: participations } = await supabase
        .from('project_participants')
        .select('project_id, projects(*)')
        .eq('user_id', user.id)
        .limit(1);

      const project = participations?.[0]?.projects || null;

      // Fetch most recent chapter (any status, ordered by updated_at)
      const { data: chapters } = await supabase
        .from('chapters')
        .select('*')
        .eq('author_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      const chapter = chapters?.[0] || null;

      // Fetch reviewer notes for this chapter
      if (chapter) {
        const { data: notes } = await supabase
          .from('reviewer_notes')
          .select('*')
          .eq('chapter_id', chapter.id)
          .order('created_at', { ascending: true });
        chapter.reviewer_notes = (notes || []).map(n => ({
          ...n,
          author: n.author_name || n.author || 'Revisor',
          date: n.date || n.created_at,
          status: n.resolved ? 'Resolvida' : 'Aberta',
          tag: n.tag || 'Ajuste',
        }));
      }

      // Fetch next mentorship
      const { data: mentorships } = await supabase
        .from('mentorships')
        .select('*')
        .gt('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1);

      const mentorship = mentorships?.[0] || null;

      // Fetch announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      setMetrics({ project, chapter, mentorship, announcements: announcements || [] });
    } catch (err) {
      console.error('useCoauthorMetrics error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  return { metrics, loading, refresh: loadData };
}
