import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Loader2, Link2, CreditCard, Globe, Calendar, MoreHorizontal, ExternalLink } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader } from '@/lib/brand';

const LINK_TYPES = [
  { id: 'pagamento', label: 'Pagamento',  icon: CreditCard, color: '#10B981' },
  { id: 'site',      label: 'Site',       icon: Globe,      color: BLUE },
  { id: 'agenda',    label: 'Agenda',     icon: Calendar,   color: '#8B5CF6' },
  { id: 'outro',     label: 'Outro',      icon: MoreHorizontal, color: '#F59E0B' },
];

const typeInfo = (id) => LINK_TYPES.find(t => t.id === id) || LINK_TYPES[3];

const VendedorLinksPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [links, setLinks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Form
  const [form, setForm] = useState({ type: 'pagamento', label: '', url: '' });

  const fetchLinks = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('vendedor_links')
      .select('*')
      .eq('vendedor_id', user.id)
      .order('type')
      .order('created_at');
    setLinks(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleAdd = async () => {
    if (!form.label.trim() || !form.url.trim()) {
      toast({ variant: 'destructive', title: 'Preencha o nome e a URL do link.' });
      return;
    }
    // Garantir protocolo
    let url = form.url.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    setSaving(true);
    const { data, error } = await supabase
      .from('vendedor_links')
      .insert({ vendedor_id: user.id, type: form.type, label: form.label.trim(), url })
      .select()
      .single();
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar link', description: error.message });
    } else {
      setLinks(prev => [...prev, data]);
      setForm({ type: 'pagamento', label: '', url: '' });
      toast({ title: 'Link adicionado!' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('vendedor_links').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover link', description: error.message });
    } else {
      setLinks(prev => prev.filter(l => l.id !== id));
      toast({ title: 'Link removido.' });
    }
  };

  // Group by type
  const grouped = LINK_TYPES.map(t => ({
    ...t,
    items: links.filter(l => l.type === t.id),
  })).filter(g => g.items.length > 0);

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: '0.75rem',
    border: `1.5px solid ${NAV}18`,
    color: NAV,
    background: 'white',
    fontSize: '0.875rem',
    outline: 'none',
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meus Links — Vendedor | Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Meus Links</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>
          Links de pagamento, sites, agendas e outros recursos para compartilhar com clientes.
        </p>
      </div>

      {/* ── Formulário ── */}
      <BrandCard>
        <BrandCardHeader icon={Plus} iconColor={BLUE} accentColor={BLUE} title="Adicionar Novo Link" />
        <div className="px-6 py-5 space-y-4">

          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: `${NAV}85` }}>
              Tipo
            </label>
            <div className="flex flex-wrap gap-2">
              {LINK_TYPES.map(t => {
                const Icon = t.icon;
                const active = form.type === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setForm(f => ({ ...f, type: t.id }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={active
                      ? { background: t.color, color: '#fff', boxShadow: `0 2px 8px ${t.color}40` }
                      : { background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}30` }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: `${NAV}70` }}>Nome do link</label>
              <input
                type="text"
                placeholder="Ex: Pagar pelo Stripe"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: `${NAV}70` }}>URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !form.label.trim() || !form.url.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: BLUE }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#2d6a9f'; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLUE; }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      </BrandCard>

      {/* ── Links salvos ── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16" style={{ color: `${NAV}65` }}>
          <Link2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum link cadastrado ainda.</p>
          <p className="text-sm mt-1 opacity-70">Use o formulário acima para adicionar seus links.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => {
            const Icon = group.icon;
            return (
              <BrandCard key={group.id}>
                <BrandCardHeader icon={Icon} iconColor={group.color} accentColor={group.color} title={group.label} />
                <div className="px-6 pb-5 space-y-2">
                  {group.items.map(link => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: `${NAV}03`, border: `1px solid ${NAV}0C` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${group.color}15`, color: group.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: NAV }}>{link.label}</p>
                          <p className="text-xs truncate" style={{ color: `${NAV}75` }}>{link.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: BLUE }}
                          title="Abrir link"
                          onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}12`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: `${NAV}55` }}
                          title="Remover link"
                          onMouseEnter={e => { e.currentTarget.style.color = RED; e.currentTarget.style.background = `${RED}10`; }}
                          onMouseLeave={e => { e.currentTarget.style.color = `${NAV}55`; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </BrandCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendedorLinksPage;
