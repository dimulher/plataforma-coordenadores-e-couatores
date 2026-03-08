
import React from 'react';
import { isPreviewEnvironment } from '@/utils/environment';

// This component is only rendered in preview/dev environments for testing purposes
const QuickLoginButtons = ({ onQuickLogin }) => {
  // Double protection (belt and suspenders approach) to ensure 
  // demo credentials are never exposed in production
  if (!isPreviewEnvironment()) return null;

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Preview Mode</span>
        <h3 className="text-sm font-semibold text-slate-700">Acesso Rápido</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">Selecione um perfil para entrar automaticamente na demonstração:</p>
      
      <div className="flex flex-col gap-2">
        <button 
          className="flex items-center w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
          onClick={() => onQuickLogin('admin@nab.com', 'admin123')}
          type="button"
        >
          <span className="mr-2">👑</span> 
          <span className="font-semibold mr-1">Admin</span> 
          <span className="text-xs font-normal text-slate-400 ml-auto">(admin@nab.com)</span>
        </button>
        
        <button 
          className="flex items-center w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
          onClick={() => onQuickLogin('coordenador@nab.com', 'coord123')}
          type="button"
        >
          <span className="mr-2">🎯</span> 
          <span className="font-semibold mr-1">Coordenador</span> 
          <span className="text-xs font-normal text-slate-400 ml-auto">(coordenador@nab.com)</span>
        </button>
        
        <button 
          className="flex items-center w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors"
          onClick={() => onQuickLogin('coautor@nab.com', 'coautor123')}
          type="button"
        >
          <span className="mr-2">✍️</span> 
          <span className="font-semibold mr-1">Coautor</span> 
          <span className="text-xs font-normal text-slate-400 ml-auto">(coautor@nab.com)</span>
        </button>
      </div>
    </div>
  );
};

export default QuickLoginButtons;
