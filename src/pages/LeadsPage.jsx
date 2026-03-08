
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const LEAD_STATUSES = ['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA', 'FECHADO', 'PERDIDO'];

const LeadsPage = () => {
  const { user, getTenantId, isCoordinator } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
    status: 'NOVO'
  });

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, statusFilter, searchQuery]);

  const loadLeads = () => {
    try {
      const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
      let userLeads = (data.leads || []).filter(lead => lead.tenant_id === getTenantId());
      if (isCoordinator()) {
        userLeads = userLeads.filter(lead => lead.coordinator_id === user?.id);
      }
      setLeads(userLeads);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.phone.includes(query)
      );
    }
    setFilteredLeads(filtered);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
      if (selectedLead) {
        const index = data.leads.findIndex(l => l.id === selectedLead.id);
        data.leads[index] = { ...data.leads[index], ...formData };
      } else {
        const newLead = {
          id: `lead-${Date.now()}`,
          ...formData,
          coordinator_id: user?.id,
          tenant_id: getTenantId(),
          created_at: new Date().toISOString()
        };
        data.leads.push(newLead);
      }
      localStorage.setItem('nab_data', JSON.stringify(data));
      loadLeads();
      setIsModalOpen(false);
      toast({ title: 'Sucesso', description: 'Lead salvo com sucesso' });
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar lead', variant: 'destructive' });
    }
  };

  const openModal = (lead = null) => {
    if (lead) {
      setSelectedLead(lead);
      setFormData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        notes: lead.notes,
        status: lead.status
      });
    } else {
      setSelectedLead(null);
      setFormData({ name: '', email: '', phone: '', source: '', notes: '', status: 'NOVO' });
    }
    setIsModalOpen(true);
  };

  if (loading) return null;

  return (
    <>
      <Helmet><title>Leads - NAB Platform</title></Helmet>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <Button onClick={() => openModal()}><Plus className="h-4 w-4 mr-2" />Novo Lead</Button>
        </div>
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground">Nome</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium text-foreground">{lead.name}</TableCell>
                  <TableCell className="text-foreground">{lead.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModal(lead)}><Edit className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nome</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="text-foreground" /></div>
            <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="text-foreground" /></div>
            <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadsPage;
