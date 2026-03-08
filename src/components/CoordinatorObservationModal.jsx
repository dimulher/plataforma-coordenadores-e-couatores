
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MessageSquarePlus } from 'lucide-react';

export const CoordinatorObservationModal = ({ isOpen, onClose, onSave, coauthorName }) => {
  const [observation, setObservation] = useState('');
  const { toast } = useToast();
  const maxLength = 500;

  const handleSave = () => {
    if (!observation.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'A observação não pode estar vazia.',
        variant: 'destructive'
      });
      return;
    }
    
    if (observation.length > maxLength) {
       toast({
        title: 'Tamanho excedido',
        description: `A observação não pode passar de ${maxLength} caracteres.`,
        variant: 'destructive'
      });
      return;
    }

    onSave(observation);
    toast({
      title: 'Sucesso',
      description: 'Observação interna registrada com sucesso.'
    });
    setObservation('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-indigo-500" />
            Adicionar Observação Interna
          </DialogTitle>
          <DialogDescription>
            Registro interno para o coautor: <strong className="text-slate-800">{coauthorName}</strong>. 
            Esta nota será visível apenas para a equipe de coordenação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="observation" className="text-slate-700">Observação</Label>
              <span className={`text-xs ${observation.length > maxLength ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {observation.length} / {maxLength}
              </span>
            </div>
            <Textarea 
              id="observation" 
              placeholder="Digite sua observação sobre a produção ou atendimento deste coautor..." 
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="min-h-[120px] resize-none border-slate-300 text-slate-800"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Salvar Observação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
