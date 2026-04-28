import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Wallet } from 'lucide-react';
import { NAV, RED, BrandCard } from '@/lib/brand';

const CoordinatorCommissions = () => {
  const { getCoordinatorPayments } = useCoordinatorData();
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    getCoordinatorPayments().then(data => setPayments(data || []));
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const filtered = payments.filter(p => statusFilter === 'ALL' ? true : p.commission_status === statusFilter);

  const totalContratado = filtered.reduce((acc, p) => acc + (p.contract_amount || 0), 0);
  const totalComissao   = filtered.reduce((acc, p) => acc + (p.commission_amount || 0), 0);
  const totalPendente   = filtered.filter(p => p.commission_status === 'pendente').reduce((acc, p) => acc + (p.commission_amount || 0), 0);

  return (
    <>
      <Helmet><title>Minhas Comissões — Novos Autores do Brasil</title></Helmet>

      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Minhas Comissões</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Histórico de vendas e repasses de comissão</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Contratado', value: formatCurrency(totalContratado), icon: DollarSign, color: NAV,      bg: `${NAV}06` },
            { label: 'Total Comissão',   value: formatCurrency(totalComissao),   icon: Wallet,     color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
            { label: 'A Receber',        value: formatCurrency(totalPendente),   icon: DollarSign, color: RED,       bg: `${RED}08` },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: bg, border: `1px solid ${color}20` }}>
              <div className="p-3 rounded-xl" style={{ background: `${color}15` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: `${NAV}85` }}>{label}</p>
                <h4 className="text-xl font-bold" style={{ color }}>{value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-white text-sm" style={{ borderColor: `${NAV}20`, color: NAV }}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <BrandCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead style={{ background: `${NAV}04`, borderBottom: `1px solid ${NAV}08` }}>
                <tr>
                  {['Lead (Cliente)', 'Projeto', 'Valor Contrato', '% Com.', 'Valor Com.', 'Status', 'Data'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}75` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center" style={{ color: `${NAV}70` }}>
                      Nenhuma comissão encontrada.
                    </td>
                  </tr>
                ) : filtered.map(payment => (
                  <tr
                    key={payment.id}
                    className="transition-colors"
                    style={{ borderTop: `1px solid ${NAV}08` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${NAV}03`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-5 py-4 font-medium" style={{ color: NAV }}>{payment.lead_name}</td>
                    <td className="px-5 py-4" style={{ color: `${NAV}70` }}>{payment.project_name}</td>
                    <td className="px-5 py-4" style={{ color: NAV }}>{formatCurrency(payment.contract_amount)}</td>
                    <td className="px-5 py-4" style={{ color: NAV }}>{payment.commission_value}%</td>
                    <td className="px-5 py-4 font-semibold" style={{ color: NAV }}>{formatCurrency(payment.commission_amount)}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={
                        payment.commission_status === 'pago'
                          ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                          : { background: `${RED}12`, color: RED }
                      }>
                        {payment.commission_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: `${NAV}85` }}>
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BrandCard>
      </div>
    </>
  );
};

export default CoordinatorCommissions;
