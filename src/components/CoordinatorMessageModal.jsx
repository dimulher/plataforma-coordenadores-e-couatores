
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Mail } from 'lucide-react';

export const CoordinatorMessageModal = ({ isOpen, onClose, onSend, coauthorName }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha assunto e mensagem.',
        variant: 'destructive'
      });
      return;
    }
    
    onSend(subject, message);
    setSubject('');
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            Enviar Mensagem
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem direta para {coauthorName}. O coautor será notificado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input 
              id="subject" 
              placeholder="Ex: Dúvidas sobre o Capítulo 2" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-slate-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea 
              id="message" 
              placeholder="Escreva sua mensagem aqui..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none border-slate-300"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white">Enviar Mensagem</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
