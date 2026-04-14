import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Megaphone, Trash2, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader, BtnPrimary } from '@/lib/brand';

const AdminAnnouncementsPage = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements').select('id, title, content, created_at')
      .order('created_at', { ascending: false });
    if (!error) setAnnouncements(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSending(true);
    const { error } = await supabase.from('announcements').insert({ title: form.title.trim(), content: form.content.trim() });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao enviar aviso', description: error.message });
    } else {
      toast({ title: 'Aviso enviado!', description: 'Aparecerá no painel de todos.' });
      setForm({ title: '', content: '' });
      fetchAnnouncements();
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) { toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message }); }
    else { setAnnouncements(prev => prev.filter(a => a.id !== id)); }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
        <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Envie comunicados para gestores e coautores.</p>
      </div>

      {/* Formulário */}
      <BrandCard>
        <BrandCardHeader icon={Megaphone} iconColor={RED} accentColor={RED} title="Novo Aviso" />
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-1.5">
              <label htmlFor="content" className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}60` }}>Conteúdo</label>
              <textarea
                id="content" rows={4}
                placeholder="Descreva o aviso em detalhes..."
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required
                className="resize-none"
                style={{ ...inputStyle }}
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
          <div className="flex flex-col items-center justify-center h-32" style={{ color: `${NAV}30` }}>
            <Megaphone className="h-8 w-8 mb-2" />
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
                  <p className="font-semibold truncate" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{a.title}</p>
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
