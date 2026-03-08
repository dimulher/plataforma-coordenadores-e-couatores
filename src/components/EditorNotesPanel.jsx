
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EditorNotesPanel = ({ isOpen, onClose, notes = [], onMarkResolved }) => {
  const [localNotes, setLocalNotes] = useState([]);

  useEffect(() => {
    // Map incoming notes: convert 'Pendente' or missing status to 'Aberta'
    setLocalNotes(notes.map(n => ({ 
      ...n, 
      status: (n.status === 'Resolvida') ? 'Resolvida' : 'Aberta' 
    })));
  }, [notes]);

  const handleResolve = (index) => {
    const updated = [...localNotes];
    updated[index].status = 'Resolvida';
    setLocalNotes(updated);
    if (onMarkResolved) onMarkResolved(index);
  };

  const getTagStyles = (tag) => {
    const t = tag?.toLowerCase() || '';
    if (t.includes('correção') || t.includes('erro')) return 'bg-[#EF4444] text-white';
    if (t.includes('sugestão')) return 'bg-[#3B82F6] text-white';
    return 'bg-[#FF6B35] text-white'; // Ajuste default
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 w-full sm:w-[350px] bg-white border-l-[3px] border-[#3B82F6] shadow-[-2px_0_8px_rgba(0,0,0,0.15)] z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#3B82F6]" />
                Notas do Editor
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:bg-gray-100 rounded-full h-8 w-8">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/50">
              {localNotes.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Tudo certo por aqui! Nenhuma nota registrada no momento.</p>
                </div>
              ) : (
                localNotes.map((note, idx) => {
                  const isAberta = note.status === 'Aberta';
                  return (
                    <div 
                      key={idx} 
                      className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${
                        isAberta 
                          ? 'border-[#F59E0B] bg-yellow-50/30 ring-1 ring-[#F59E0B]/20' 
                          : 'border-[#10B981] opacity-75'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getTagStyles(note.tag || 'Ajuste')}`}>
                            {note.tag || 'Ajuste'}
                          </span>
                          <span className="text-xs font-semibold text-gray-600">{note.author || 'Admin'}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isAberta ? 'bg-red-100 text-[#EF4444]' : 'bg-green-100 text-[#10B981]'
                        }`}>
                          {isAberta ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {note.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {note.text}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {note.date ? new Date(note.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' }) : 'Data não informada'}
                        </span>
                        
                        {isAberta && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleResolve(idx)}
                            className="h-7 text-xs font-semibold text-[#10B981] hover:bg-green-50 hover:text-green-700 px-2"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Marcar como Resolvida
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
