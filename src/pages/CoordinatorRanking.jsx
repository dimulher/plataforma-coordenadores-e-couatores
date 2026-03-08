
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Target, TrendingUp } from 'lucide-react';

const CoordinatorRanking = () => {
  const { getCoordinatorRanking, loading } = useCoordinatorData();
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await getCoordinatorRanking();
      setRanking(data || []);
    };
    load();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getPositionBadge = (index) => {
    if (index === 0) return <span className="text-2xl" title="1º Lugar">🥇</span>;
    if (index === 1) return <span className="text-2xl" title="2º Lugar">🥈</span>;
    if (index === 2) return <span className="text-2xl" title="3º Lugar">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground px-2">{index + 1}º</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Ranking de Coordenadores - NAB Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-card to-background p-8 rounded-2xl shadow-lg border border-border/30">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-accent/20 rounded-full">
              <Trophy className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ranking Geral</h1>
              <p className="text-muted-foreground mt-1">Classificação competitiva de coordenadores no mês atual</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border/30 overflow-hidden">
          <Table>
            <TableHeader className="bg-background/80">
              <TableRow className="border-border/30">
                <TableHead className="w-24 text-center font-semibold text-foreground">Posição</TableHead>
                <TableHead className="font-semibold text-foreground">Nome do Coordenador</TableHead>
                <TableHead className="text-center font-semibold text-foreground">Fechamentos</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Receita Gerada</TableHead>
                <TableHead className="text-center font-semibold text-foreground">Taxa de Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((coord, index) => {
                const isCurrentUser = coord.id === user?.id;

                return (
                  <TableRow
                    key={coord.id}
                    className={`
                      border-border/30 border-b last:border-0 transition-all duration-300
                      ${isCurrentUser ? 'bg-accent/10 hover:bg-accent/15 border-l-4 border-l-accent' : 'hover:bg-muted/30 border-l-4 border-l-transparent'}
                    `}
                  >
                    <TableCell className="text-center py-4">
                      {getPositionBadge(index)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground py-4 flex items-center gap-2">
                      {coord.name}
                      {isCurrentUser && <span className="text-[10px] uppercase bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-bold">Você</span>}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex items-center justify-center gap-1.5 text-foreground font-semibold">
                        <Target className="h-4 w-4 text-accent" />
                        {coord.closed_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 font-semibold text-success">
                      {formatCurrency(coord.revenue)}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex items-center justify-center gap-1.5 text-foreground font-medium">
                        {coord.conversion_rate}%
                        <TrendingUp className={`h-4 w-4 ${coord.conversion_rate > 10 ? 'text-success' : 'text-muted-foreground'}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {ranking.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhum coordenador encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default CoordinatorRanking;
