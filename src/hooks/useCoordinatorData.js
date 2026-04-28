
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useCoordinatorData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── Dashboard Metrics ──────────────────────────────────────────────────────
  const getDashboardMetrics = useCallback(async () => {
    if (!user?.id) return null;
    setLoading(true);
    try {
      // All coauthors assigned to this coordinator
      const { data: coauthors } = await supabase
        .from('profiles')
        .select('id')
        .eq('coordinator_id', user.id)
        .eq('role', 'COAUTOR');

      const coauthorIds = (coauthors || []).map(c => c.id);

      // Chapters of those coauthors
      let chapters = [];
      if (coauthorIds.length > 0) {
        const { data } = await supabase
          .from('chapters')
          .select('id, status, deadline')
          .in('author_id', coauthorIds);
        chapters = data || [];
      }

      // Leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('coordinator_id', user.id);

      // Payments
      const { data: payments } = await supabase
        .from('payments')
        .select('contract_amount, commission_amount, commission_status')
        .eq('coordinator_id', user.id);

      const inProgress = chapters.filter(c => !['APROVADO', 'PRODUCAO', 'FINALIZADO', 'CONCLUIDO'].includes(c.status));
      const inReview = chapters.filter(c => ['ENVIADO_PARA_REVISAO', 'EM_REVISAO'].includes(c.status));
      const approved = chapters.filter(c => ['APROVADO', 'PRODUCAO', 'FINALIZADO', 'CONCLUIDO'].includes(c.status));
      const overdue = inProgress.filter(c => c.deadline && new Date(c.deadline) < new Date());

      let revenue = 0;
      let pendingCommission = 0;
      (payments || []).forEach(p => {
        revenue += Number(p.contract_amount) || 0;
        if (p.commission_status !== 'pago') pendingCommission += Number(p.commission_amount) || 0;
      });

      return {
        leadsIndicados: (leads || []).length,
        coautoresAtivos: coauthorIds.length,
        chaptersInProgress: inProgress.length,
        chaptersInReview: inReview.length,
        chaptersApproved: approved.length,
        chaptersOverdue: overdue.length,
        revenue,
        pendingCommission,
      };
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Coauthors List ─────────────────────────────────────────────────────────
  const getCoauthorsList = useCallback(async () => {
    if (!user?.id) return [];
    setLoading(true);
    try {
      // Coauthors
      const { data: coauthors } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .eq('coordinator_id', user.id)
        .eq('role', 'COAUTOR');

      if (!coauthors?.length) return [];

      const coauthorIds = coauthors.map(c => c.id);

      // Their chapters (active ones)
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, author_id, project_id, title, status, word_count, word_goal, deadline, updated_at')
        .in('author_id', coauthorIds)
        .not('status', 'in', '("APROVADO","FINALIZADO")');

      // Projects via project_participants
      const { data: participations } = await supabase
        .from('project_participants')
        .select('user_id, projects(id, name)')
        .in('user_id', coauthorIds);

      return coauthors.map(author => {
        const authorChapters = (chapters || [])
          .filter(c => c.author_id === author.id)
          .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));

        const currentChapter = authorChapters[0] || null;

        let progress = 0;
        if (currentChapter?.word_goal > 0) {
          progress = Math.min(100, Math.round((currentChapter.word_count / currentChapter.word_goal) * 100));
        }

        const authorProjects = (participations || [])
          .filter(p => p.user_id === author.id)
          .map(p => p.projects)
          .filter(Boolean);

        return {
          id: author.id,
          name: author.name,
          email: author.email,
          projectNames: authorProjects.map(p => p.name).join(', ') || 'Sem projeto',
          currentChapter,
          progress,
          lastUpdate: currentChapter ? currentChapter.updated_at : author.created_at,
          created_at: author.created_at,
        };
      });
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Coauthor Detail ────────────────────────────────────────────────────────
  const getCoauthorDetails = useCallback(async (coauthorId) => {
    if (!user?.id || !coauthorId) return null;
    setLoading(true);
    try {
      const [
        { data: author },
        { data: participations },
        { data: chapters },
        { data: activities },
      ] = await Promise.all([
        supabase.from('profiles').select('id, name, email, created_at, bio, instagram, contact_email, chapter_photo_url').eq('id', coauthorId).single(),
        supabase.from('project_participants').select('projects(id, name)').eq('user_id', coauthorId),
        supabase.from('chapters').select('id, title, status, word_count, word_goal, deadline, updated_at').eq('author_id', coauthorId),
        supabase.from('coordinator_activities').select('*').eq('coauthor_id', coauthorId).eq('coordinator_id', user.id).order('created_at', { ascending: false }),
      ]);

      const projects = (participations || []).map(p => p.projects).filter(Boolean);

      const activeChapters = (chapters || [])
        .filter(c => !['APROVADO', 'FINALIZADO'].includes(c.status))
        .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));

      const currentChapter = activeChapters[0] || null;

      let progress = 0;
      if (currentChapter?.word_goal > 0) {
        progress = Math.min(100, Math.round((currentChapter.word_count / currentChapter.word_goal) * 100));
      }

      // Normalize activities to expected shape
      const normalizedActivities = (activities || []).map(a => ({
        id: a.id,
        user_id: a.coauthor_id,
        date: a.created_at,
        action: a.action,
        details: a.details,
        type: a.type,
      }));

      return { author, projects, currentChapter, progress, activities: normalizedActivities };
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Add Observation ────────────────────────────────────────────────────────
  const addObservation = useCallback(async (coauthorId, content) => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase.from('coordinator_activities').insert({
        coordinator_id: user.id,
        coauthor_id: coauthorId,
        action: 'OBSERVACAO_INTERNA',
        details: content,
        type: 'observation',
      });
      return !error;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [user]);

  // ─── Funnel (Onboarding) ───────────────────────────────────────────────────
  const getFunnelCandidates = useCallback(async () => {
    if (!user?.id) return [];
    setLoading(true);
    try {
      // Busca leads da tabela leads (funil manual)
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*, projects(name)')
        .eq('coordinator_id', user.id)
        .in('status', ['INDICADO', 'CADASTRO_COMPLETO', 'EM_ATENDIMENTO', 'EM_AVALIACAO', 'APROVADO', 'CONTRATO_ONBOARDING', 'COAUTOR_ATIVO', 'NAO_APROVADO'])
        .order('created_at', { ascending: false });

      // Busca perfis com role=LEAD vinculados ao coordenador (cadastrados via link)
      const { data: profileLeads } = await supabase
        .from('profiles')
        .select('id, name, email, phone, created_at')
        .eq('coordinator_id', user.id)
        .eq('role', 'LEAD')
        .order('created_at', { ascending: false });

      // IDs já presentes na tabela leads (para evitar duplicatas)
      const existingEmails = new Set((leadsData || []).map(l => l.email?.toLowerCase()));

      const profileCandidates = (profileLeads || [])
        .filter(p => !existingEmails.has(p.email?.toLowerCase()))
        .map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          status: 'INDICADO',
          created_at: p.created_at,
          updated_at: p.created_at,
          projectName: 'Não vinculado',
          _fromProfile: true, // flag para diferenciar na atualização
        }));

      const leadsFormatted = (leadsData || []).map(l => ({
        ...l,
        projectName: l.projects?.name || 'Não vinculado',
      }));

      return [...leadsFormatted, ...profileCandidates];
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Leads (Sales Funnel) ──────────────────────────────────────────────────
  const getCoordinatorLeads = useCallback(async () => {
    if (!user?.id) return [];
    setLoading(true);
    try {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('coordinator_id', user.id)
        .in('status', ['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA', 'FECHADO', 'PERDIDO'])
        .order('updated_at', { ascending: false });

      return data || [];
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateLeadStatus = useCallback(async (leadId, newStatus) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('coordinator_id', user.id);
      return !error;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [user]);

  const updateCandidateStatus = useCallback(async (leadId, newStatus, candidate) => {
    // Se veio de profiles (não tem registro em leads ainda), insere
    if (candidate?._fromProfile) {
      try {
        const { error } = await supabase.from('leads').insert({
          coordinator_id: user.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone || null,
          status: newStatus,
          created_at: candidate.created_at,
          updated_at: new Date().toISOString(),
        });
        return !error;
      } catch (err) {
        console.error(err);
        return false;
      }
    }
    return updateLeadStatus(leadId, newStatus);
  }, [user, updateLeadStatus]);

  const addLead = useCallback(async (leadData) => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...leadData, coordinator_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [user]);

  // ─── Ranking ────────────────────────────────────────────────────────────────
  const getCoordinatorRanking = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all coordinators
      const { data: coords } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'COORDENADOR');

      if (!coords) return [];

      // Fetch aggregated metrics for all coordinators
      // In a real app, this might be a RPC or a more complex query.
      // For now, let's fetch leads and payments to aggregate.
      const [
        { data: allLeads },
        { data: allPayments }
      ] = await Promise.all([
        supabase.from('leads').select('coordinator_id, status'),
        supabase.from('payments').select('coordinator_id, contract_amount')
      ]);

      const ranking = coords.map(c => {
        const leadCount = (allLeads || []).filter(l => l.coordinator_id === c.id).length;
        const closedCount = (allLeads || []).filter(l => l.coordinator_id === c.id && (l.status === 'FECHADO' || l.status === 'CONVERTIDO' || l.status === 'COAUTOR_ATIVO')).length;
        const revenue = (allPayments || []).filter(p => p.coordinator_id === c.id).reduce((acc, p) => acc + Number(p.contract_amount), 0);

        const conversionRate = leadCount > 0 ? Math.round((closedCount / leadCount) * 100) : 0;

        return {
          id: c.id,
          name: c.name,
          closed_count: closedCount,
          revenue: revenue,
          conversion_rate: conversionRate
        };
      }).sort((a, b) => b.revenue - a.revenue || b.closed_count - a.closed_count);

      return ranking;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Payments ───────────────────────────────────────────────────────────────
  const getCoordinatorPayments = useCallback(async () => {
    if (!user?.id) return [];
    try {
      const { data } = await supabase
        .from('payments')
        .select('*, leads(name), projects(name), coauthor:coauthor_id(name)')
        .eq('coordinator_id', user.id)
        .order('created_at', { ascending: false });

      return (data || []).map(p => ({
        ...p,
        lead_name: p.leads?.name || 'Desconhecido',
        project_name: p.projects?.name || 'Desconhecido',
        coauthor_name: p.coauthor?.name || '-',
        commission_value: p.contract_amount > 0
          ? Math.round((p.commission_amount / p.contract_amount) * 100)
          : 0,
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [user]);

  // ─── Chapter Review ────────────────────────────────────────────────────────
  const updateChapterStatus = useCallback(async (chapterId, newStatus, authorId) => {
    if (!user?.id) return false;
    try {
      // 1. Update chapter status
      const { error: updateError } = await supabase
        .from('chapters')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', chapterId);

      if (updateError) throw updateError;

      // 2. Log activity
      const actionLabel = newStatus === 'APROVADO' ? 'CAPITULO_APROVADO' : 'REVISAO_SOLICITADA';
      await supabase.from('coordinator_activities').insert({
        coordinator_id: user.id,
        coauthor_id: authorId,
        action: actionLabel,
        details: `Status do capítulo alterado para ${newStatus}`,
        type: 'status_change',
      });

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [user]);

  // ─── Send Message (via coordinator_activities) ───────────────────────────────
  const sendMessage = useCallback(async (coauthorId, subject, content) => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase.from('coordinator_activities').insert({
        coordinator_id: user.id,
        coauthor_id: coauthorId,
        action: 'MENSAGEM_ENVIADA',
        details: `Assunto: ${subject}\n\n${content}`,
        type: 'message',
      });
      return !error;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [user]);

  return {
    loading,
    error,
    getDashboardMetrics,
    getCoauthorsList,
    getCoauthorDetails,
    addObservation,
    sendMessage,
    getFunnelCandidates,
    getCoordinatorLeads,
    updateCandidateStatus,
    updateLeadStatus,
    addLead,
    getCoordinatorPayments,
    getCoordinatorRanking,
    updateChapterStatus,
  };
}
