
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, FileText, Wallet, Trophy, Link as LinkIcon, ChevronRight } from 'lucide-react';

const AdminCoordinatorDetailPage = () => {
  const { coordinatorId } = useParams();
  const navigate = useNavigate();
  const { getTenantId } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const rawData = JSON.parse(localStorage.getItem('nab_data') || '{}');
    const tenantId = getTenantId();
    
    const coord = (rawData.users || []).find(u => u.id === coordinatorId && u.tenant_id === tenantId);
    if (!coord) return;

    const allUsers = (rawData.users || []).filter(u => u.tenant_id === tenantId);
    const coordAuthors = allUsers.filter(u => u.role === 'COAUTOR' && u.coordinator_id === coord.id);
    const projects = (rawData.projects || []).filter(p => p.tenant_id === tenantId);
    const chapters = (rawData.chapters || []).filter(c => c.tenant_id === tenantId);
    const payments = (rawData.payments || []).filter(p => p.tenant_id === tenantId && p.coordinator_id === coord.id);

    // Enriched Authors
    const authorsEnriched = coordAuthors.map(author => {
      const authorChapters = chapters.filter(c => c.author_id === author.id);
      const inProgress = authorChapters.filter(c => !['APROVADO', 'FINALIZADO'].includes(c.status)).length;
      const completed = authorChapters.filter(c => ['APROVADO', 'FINALIZADO'].includes(c.status)).length;
      
      const authorProjects = projects.filter(p => p.participants.includes(author.id));
      
      return { ...author, chaptersCount: authorChapters.length, inProgress, completed, projects: authorProjects };
    });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.contract_amount || 0), 0);
    const totalCommission = payments.reduce((sum, p) => sum + (p.commission_amount || 0), 0);
    const paidCommission = payments.filter(p => p.commission_status === 'pago').reduce((sum, p) => sum + (p.commission_amount || 0), 0);

    setData({
      coord,
      authors: authorsEnriched,
      metrics: {
        totalRevenue,
        totalCommission,
        paidCommission,
        pendingCommission: totalCommission - paidCommission,
        leadsCount: (rawData.leads || []).filter(l => l.coordinator_id === coord.id).length
      }
    });

  }, [coordinatorId, getTenantId]);

  if (!data) return <div className="p-8 text-center">Carregando...</div>;

  const { coord, authors, metrics } = data;
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Helmet><title>{coord.name} - NAB Admin</title></Helmet>

      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-2">
        <Link to="/app/admin/coordinators" className="hover:text-blue-600 transition-colors">Coordenadores</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-800 font-medium">{coord.name}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/admin/coordinators')}><ArrowLeft className="w-5 h-5"/></Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{coord.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>ID: {coord.id}</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{coord.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-5 flex items-center gap-4"><Users className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg"/><div><p className="text-sm text-slate-500">Coautores Ativos</p><h3 className="text-2xl font-bold">{authors.length}</h3></div></CardContent></Card>
        <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-5 flex items-center gap-4"><Wallet className="w-8 h-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-lg"/><div><p className="text-sm text-slate-500">Receita Gerada</p><h3 className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</h3></div></CardContent></Card>
        <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-5 flex items-center gap-4"><Wallet className="w-8 h-8 text-orange-500 bg-orange-50 p-1.5 rounded-lg"/><div><p className="text-sm text-slate-500">Comissão Pendente</p><h3 className="text-2xl font-bold">{formatCurrency(metrics.pendingCommission)}</h3></div></CardContent></Card>
        <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="p-5 flex items-center gap-4"><LinkIcon className="w-8 h-8 text-purple-500 bg-purple-50 p-1.5 rounded-lg"/><div><p className="text-sm text-slate-500">Cliques no Link</p><h3 className="text-2xl font-bold">{coord.click_count || 0}</h3></div></CardContent></Card>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm mt-6">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg text-slate-800">Coautores Associados</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Coautor</th>
                <th className="px-6 py-4">Projetos</th>
                <th className="px-6 py-4 text-center">Capítulos (Total)</th>
                <th className="px-6 py-4 text-center">Em Andamento</th>
                <th className="px-6 py-4 text-center">Finalizados</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {authors.map(author => (
                <tr key={author.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{author.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {author.projects.map(p => <Badge key={p.id} variant="outline" className="bg-slate-50 text-slate-600">{p.name}</Badge>)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">{author.chaptersCount}</td>
                  <td className="px-6 py-4 text-center text-orange-600 font-medium">{author.inProgress}</td>
                  <td className="px-6 py-4 text-center text-emerald-600 font-medium">{author.completed}</td>
                  <td className="px-6 py-4 text-center">
                    <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => navigate(`/app/admin/coauthors/${author.id}`)}>Ver Produção</Button>
                  </td>
                </tr>
              ))}
              {authors.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Nenhum coautor associado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminCoordinatorDetailPage;
