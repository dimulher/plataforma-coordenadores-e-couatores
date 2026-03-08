
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';

export const SaveIndicator = ({ state }) => {
  return (
    <div className="flex items-center justify-end min-w-[100px] text-sm text-[#6B7280]">
      <AnimatePresence mode="wait">
        {state === 'SAVING' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 text-[#F59E0B] font-medium"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando…
          </motion.div>
        )}
        {state === 'SUCCESS' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 text-[#10B981] font-medium"
          >
            <Check className="w-4 h-4" />
            Salvo
          </motion.div>
        )}
        {state === 'ERROR' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 text-[#EF4444] font-medium"
          >
            <AlertCircle className="w-4 h-4" />
            Erro
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
