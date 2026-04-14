import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Megaphone, Trash2, Loader2, Send, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader, BtnPrimary } from '@/lib/brand';

const AUDIENCE_OPTIONS = [
  { value: 'COORDENADOR', label: 'Coordenadores', color: BLUE },
  { value: 'COAUTOR',     label: 'Coautores',     color: '#8B5CF6' },
  { value: 'GESTOR',      label: 'Gestores',      color: '#F59E0B' },
];

const AudienceBadge = ({ roles }) => {
  if (!roles || roles.length === 0) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${NAV}08`, color: `${NAV}50` }}>
      Todos
    </span>
  );
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map(r => {
        const opt = AUDIENCE_OPTIONS.find(o => o.value === r);
        return (
          <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${opt?.color || NAV}14`, color: opt?.color || NAV }}>
            {opt?.label || r}
          </span>
        );
      })}
    </div>
  );
};

const AdminAnnouncementsPage = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', audience: [] });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, created_at, target_roles')
      .order('created_at', { ascending: false });
    if (!error) setAnnouncements(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const toggleAudience = (value) => {
    setForm(f => ({
      ...f,
      audience: f.audience.includes(value)
        ? f.audience.filter(v => v !== value)
        : [...f.audience, value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSending(true);

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      // target_roles: form.audience.length > 0 ? form.audience : null,
    };

    // Try with target_roles first; fall back without it if column doesn't exist
    let error;
    ({ error } = await supabase.from('announcements').insert({
      ...payload,
      target_roles: form.audience.length > 0 ? form.audience : null,
    }));

    if (error?.code === '42703') {
      // Column doesn't exist yet — insert without it
      ({ error } = await supabase.from('announcements').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao enviar aviso', description: error.message });
    } else {
      toast({ title: 'Aviso enviado!', description: 'Aparecerá no painel dos destinatários.' });
      setForm({ title: '', content: '', audience: [] });
      fetchAnnouncements();
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) { toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message }); }
    else { setAnnouncements(prev => prev.filter(a => a.id !== id)); }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '12px', fontSize: '14px',
    border: `1.5px solid ${NAV}18`, color: NAV, background: 'white', outline: 'none',
    fontFamily: "'Be Vietnam Pro', sans-serif",
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <Helmet><title>Avisos — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Avisos</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Envie comunicados para gestores, coordenadores e coautores.</p>
      </div>

      {/* Formulário */}
      <BrandCard>
        <BrandCardHeader icon={Megaphone} iconColor={RED} accentColor={RED} title="Novo Aviso" />
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Público-alvo */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: `${NAV}60` }}>
                <Users className="h-3.5 w-3.5" />
                Destinatários
              </label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map(opt => {
                  const selected = form.audience.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleAudience(opt.value)}
                      className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all"
                      style={selected
                        ? { background: opt.color, color: 'white', border: `1.5px solid ${opt.color}` }
                        : { background: 'transparent', color: opt.color, border: `1.5px solid ${opt.color}50` }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <span className="text-xs self-center" style={{ color: `${NAV}40` }}>
                  {form.audience.length === 0 ? '(nenhum selecionado = todos)' : ''}
                </span>
              </div>
            </div>

            {/* Título */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}60` }}>Título</label>
              <input
                id="title" placeholder="Ex: Reunião obrigatória esta semana"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Conteúdo */}
            <div className="space-y-1.5">
              <label htmlFor="content" className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}60` }}>Conteúdo</label>
              <textarea
                id="content" rows={4}
                placeholder="Descreva o aviso em detalhes..."
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required
                className="resize-none"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <BtnPrimary loading={sending} loadingLabel="Enviando..." label="Enviar Aviso" icon={Send} />
          </form>
        </div>
      </BrandCard>

      {/* Lista */}
      <BrandCard>
        <BrandCardHeader icon={Megaphone} iconColor={BLUE} accentColor={BLUE} title="Avisos Enviados" />
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: BLUE }} />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Megaphone className="h-8 w-8 mb-2" style={{ color: `${NAV}25` }} />
            <p className="text-sm" style={{ color: `${NAV}50` }}>Nenhum aviso enviado ainda.</p>
          </div>
        ) : (
          <ul style={{ borderTop: `1px solid ${NAV}08` }}>
            {announcements.map(a => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-4 px-6 py-4 transition-colors"
                style={{ borderBottom: `1px solid ${NAV}08` }}
                onMouseEnter={e => { e.currentTarget.style.background = `${NAV}04`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{a.title}</p>
                    <AudienceBadge roles={a.target_roles} />
                  </div>
                  <p className="text-sm mt-0.5 line-clamp-2" style={{ color: `${NAV}70` }}>{a.content}</p>
                  <p className="text-xs mt-1" style={{ color: `${NAV}40` }}>{formatDate(a.created_at)}</p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="shrink-0 p-1.5 rounded-lg transition-colors mt-0.5"
                  style={{ color: `${NAV}30` }}
                  onMouseEnter={e => { e.currentTarget.style.color = RED; e.currentTarget.style.background = `${RED}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.color = `${NAV}30`; e.currentTarget.style.background = 'transparent'; }}
                  title="Excluir aviso"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </BrandCard>
    </div>
  );
};

export default AdminAnnouncementsPage;
