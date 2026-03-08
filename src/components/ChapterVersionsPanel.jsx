
import React, { useState } from 'react';
import { History, X, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export const ChapterVersionsPanel = ({ versions, onRestore, isOpen, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);

  if (!isOpen) return null;

  const sortedVersions = [...(versions || [])].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

  const handleRestore = () => {
    if (selectedVersion) {
      onRestore(selectedVersion.content);
      setSelectedVersion(null);
    }
  };

  const getBadgeColor = (type) => {
    if (type === 'Auto-save') return 'bg-gray-100 text-gray-600';
    if (type === 'Manual Save') return 'bg-blue-100 text-blue-700';
    if (type === 'Submitted' || type === 'ENVIADO_PARA_REVISAO') return 'bg-yellow-100 text-yellow-700';
    if (type === 'Approved' || type === 'APROVADO') return 'bg-green-100 text-green-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-border shadow-2xl z-40 flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            Histórico de Versões
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sortedVersions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Nenhuma versão salva ainda.</p>
          ) : (
            sortedVersions.map((v, i) => (
              <div key={v.id} className="border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getBadgeColor(v.type)}`}>
                    {v.type}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(v.created_at || v.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700 mb-2">
                  <p className="text-xs text-gray-500 mb-1">{new Date(v.created_at || v.date).toLocaleDateString('pt-BR')}</p>
                  <p className="flex items-center gap-1 text-xs font-medium text-gray-600">
                    <FileText className="w-3 h-3"/> {v.word_count || 0} palavras
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => setSelectedVersion(v)}
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Restaurar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Versão</DialogTitle>
            <DialogDescription>
              Você está prestes a restaurar a versão de {selectedVersion && new Date(selectedVersion.created_at || selectedVersion.date).toLocaleString('pt-BR')}.
              O conteúdo atual será sobrescrito. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVersion(null)}>Cancelar</Button>
            <Button onClick={handleRestore} className="bg-blue-600 hover:bg-blue-700 text-white">Restaurar Agora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
