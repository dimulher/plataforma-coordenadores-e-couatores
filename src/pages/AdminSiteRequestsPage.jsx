import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Globe, Search, Clock, CheckCircle2, Loader2, ExternalLink, Calendar } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader } from '@/lib/brand';

const STATUS_CONFIG = {
  PENDENTE:     { label: 'Pendente',     color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: BLUE,      bg: `${BLUE}12` },
  CONCLUIDO:    { label: 'Concluído',    color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  CANCELADO:    { label: 'Cancelado',    color: `${NAV}60`, bg: `${NAV}08` },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDENTE;
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
};

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: '10px', fontSize: '13px',
  border: `1.5px solid ${NAV}18`, color: NAV, background: 'white', outline: 'none',
};

const AdminSiteRequestsPage = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_requests')
        .select(`*, coordinator:coordinator_id (id, name, email, avatar_url, phone, manager:manager_id ( name ))`)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      toast({ title: 'Erro ao carregar solicitações', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openModal = (req) => {
    setSelected(req);
    setEditStatus(req.status);
    setEditNotes(req.notes || '');
    setEditWebsiteUrl(req.website_url || '');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_requests')
        .update({ status: editStatus, notes: editNotes || null, website_url: editWebsiteUrl || null })
        .eq('id', selected.id);
      if (error) throw error;
      toast({ title: 'Salvo!', description: 'Solicitação atualizada com sucesso.' });
      setSelected(null);
      await fetchRequests();
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = requests.filter(r => {
    const name = (r.coordinator?.name || r.coordinator_name || '').toLowerCase();
    const email = r.coordinator?.email?.toLowerCase() || '';
    const matchSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: requests.length,
    PENDENTE: requests.filter(r => r.status === 'PENDENTE').length,
    EM_ANDAMENTO: requests.filter(r => r.status === 'EM_ANDAMENTO').length,
    CONCLUIDO: requests.filter(r => r.status === 'CONCLUIDO').length,
  };

  return (
    <>
      <Helmet><title>Solicitações de Site — Novos Autores do Brasil</title></Helmet>

      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Solicitações de Site</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Gerencie os pedidos de site de divulgação dos coordenadores.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de Pedidos', value: counts.total,        icon: Globe,        color: NAV,      bg: `${NAV}06` },
            { label: 'Pendentes',        value: counts.PENDENTE,      icon: Clock,        color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Em Andamento',     value: counts.EM_ANDAMENTO,  icon: Loader2,      color: BLUE,      bg: `${BLUE}08` },
            { label: 'Concluídos',       value: counts.CONCLUIDO,     icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: bg, border: `1px solid ${color}20` }}>
              <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: NAV }}>{value}</p>
                <p className="text-xs" style={{ color: `${NAV}55` }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}40` }} />
            <Input
              placeholder="Buscar por nome ou email do coordenador..."
              className="pl-9 bg-white text-sm"
              style={{ borderColor: `${NAV}20`, color: NAV }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
              <SelectItem value="CONCLUIDO">Concluído</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <BrandCard>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead style={{ background: `${NAV}04`, borderBottom: `1px solid ${NAV}08` }}>
                  <tr>
                    {['Coordenador', 'Líder', 'Solicitado em', 'Status', 'Site', 'Ações'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}50` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(req => (
                    <tr key={req.id} className="transition-colors" style={{ borderTop: `1px solid ${NAV}08` }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${NAV}03`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold" style={{ color: NAV }}>{req.coordinator?.name || req.coordinator_name || '—'}</p>
                        <p className="text-xs" style={{ color: `${NAV}45` }}>{req.coordinator?.email || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: `${NAV}60` }}>
                        {req.coordinator?.manager?.name || req.gestor_name || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: `${NAV}55` }}>
                          <Calendar className="h-3.5 w-3.5" />
                          {req.requested_at
                            ? new Date(req.requested_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4">
                        {req.website_url ? (
                          <a href={req.website_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium transition-colors"
                            style={{ color: BLUE }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Ver site
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: `${NAV}30` }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => openModal(req)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ border: `1.5px solid ${BLUE}30`, color: BLUE, background: 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}08`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <Globe className="h-12 w-12 mx-auto mb-3" style={{ color: `${NAV}20` }} />
                        <p className="font-medium" style={{ color: `${NAV}50` }}>Nenhuma solicitação encontrada</p>
                        <p className="text-sm mt-1" style={{ color: `${NAV}35` }}>
                          {searchTerm || statusFilter !== 'ALL' ? 'Tente ajustar os filtros' : 'As solicitações aparecerão aqui'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </BrandCard>
      </div>

      {/* Modal de Gerenciamento */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              <Globe className="h-5 w-5" style={{ color: BLUE }} />
              Gerenciar Solicitação
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl p-4" style={{ background: `${NAV}04`, border: `1px solid ${NAV}10` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold" style={{ color: NAV }}>{selected.coordinator?.name || selected.coordinator_name || '—'}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${BLUE}12`, color: BLUE }}>Coordenador</span>
                </div>
                <p className="text-sm" style={{ color: `${NAV}55` }}>{selected.coordinator?.email}</p>
                {selected.coordinator?.phone && <p className="text-sm" style={{ color: `${NAV}55` }}>{selected.coordinator.phone}</p>}
                {(selected.coordinator?.manager?.name || selected.gestor_name) && (
                  <p className="text-xs mt-1" style={{ color: `${NAV}40` }}>Líder: {selected.coordinator?.manager?.name || selected.gestor_name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: `${NAV}80` }}>Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: `${NAV}80` }}>Link do Site</label>
                <div className="flex gap-2">
                  <input
                    value={editWebsiteUrl}
                    onChange={e => setEditWebsiteUrl(e.target.value)}
                    placeholder="Gerado ao solicitar"
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '11px', flex: 1 }}
                  />
                  {editWebsiteUrl && (
                    <a href={editWebsiteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center px-3 rounded-xl shrink-0 transition-colors"
                      style={{ border: `1.5px solid ${BLUE}25`, color: BLUE, background: 'transparent' }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: `${NAV}80` }}>Observações internas</label>
                <Textarea
                  placeholder="Notas sobre o andamento..."
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="bg-white resize-none"
                  style={{ borderColor: `${NAV}18`, color: NAV }}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ border: `1.5px solid ${NAV}20`, color: `${NAV}70`, background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${NAV}06`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: BLUE, opacity: saving ? 0.7 : 1 }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSiteRequestsPage;
