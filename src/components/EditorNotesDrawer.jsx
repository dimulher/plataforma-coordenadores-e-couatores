
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare as MessageSquareText, X, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const EditorNotesDrawer = ({ isOpen, onClose, notes = [] }) => {
  const [localNotes, setLocalNotes] = useState(notes.map(n => ({ ...n, status: 'Pendente' })));

  const handleResolve = (index) => {
    const updated = [...localNotes];
    updated[index].status = 'Resolvida';
    setLocalNotes(updated);
  };

  const getTagStyle = (tag) => {
    switch(tag?.toLowerCase()) {
      case 'correção': return 'bg-red-100 text-red-700 border-red-200';
      case 'sugestão': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200'; // Ajuste
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-y-0 right-0 w-[400px] bg-white border-l-2 border-blue-500 shadow-2xl z-50 flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-blue-500" />
              Notas do Editor
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/50">
            {localNotes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <MessageSquareText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p>Nenhuma nota registrada.</p>
              </div>
            ) : (
              localNotes.map((note, idx) => (
                <div key={idx} className={`bg-white border rounded-xl shadow-sm p-4 transition-all ${note.status === 'Resolvida' ? 'border-green-200 opacity-70' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2 items-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getTagStyle(note.tag || 'Ajuste')}`}>
                        {note.tag || 'Ajuste'}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">{note.author || 'Revisor'}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${note.status === 'Resolvida' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {note.status === 'Resolvida' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {note.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-700 mb-3 leading-relaxed">{note.text}</p>
                  <p className="text-[10px] text-slate-400 mb-4">{new Date(note.date).toLocaleString('pt-BR')}</p>
                  
                  {note.status !== 'Resolvida' && (
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <Input placeholder="Sua resposta (opcional)..." className="h-8 text-xs bg-slate-50" />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleResolve(idx)}
                        className="w-full h-8 text-xs flex items-center justify-center gap-1 border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Marcar como Resolvida
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
