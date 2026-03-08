import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Globe, Search, Clock, CheckCircle2, Loader2, ExternalLink, Calendar } from 'lucide-react';

const STATUS_CONFIG = {
  PENDENTE:     { label: 'Pendente',      color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  EM_ANDAMENTO: { label: 'Em Andamento',  color: 'bg-blue-100 text-blue-800 border-blue-200' },
  CONCLUIDO:    { label: 'Concluído',     color: 'bg-green-100 text-green-800 border-green-200' },
  CANCELADO:    { label: 'Cancelado',     color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDENTE;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
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
        .select(`
          *,
          coordinator:coordinator_id (
            id, name, email, avatar_url, phone,
            manager:manager_id ( name )
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('AdminSiteRequestsPage fetch error:', err);
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
        .update({
          status: editStatus,
          notes: editNotes || null,
          website_url: editWebsiteUrl || null,
        })
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
      <Helmet><title>Solicitações de Site - NAB Platform</title></Helmet>

      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Solicitações de Site</h1>
          <p className="text-slate-500 mt-1">Gerencie os pedidos de site de divulgação dos coordenadores.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de Pedidos', value: counts.total, icon: Globe, color: 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Pendentes', value: counts.PENDENTE, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Em Andamento', value: counts.EM_ANDAMENTO, icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Concluídos', value: counts.CONCLUIDO, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className={`border-slate-200 shadow-sm ${bg}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white shadow-sm">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email do coordenador..."
              className="pl-9 bg-white border-slate-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white">
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
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Coordenador</th>
                    <th className="px-5 py-4">Gestor</th>
                    <th className="px-5 py-4">Solicitado em</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4">Site</th>
                    <th className="px-5 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{req.coordinator?.name || req.coordinator_name || '—'}</p>
                        <p className="text-xs text-slate-400">{req.coordinator?.email || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        {req.coordinator?.manager?.name || req.gestor_name || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Calendar className="h-3.5 w-3.5" />
                          {req.requested_at
                            ? new Date(req.requested_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4">
                        {req.website_url ? (
                          <a
                            href={req.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver site
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                          onClick={() => openModal(req)}
                        >
                          Gerenciar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <Globe className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhuma solicitação encontrada</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {searchTerm || statusFilter !== 'ALL'
                            ? 'Tente ajustar os filtros'
                            : 'As solicitações aparecerão aqui'
                          }
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Gerenciamento */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Gerenciar Solicitação
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-slate-800">{selected.coordinator?.name || selected.coordinator_name || '—'}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                    Coordenador
                  </span>
                </div>
                <p className="text-sm text-slate-500">{selected.coordinator?.email}</p>
                {selected.coordinator?.phone && (
                  <p className="text-sm text-slate-500">{selected.coordinator.phone}</p>
                )}
                {(selected.coordinator?.manager?.name || selected.gestor_name) && (
                  <p className="text-xs text-slate-400 mt-1">Gestor: {selected.coordinator?.manager?.name || selected.gestor_name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-white">
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
                <label className="text-sm font-medium text-slate-700">Link de Captação (gerado automaticamente)</label>
                <div className="flex gap-2">
                  <Input
                    value={editWebsiteUrl}
                    onChange={e => setEditWebsiteUrl(e.target.value)}
                    className="bg-slate-50 text-slate-700 font-mono text-xs"
                    placeholder="Gerado ao solicitar"
                  />
                  {editWebsiteUrl && (
                    <a
                      href={editWebsiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 rounded-md border border-slate-200 text-blue-600 hover:bg-blue-50 shrink-0"
                      title="Abrir link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Observações internas</label>
                <Textarea
                  placeholder="Notas sobre o andamento..."
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="bg-white resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSiteRequestsPage;
