
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminMetrics() {
  const { getTenantId } = useAuth();
  const [metrics, setMetrics] = useState({
    leadsTotal: 0, leadsWeek: 0, fechamentosMonth: 0,
    receitaTotal: 0, ticketMedio: 0, conversaoGeral: 0,
    topCoordinators: [], projetosAtivos: 0, alerts: [],
    leadsByStatus: [], revenueHistory: [],
    editorial: { activeCoauthors: 0, draftChapters: 0, reviewChapters: 0, overdueChapters: 0, avgProgress: 0, recentUpdates: 0 },
    topOverdue: [], bottomProgress: [], topProgress: []
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    try {
      const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
      const tenantId = getTenantId();
      
      const leads = (data.leads || []).filter(l => l.tenant_id === tenantId);
      const payments = (data.payments || []).filter(p => p.tenant_id === tenantId);
      const projects = (data.projects || []).filter(p => p.tenant_id === tenantId);
      const users = (data.users || []).filter(u => u.tenant_id === tenantId);
      const chapters = (data.chapters || []).filter(c => c.tenant_id === tenantId);

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const leadsWeek = leads.filter(l => new Date(l.created_at) >= oneWeekAgo).length;
      const fechamentosMonth = leads.filter(l => l.status === 'FECHADO' && new Date(l.created_at) >= firstDayOfMonth).length;
      const receitaTotalMonth = payments.filter(p => new Date(p.created_at) >= firstDayOfMonth).reduce((acc, p) => acc + p.contract_amount, 0);
      const ticketMedio = fechamentosMonth > 0 ? receitaTotalMonth / fechamentosMonth : 0;
      const conversaoGeral = leads.length > 0 ? ((leads.filter(l => l.status === 'FECHADO').length / leads.length) * 100).toFixed(1) : 0;
      const projetosAtivos = projects.filter(p => p.status === 'ativo').length;

      // Top Coordinators
      const coords = users.filter(u => u.role === 'COORDENADOR');
      const topCoordinators = coords.map(c => {
        const cLeads = leads.filter(l => l.coordinator_id === c.id);
        const closed = cLeads.filter(l => l.status === 'FECHADO' && new Date(l.created_at) >= firstDayOfMonth).length;
        return { id: c.id, name: c.name, fechamentos: closed };
      }).sort((a, b) => b.fechamentos - a.fechamentos).slice(0, 3);

      // Alerts
      const alerts = [];
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      const leadsParados = leads.filter(l => !['FECHADO', 'PERDIDO'].includes(l.status) && new Date(l.updated_at) < threeDaysAgo).length;
      if (leadsParados > 0) alerts.push({ type: 'warning', message: `${leadsParados} Leads parados há mais de 3 dias` });

      const capitulosAtrasados = chapters.filter(c => new Date(c.updated_at) < threeDaysAgo && c.status === 'RASCUNHO').length;
      if (capitulosAtrasados > 0) alerts.push({ type: 'danger', message: `${capitulosAtrasados} Capítulos sem atualização há 3 dias` });

      // Chart Data
      const statusCounts = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});
      const leadsByStatus = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

      // Mock Revenue History
      const months = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'];
      const revenueHistory = months.map(m => ({ name: m, total: Math.floor(Math.random() * 5000) + 2000 }));
      revenueHistory[5].total = receitaTotalMonth;

      // Editorial Metrics
      const activeCoauthors = users.filter(u => u.role === 'COAUTOR').length;
      const draftChapters = chapters.filter(c => c.status === 'RASCUNHO').length;
      const reviewChapters = chapters.filter(c => ['ENVIADO_PARA_REVISAO', 'EM_REVISAO'].includes(c.status)).length;
      
      const enrichedChapters = chapters.map(c => {
        const author = users.find(u => u.id === c.author_id);
        const progress = c.word_goal > 0 ? Math.min(100, Math.round((c.word_count / c.word_goal) * 100)) : 0;
        const diffTime = new Date(c.deadline).getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = diffDays < 0 && !['APROVADO', 'FINALIZADO'].includes(c.status);
        return { ...c, authorName: author?.name || 'Desconhecido', progress, diffDays, isOverdue };
      });

      const overdueChaptersList = enrichedChapters.filter(c => c.isOverdue);
      const recentUpdates = chapters.filter(c => new Date(c.updated_at) >= oneWeekAgo).length;
      const avgProgress = enrichedChapters.length > 0 
        ? Math.round(enrichedChapters.reduce((acc, c) => acc + c.progress, 0) / enrichedChapters.length) 
        : 0;

      const topOverdue = [...overdueChaptersList].sort((a, b) => a.diffDays - b.diffDays).slice(0, 10); // Lowest diffDays = most overdue
      const nonCompleted = enrichedChapters.filter(c => !['APROVADO', 'FINALIZADO'].includes(c.status));
      const bottomProgress = [...nonCompleted].sort((a, b) => a.progress - b.progress).slice(0, 10);
      const topProgress = [...nonCompleted].sort((a, b) => b.progress - a.progress).slice(0, 10);

      const editorial = {
        activeCoauthors, draftChapters, reviewChapters, overdueChapters: overdueChaptersList.length, avgProgress, recentUpdates
      };

      setMetrics({
        leadsTotal: leads.length, leadsWeek, fechamentosMonth, receitaTotal: receitaTotalMonth, ticketMedio, conversaoGeral,
        topCoordinators, projetosAtivos, alerts, leadsByStatus, revenueHistory,
        editorial, topOverdue, bottomProgress, topProgress
      });
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }, [getTenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  return { metrics, loading, refresh: loadData };
}
