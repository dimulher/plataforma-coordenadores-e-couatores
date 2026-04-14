
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  HeartHandshake as Handshake, Calendar, ExternalLink, Clock,
  Plus, Trash2, Link as LinkIcon, Pencil, X, Check,
} from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader, BtnPrimary, BtnOutline } from '@/lib/brand';

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '12px', fontSize: '14px',
  border: `1.5px solid ${NAV}18`, color: NAV, background: 'white', outline: 'none',
  fontFamily: "'Be Vietnam Pro', sans-serif",
};

const focusStyle  = (e) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; };
const blurStyle   = (e) => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; };

// Converte ISO → valor para datetime-local input
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MentorshipPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'ADMIN';

  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', link: '', description: '' });

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', date: '', link: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);

  const fetchMentorships = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mentorships')
      .select('*')
      .order('date', { ascending: true });
    setMentorships(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMentorships(); }, [fetchMentorships]);

  const now = new Date();
  const upcoming = mentorships.filter(m => m.date && new Date(m.date) >= now);
  const past     = mentorships.filter(m => m.date && new Date(m.date) < now);

  const formatDate = (d) => {
    if (!d) return 'Data não definida';
    return new Date(d).toLocaleString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Criar ─────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      toast({ title: 'Título e data são obrigatórios', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('mentorships').insert({
        title: form.title.trim(),
        date: new Date(form.date).toISOString(),
        link: form.link.trim() || null,
        description: form.description.trim() || null,
      });
      if (error) throw error;
      toast({ title: 'Mentoria criada!', description: 'Já aparece na lista de sessões.' });
      setForm({ title: '', date: '', link: '', description: '' });
      setShowForm(false);
      await fetchMentorships();
    } catch (err) {
      toast({ title: 'Erro ao criar mentoria', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Abrir edição ───────────────────────────────────────────────────────────────
  const openEdit = (m) => {
    setEditingId(m.id);
    setEditForm({
      title: m.title || '',
      date: toLocalInput(m.date),
      link: m.link || '',
      description: m.description || '',
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  // ── Salvar edição ──────────────────────────────────────────────────────────────
  const handleSaveEdit = async (id) => {
    if (!editForm.title.trim()) {
      toast({ title: 'Título obrigatório', variant: 'destructive' });
      return;
    }
    setEditSaving(true);
    try {
      const { error } = await supabase.from('mentorships').update({
        title: editForm.title.trim(),
        date: editForm.date ? new Date(editForm.date).toISOString() : undefined,
        link: editForm.link.trim() || null,
        description: editForm.description.trim() || null,
      }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Mentoria atualizada!' });
      setEditingId(null);
      await fetchMentorships();
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setEditSaving(false);
    }
  };

  // ── Excluir ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    const { error } = await supabase.from('mentorships').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      setMentorships(prev => prev.filter(m => m.id !== id));
      toast({ title: 'Mentoria removida.' });
    }
  };

  // ── Card ───────────────────────────────────────────────────────────────────────
  const MentorCard = ({ m, isPast }) => {
    const isEditing = editingId === m.id;

    if (isEditing) {
      return (
        <div
          className="rounded-2xl bg-white"
          style={{ border: `1.5px solid ${BLUE}40`, boxShadow: `0 4px 16px ${BLUE}12` }}
        >
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${NAV}08`, background: `${BLUE}06` }}>
            <span className="text-sm font-bold" style={{ color: BLUE, fontFamily: 'Poppins, sans-serif' }}>Editar Sessão</span>
            <button onClick={cancelEdit} className="p-1 rounded-lg transition-colors" style={{ color: `${NAV}50` }}
              onMouseEnter={e => { e.currentTarget.style.color = RED; e.currentTarget.style.background = `${RED}10`; }}
              onMouseLeave={e => { e.currentTarget.style.color = `${NAV}50`; e.currentTarget.style.background = 'transparent'; }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}55` }}>Título</label>
              <input
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}55` }}>Data e Hora</label>
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                  style={inputStyle}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: `${NAV}55` }}>
                  <LinkIcon className="h-3 w-3" />
                  {isPast ? 'Link da Gravação' : 'Link da Sessão'}
                </label>
                <input
                  type="url"
                  placeholder={isPast ? 'https://youtube.com/...' : 'https://meet.google.com/...'}
                  value={editForm.link}
                  onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))}
                  style={inputStyle}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}55` }}>Descrição</label>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="resize-none"
                style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleSaveEdit(m.id)}
                disabled={editSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: BLUE, opacity: editSaving ? 0.7 : 1 }}
              >
                <Check className="h-4 w-4" />
                {editSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ border: `1.5px solid ${NAV}20`, color: `${NAV}70`, background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${NAV}06`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="rounded-2xl p-5 flex flex-col gap-3 bg-white transition-shadow hover:shadow-md"
        style={{
          border: `1px solid ${isPast ? `${NAV}12` : `${BLUE}30`}`,
          boxShadow: `0 1px 4px ${NAV}08`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-base leading-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
            {m.title || 'Mentoria'}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={isPast
                ? { background: 'rgba(100,116,139,0.15)', color: '#475569' }
                : { background: `${BLUE}15`, color: BLUE }}
            >
              {isPast ? 'Realizada' : 'Próxima'}
            </span>
            {isAdmin && (
              <>
                <button
                  onClick={() => openEdit(m)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: BLUE, background: `${BLUE}10` }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}10`; }}
                  title="Editar mentoria"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: RED, background: `${RED}10` }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${RED}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${RED}10`; }}
                  title="Excluir mentoria"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {m.description && (
          <p className="text-sm leading-relaxed" style={{ color: `${NAV}70` }}>{m.description}</p>
        )}

        <div className="flex items-center gap-2 text-sm" style={{ color: `${NAV}70` }}>
          <Calendar className="h-4 w-4 shrink-0" style={{ color: BLUE }} />
          <span className="capitalize">{formatDate(m.date)}</span>
        </div>

        {m.link ? (
          <BtnOutline
            onClick={() => window.open(m.link, '_blank')}
            icon={ExternalLink}
            label={isPast ? 'Ver Gravação' : 'Acessar Link'}
            color={isPast ? NAV : BLUE}
            className="w-full justify-center mt-1"
          />
        ) : isAdmin && isPast ? (
          <button
            onClick={() => openEdit(m)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ border: `1.5px dashed ${NAV}20`, color: `${NAV}45`, background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE; e.currentTarget.style.background = `${BLUE}06`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${NAV}20`; e.currentTarget.style.color = `${NAV}45`; e.currentTarget.style.background = 'transparent'; }}
          >
            <LinkIcon className="h-4 w-4" />
            Adicionar link da gravação
          </button>
        ) : null}
      </div>
    );
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <Helmet><title>Mentoria — Novos Autores do Brasil</title></Helmet>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Mentoria</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Sessões de orientação e acompanhamento</p>
        </div>
        {isAdmin && (
          <BtnPrimary
            onClick={() => setShowForm(v => !v)}
            icon={showForm ? X : Plus}
            label={showForm ? 'Cancelar' : 'Nova Mentoria'}
          />
        )}
      </div>

      {/* Formulário de criação (admin only) */}
      {isAdmin && showForm && (
        <BrandCard>
          <BrandCardHeader icon={Handshake} iconColor={BLUE} accentColor={BLUE} title="Agendar Nova Sessão" />
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}60` }}>
                  Título da Sessão *
                </label>
                <input
                  placeholder="Ex: Mentoria de Escrita — Módulo 3"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  style={inputStyle}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}60` }}>
                    <Calendar className="inline h-3 w-3 mr-1" />Data e Hora *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    style={inputStyle}
                    onFocus={focusStyle} onBlur={blurStyle}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}60` }}>
                    <LinkIcon className="inline h-3 w-3 mr-1" />Link da Sessão (Meet / Zoom)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={form.link}
                    onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                    style={inputStyle}
                    onFocus={focusStyle} onBlur={blurStyle}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}60` }}>
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o tema ou pauta da sessão..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="resize-none"
                  style={inputStyle}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>

              <div className="pt-1">
                <BtnPrimary loading={saving} loadingLabel="Agendando..." label="Agendar Sessão" icon={Calendar} />
              </div>
            </form>
          </div>
        </BrandCard>
      )}

      {/* Lista vazia */}
      {mentorships.length === 0 && !showForm && (
        <div
          className="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${NAV}12`, background: '#fff' }}
        >
          <div className="text-center">
            <Handshake className="h-14 w-14 mx-auto mb-4" style={{ color: `${NAV}25` }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              Nenhuma mentoria agendada
            </h3>
            <p className="text-sm" style={{ color: `${NAV}50` }}>
              {isAdmin
                ? 'Clique em "Nova Mentoria" para agendar uma sessão.'
                : 'As sessões serão divulgadas aqui com os links de acesso.'}
            </p>
          </div>
        </div>
      )}

      {/* Próximas sessões */}
      {upcoming.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: BLUE }} />
            <h2 className="text-base font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Próximas Sessões</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${BLUE}15`, color: BLUE }}>
              {upcoming.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(m => <MentorCard key={m.id} m={m} isPast={false} />)}
          </div>
        </section>
      )}

      {/* Sessões anteriores */}
      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold" style={{ color: `${NAV}60`, fontFamily: 'Poppins, sans-serif' }}>Sessões Anteriores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {past.map(m => <MentorCard key={m.id} m={m} isPast={true} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default MentorshipPage;
