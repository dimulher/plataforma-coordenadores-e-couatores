import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Megaphone, Trash2, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminAnnouncementsPage = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false });
    if (!error) setAnnouncements(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from('announcements')
      .insert({ title: form.title.trim(), content: form.content.trim() });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao enviar aviso', description: error.message });
    } else {
      toast({ title: 'Aviso enviado!', description: 'Aparecerá no painel dos gestores.' });
      setForm({ title: '', content: '' });
      fetchAnnouncements();
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } else {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Helmet><title>Avisos - NAB Platform</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold text-slate-800">Avisos</h1>
        <p className="text-slate-500 mt-1">Envie comunicados para gestores e coautores.</p>
      </div>

      {/* Formulário de criação */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-700">
            <Megaphone className="h-4 w-4 text-blue-500" /> Novo Aviso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-slate-700 text-xs font-semibold uppercase tracking-wider">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Reunião obrigatória esta semana"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-slate-700 text-xs font-semibold uppercase tracking-wider">Conteúdo</Label>
              <textarea
                id="content"
                rows={4}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descreva o aviso em detalhes..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                : <><Send className="h-4 w-4 mr-2" /> Enviar Aviso</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de avisos */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-slate-700">Avisos Enviados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <Megaphone className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhum aviso enviado ainda.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {announcements.map(a => (
                <li key={a.id} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{a.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(a.created_at)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                    title="Excluir aviso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnnouncementsPage;
