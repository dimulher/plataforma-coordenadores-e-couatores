
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useCoordinatorMetrics() {
  const { user, getTenantId } = useAuth();
  const [metrics, setMetrics] = useState({
    leadsWeek: 0, fechamentosMonth: 0, conversao: 0,
    receitaGerada: 0, comissaoPrevista: 0, comissaoRecebida: 0,
    leadsByStatus: { NOVO: 0, CONTATO: 0, QUALIFICADO: 0, PROPOSTA: 0, FECHADO: 0, PERDIDO: 0 },
    alerts: [], ranking: []
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    if (!user) return;
    try {
      const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
      const tenantId = getTenantId();
      
      const myLeads = (data.leads || []).filter(l => l.tenant_id === tenantId && l.coordinator_id === user.id);
      const myPayments = (data.payments || []).filter(p => p.tenant_id === tenantId && p.coordinator_id === user.id);
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const leadsWeek = myLeads.filter(l => new Date(l.created_at) >= oneWeekAgo).length;
      const fechamentosMonth = myLeads.filter(l => l.status === 'FECHADO' && new Date(l.created_at) >= firstDayOfMonth).length;
      const conversao = myLeads.length > 0 ? ((myLeads.filter(l => l.status === 'FECHADO').length / myLeads.length) * 100).toFixed(1) : 0;
      
      let receitaGerada = 0, comissaoPrevista = 0, comissaoRecebida = 0;
      myPayments.forEach(p => {
        receitaGerada += p.contract_amount || 0;
        if (p.commission_status === 'pago') comissaoRecebida += p.commission_amount || 0;
        else comissaoPrevista += p.commission_amount || 0;
      });

      const leadsByStatus = { NOVO: 0, CONTATO: 0, QUALIFICADO: 0, PROPOSTA: 0, FECHADO: 0, PERDIDO: 0 };
      myLeads.forEach(l => { if (leadsByStatus[l.status] !== undefined) leadsByStatus[l.status]++; });

      const alerts = [];
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const leadsParados = myLeads.filter(l => !['FECHADO', 'PERDIDO'].includes(l.status) && new Date(l.updated_at) < threeDaysAgo).length;
      if (leadsParados > 0) alerts.push({ type: 'warning', message: `Você tem ${leadsParados} leads sem atualização há 3 dias.` });
      if (fechamentosMonth < 10) alerts.push({ type: 'danger', message: `Meta de 10 fechamentos não atingida (${fechamentosMonth}/10).` });

      // Ranking
      const users = (data.users || []).filter(u => u.tenant_id === tenantId && u.role === 'COORDENADOR');
      const allLeads = (data.leads || []).filter(l => l.tenant_id === tenantId);
      const ranking = users.map(u => {
        const closed = allLeads.filter(l => l.coordinator_id === u.id && l.status === 'FECHADO' && new Date(l.created_at) >= firstDayOfMonth).length;
        return { id: u.id, name: u.name, fechamentos: closed };
      }).sort((a, b) => b.fechamentos - a.fechamentos).slice(0, 5);

      setMetrics({ leadsWeek, fechamentosMonth, conversao, receitaGerada, comissaoPrevista, comissaoRecebida, leadsByStatus, alerts, ranking });
      setLoading(false);
    } catch (e) { setLoading(false); }
  }, [user, getTenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  return { metrics, loading, refresh: loadData };
}
