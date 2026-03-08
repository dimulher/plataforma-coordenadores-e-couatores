
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Wallet } from 'lucide-react';

const CoordinatorCommissions = () => {
  const { getCoordinatorPayments } = useCoordinatorData();
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      const data = await getCoordinatorPayments();
      setPayments(data || []);
    };
    load();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const filteredPayments = payments.filter(p =>
    statusFilter === 'ALL' ? true : p.commission_status === statusFilter
  );

  const totalContratado = filteredPayments.reduce((acc, p) => acc + (p.contract_amount || 0), 0);
  const totalComissao = filteredPayments.reduce((acc, p) => acc + (p.commission_amount || 0), 0);
  const totalPendente = filteredPayments
    .filter(p => p.commission_status === 'pendente')
    .reduce((acc, p) => acc + (p.commission_amount || 0), 0);

  return (
    <>
      <Helmet>
        <title>Minhas Comissões - NAB Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Comissões</h1>
          <p className="text-muted-foreground mt-1">Histórico de vendas e repasses de comissão</p>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-xl border border-border/30 flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Contratado</p>
              <h4 className="text-2xl font-bold text-foreground">{formatCurrency(totalContratado)}</h4>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border/30 flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Wallet className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Comissão</p>
              <h4 className="text-2xl font-bold text-success">{formatCurrency(totalComissao)}</h4>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border/30 flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">A Receber</p>
              <h4 className="text-2xl font-bold text-destructive">{formatCurrency(totalPendente)}</h4>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg shadow-sm border border-border/30">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-background text-foreground border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border/30 overflow-hidden">
          <Table>
            <TableHeader className="bg-background/50">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-foreground">Lead (Cliente)</TableHead>
                <TableHead className="text-foreground">Projeto</TableHead>
                <TableHead className="text-foreground">Valor Contrato</TableHead>
                <TableHead className="text-foreground">% Com.</TableHead>
                <TableHead className="text-foreground">Valor Com.</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhuma comissão encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="border-border/30 border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium text-foreground">{payment.lead_name}</TableCell>
                    <TableCell className="text-foreground">{payment.project_name}</TableCell>
                    <TableCell className="text-foreground">{formatCurrency(payment.contract_amount)}</TableCell>
                    <TableCell className="text-foreground">{payment.commission_value}%</TableCell>
                    <TableCell className="font-semibold text-foreground">{formatCurrency(payment.commission_amount)}</TableCell>
                    <TableCell>
                      <Badge className={
                        payment.commission_status === 'pago'
                          ? 'bg-success/20 text-success hover:bg-success/30'
                          : 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                      }>
                        {payment.commission_status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default CoordinatorCommissions;
