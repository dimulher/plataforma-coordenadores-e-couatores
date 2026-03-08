
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#B23A48', '#8B5CF6', '#64748B'];

export const LeadsStatusChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-muted-foreground text-sm text-center py-10">Sem dados</div>;
  
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-muted-foreground text-sm text-center py-10">Sem dados</div>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(val) => `R$${val/1000}k`} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0E1A32', borderRadius: '8px', border: '1px solid #1E293B', color: '#F8FAFC' }}
          itemStyle={{ color: '#3B82F6' }}
          formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
        />
        <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};
