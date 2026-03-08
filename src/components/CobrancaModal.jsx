
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { X, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const CobrancaModal = ({ isOpen, onClose, coauthorName }) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && coauthorName) {
      setMessage(`Oi, ${coauthorName}! Passando pra te lembrar do seu capítulo e do prazo combinado. Se você precisar de ajuda, me diga em que parte travou que eu te oriento. Vamos avançar! 💪`);
    }
  }, [isOpen, coauthorName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
      duration: 3000,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] bg-white border border-[#E5E7EB] shadow-[0_10px_25px_rgba(0,0,0,0.1)] p-[24px] rounded-[8px] z-50"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-900">Cobrar Coautor</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Envie uma mensagem de lembrante para <strong className="text-gray-700">{coauthorName}</strong></p>
            
            <div className="mb-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button 
                onClick={handleCopy}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar mensagem
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CobrancaModal;
