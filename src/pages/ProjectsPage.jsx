
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Users, Calendar, Filter } from 'lucide-react';

const PROJECT_TYPES = ['COAUTORIA', 'MENTORIA', 'CURSO', 'PROJETO_COLETIVO'];
const PROJECT_STATUSES = ['ativo', 'pausado', 'finalizado'];

const ProjectsPage = () => {
  const { user, getTenantId, isAdmin } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    name: '',
    type: 'COAUTORIA',
    status: 'ativo',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, typeFilter, statusFilter]);

  const loadProjects = () => {
    try {
      const data = JSON.parse(localStorage.getItem('nab_data'));
      let userProjects = data.projects.filter(p => p.tenant_id === getTenantId());

      // Non-admin users only see projects they're part of
      if (!isAdmin()) {
        userProjects = userProjects.filter(p => p.participants.includes(user.id));
      }

      setProjects(userProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar projetos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      const data = JSON.parse(localStorage.getItem('nab_data'));
      
      const newProject = {
        id: `project-${Date.now()}`,
        ...formData,
        tenant_id: getTenantId(),
        participants: [user.id],
        created_at: new Date().toISOString()
      };

      data.projects.push(newProject);
      localStorage.setItem('nab_data', JSON.stringify(data));
      loadProjects();
      closeModal();

      toast({
        title: 'Sucesso',
        description: 'Projeto criado com sucesso'
      });
    } catch (err) {
      console.error('Error creating project:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao criar projeto',
        variant: 'destructive'
      });
    }
  };

  const openModal = () => {
    setFormData({
      name: '',
      type: 'COAUTORIA',
      status: 'ativo',
      start_date: '',
      end_date: ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      ativo: 'bg-green-100 text-green-800',
      pausado: 'bg-yellow-100 text-yellow-800',
      finalizado: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      COAUTORIA: 'bg-blue-100 text-blue-800',
      MENTORIA: 'bg-purple-100 text-purple-800',
      CURSO: 'bg-orange-100 text-orange-800',
      PROJETO_COLETIVO: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Projetos - NAB Platform</title>
        <meta name="description" content="Gerencie seus projetos de coautoria e mentoria" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie projetos de coautoria, mentoria e cursos
            </p>
          </div>
          <Button onClick={openModal} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Filters */}
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

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum projeto encontrado
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="hover-lift shadow-lg cursor-pointer"
                onClick={() => toast({ title: 'Detalhes', description: '🚧 Funcionalidade em desenvolvimento' })}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <Badge className={`${getTypeColor(project.type)} mt-2 w-fit`}>
                    {project.type}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(project.start_date).toLocaleDateString('pt-BR')} - {new Date(project.end_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{project.participants.length} participantes</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="bg-background text-foreground"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit">Criar Projeto</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsPage;
