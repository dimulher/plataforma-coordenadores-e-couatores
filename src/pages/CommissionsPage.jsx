
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, WalletCards, CheckCircle2 } from 'lucide-react';

const CommissionsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [leadsMap, setLeadsMap] = useState({});

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
    if (data.payments) {
      let userPayments = data.payments.filter(p => p.tenant_id === user.tenant_id);
      if (user.role === 'COORDENADOR') {
        userPayments = userPayments.filter(p => p.coordinator_id === user.id);
      }
      // Sort by date desc
      userPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPayments(userPayments);
    }
    if (data.leads) {
      const map = {};
      data.leads.forEach(l => map[l.id] = l.name);
      setLeadsMap(map);
    }
  }, [user]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const totalPending = payments.filter(p => p.commission_status === 'pendente').reduce((a, b) => a + b.commission_amount, 0);
  const totalPaid = payments.filter(p => p.commission_status === 'pago').reduce((a, b) => a + b.commission_amount, 0);
  const totalGeneral = totalPending + totalPaid;

  const handleRequestPayment = (id) => {
    toast({
      title: "Solicitação Enviada",
      description: "O financeiro foi notificado sobre esta comissão.",
      className: "bg-success text-white border-none"
    });
  };

  return (
    <>
      <Helmet><title>Comissões - NAB</title></Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Comissões</h1>
          <p className="text-muted-foreground mt-1">Acompanhe seus ganhos por fechamento de projetos.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-warning/10 border-warning/20 shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-warning/20 rounded-full text-warning"><WalletCards className="h-6 w-6"/></div>
              <div>
                <p className="text-sm font-medium text-warning-foreground/80">Pendente a Receber</p>
                <h3 className="text-2xl font-bold text-warning-foreground">{formatCurrency(totalPending)}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/10 border-success/20 shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-success/20 rounded-full text-success"><CheckCircle2 className="h-6 w-6"/></div>
              <div>
                <p className="text-sm font-medium text-success-foreground/80">Total Recebido</p>
                <h3 className="text-2xl font-bold text-success-foreground">{formatCurrency(totalPaid)}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/20 shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full text-primary"><DollarSign className="h-6 w-6"/></div>
              <div>
                <p className="text-sm font-medium text-primary-foreground/80">Valor Total Gerado</p>
                <h3 className="text-2xl font-bold text-primary-foreground">{formatCurrency(totalGeneral)}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl shadow-md overflow-hidden border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data Fechamento</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Valor Contrato</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhuma comissão registrada.</TableCell></TableRow>
              ) : (
                payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{leadsMap[p.lead_id] || 'Lead Desconhecido'}</TableCell>
                    <TableCell>{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(p.commission_amount)} <span className="text-xs font-normal text-muted-foreground ml-1">(15%)</span>
                    </TableCell>
                    <TableCell>
                      {p.commission_status === 'pago' ? (
                        <Badge className="bg-success/20 text-success hover:bg-success/30 border-none">Pago em {new Date(p.payment_date).toLocaleDateString('pt-BR')}</Badge>
                      ) : (
                        <Badge className="bg-warning/20 text-warning-foreground hover:bg-warning/30 border-none">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.commission_status === 'pendente' && (
                        <Button size="sm" variant="outline" onClick={() => handleRequestPayment(p.id)}>
                          Solicitar Saque
                        </Button>
                      )}
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

export default CommissionsPage;
