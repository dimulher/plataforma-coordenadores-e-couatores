
import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

const AlertsIndicator = () => {
  const [alerts, setAlerts] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (user.role === 'COORDENADOR' || user.role === 'ADMIN')) {
      checkAlerts();
    }
  }, [user]);

  const checkAlerts = () => {
    const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
    if (!data.leads) return;

    let userLeads = data.leads.filter(l => l.tenant_id === user.tenant_id);
    if (user.role === 'COORDENADOR') {
      userLeads = userLeads.filter(l => l.coordinator_id === user.id);
    }

    const currentDate = new Date('2026-03-01T12:00:00Z');
    const newAlerts = [];

    userLeads.forEach(lead => {
      if (lead.status === 'FECHADO' || lead.status === 'PERDIDO') return;

      const updatedDate = new Date(lead.updated_at || lead.created_at);
      const diffTime = Math.abs(currentDate - updatedDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 3) {
        newAlerts.push({
          id: `alert-${lead.id}-stale`,
          type: 'warning',
          title: 'Lead Parado',
          message: `${lead.name} está há ${diffDays} dias sem atualização.`,
          leadId: lead.id,
          action: 'Atualizar agora'
        });
      }
    });

    setAlerts(newAlerts.sort((a, b) => (a.type === 'destructive' ? -1 : 1)));
  };

  if (!user || (user.role !== 'COORDENADOR' && user.role !== 'ADMIN')) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-[10px] font-bold text-white flex items-center justify-center rounded-full">
              {alerts.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhum alerta no momento.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {alerts.map(alert => (
              <DropdownMenuItem 
                key={alert.id} 
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                onClick={() => navigate('/coordinator/leads')}
              >
                <div className="flex items-center gap-2 w-full">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="font-semibold text-sm">{alert.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{alert.message}</span>
                <span className="text-[10px] font-medium text-primary mt-1 hover:underline">{alert.action} &rarr;</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AlertsIndicator;
