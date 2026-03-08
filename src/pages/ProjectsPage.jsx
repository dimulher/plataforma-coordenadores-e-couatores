
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Calendar, Loader2, FolderOpen } from 'lucide-react';

const PROJECT_TYPES = ['COAUTORIA', 'MENTORIA', 'CURSO', 'PROJETO_COLETIVO'];
const PROJECT_STATUSES = ['ativo', 'pausado', 'finalizado'];

const STATUS_COLORS = {
  ativo: 'bg-green-100 text-green-800',
  pausado: 'bg-yellow-100 text-yellow-800',
  finalizado: 'bg-gray-100 text-gray-800',
};

const TYPE_COLORS = {
  COAUTORIA: 'bg-blue-100 text-blue-800',
  MENTORIA: 'bg-purple-100 text-purple-800',
  CURSO: 'bg-orange-100 text-orange-800',
  PROJETO_COLETIVO: 'bg-pink-100 text-pink-800',
};

const ProjectsPage = () => {
  const { user, isAdmin, isCoautor } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    name: '',
    type: 'COAUTORIA',
    status: 'ativo',
    start_date: '',
    end_date: '',
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('projects').select('id, name, type, status, start_date, end_date, created_at');

      // Coautores veem apenas projetos nos quais participam; gestores e admins veem todos
      if (isCoautor()) {
        const { data: participations } = await supabase
          .from('project_participants')
          .select('project_id')
          .eq('user_id', user.id);
        const ids = (participations || []).map(p => p.project_id);
        if (ids.length === 0) { setProjects([]); setLoading(false); return; }
        query = query.in('id', ids);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Falha ao carregar projetos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin, isCoautor]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('projects').insert({
        name: formData.name,
        type: formData.type,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      });
      if (error) throw error;
      toast({ title: 'Projeto criado!' });
      setIsModalOpen(false);
      setFormData({ name: '', type: 'COAUTORIA', status: 'ativo', start_date: '', end_date: '' });
      loadProjects();
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = projects.filter(p => {
    const matchType = typeFilter === 'ALL' || p.type === typeFilter;
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchType && matchStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Projetos - NAB Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
            <p className="text-muted-foreground mt-1">Gerencie projetos de coautoria, mentoria e cursos</p>
          </div>
          {isAdmin() && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Novo Projeto
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg shadow">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48 bg-background text-foreground">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Tipos</SelectItem>
              {PROJECT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-background text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              {PROJECT_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid de projetos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
              <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
              <p>Nenhum projeto encontrado</p>
            </div>
          ) : filtered.map(project => (
            <Card key={project.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
                  <Badge className={STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-800'}>
                    {project.status}
                  </Badge>
                </div>
                <Badge className={`${TYPE_COLORS[project.type] || 'bg-gray-100 text-gray-800'} mt-2 w-fit`}>
                  {project.type}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {(project.start_date || project.end_date) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      {project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : '—'}
                      {' → '}
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal criar projeto */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                required
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={v => setFormData(f => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(f => ({ ...f, start_date: e.target.value }))}
                  className="bg-background text-foreground"
                />
              </div>
              <div>
                <Label>Data de Término</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(f => ({ ...f, end_date: e.target.value }))}
                  className="bg-background text-foreground"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Projeto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsPage;
