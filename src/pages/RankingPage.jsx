
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Target } from 'lucide-react';

const RankingPage = () => {
  const { user, getTenantId } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [period, setPeriod] = useState('ALL'); // ALL, MONTH, WEEK

  useEffect(() => {
    calculateRanking();
  }, [period]);

  const calculateRanking = () => {
    const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
    if (!data.users || !data.leads || !data.payments) return;

    const coordinators = data.users.filter(u => u.tenant_id === getTenantId() && u.role === 'COORDENADOR');
    const leads = data.leads.filter(l => l.tenant_id === getTenantId());
    const payments = data.payments.filter(p => p.tenant_id === getTenantId());

    const currentDate = new Date('2026-03-01T12:00:00Z');
    
    const filterDate = (dateStr) => {
      if (period === 'ALL') return true;
      const d = new Date(dateStr);
      const diffDays = Math.floor(Math.abs(currentDate - d) / (1000 * 60 * 60 * 24));
      if (period === 'MONTH') return diffDays <= 30;
      if (period === 'WEEK') return diffDays <= 7;
      return true;
    };

    const stats = coordinators.map(coord => {
      const coordLeads = leads.filter(l => l.coordinator_id === coord.id && filterDate(l.created_at));
      const closedLeads = coordLeads.filter(l => l.status === 'FECHADO');
      const coordPayments = payments.filter(p => p.coordinator_id === coord.id && filterDate(p.created_at));

      const totalLeads = coordLeads.length;
      const totalClosed = closedLeads.length;
      const conversionRate = totalLeads > 0 ? ((totalClosed / totalLeads) * 100) : 0;
      const revenue = coordPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        id: coord.id,
        name: coord.name,
        totalClosed,
        conversionRate,
        revenue
      };
    });

    // Sort by primary: closed leads desc, secondary: revenue desc
    stats.sort((a, b) => {
      if (b.totalClosed !== a.totalClosed) return b.totalClosed - a.totalClosed;
      return b.revenue - a.revenue;
    });

    setRanking(stats);
  };

  const getMedal = (index) => {
    if (index === 0) return <span className="text-2xl" title="1º Lugar">🥇</span>;
    if (index === 1) return <span className="text-2xl" title="2º Lugar">🥈</span>;
    if (index === 2) return <span className="text-2xl" title="3º Lugar">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground w-8 inline-block text-center">{index + 1}º</span>;
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <>
      <Helmet><title>Ranking - NAB</title></Helmet>

      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/20 rounded-full">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ranking de Coordenadores</h1>
              <p className="text-muted/80">Acompanhe a performance do time de captação.</p>
            </div>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48 bg-secondary border-secondary-foreground/20 text-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todo Período</SelectItem>
              <SelectItem value="MONTH">Últimos 30 Dias</SelectItem>
              <SelectItem value="WEEK">Últimos 7 Dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-24 text-center">Posição</TableHead>
                <TableHead>Coordenador</TableHead>
                <TableHead className="text-center">Fechamentos</TableHead>
                <TableHead className="text-center">Taxa de Conversão</TableHead>
                <TableHead className="text-right pr-6">Receita Gerada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum dado encontrado.</TableCell></TableRow>
              ) : (
                ranking.map((row, index) => {
                  const isMe = user?.id === row.id;
                  return (
                    <TableRow 
                      key={row.id} 
                      className={`
                        transition-colors hover:bg-muted/30
                        ${isMe ? 'bg-primary/5 border-l-4 border-l-primary font-medium' : ''}
                      `}
                    >
                      <TableCell className="text-center">{getMedal(index)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.name}
                          {isMe && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">Você</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 font-bold text-lg">
                          <Target className="h-4 w-4 text-success" />
                          {row.totalClosed}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {row.conversionRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right pr-6 font-semibold text-primary">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default RankingPage;
