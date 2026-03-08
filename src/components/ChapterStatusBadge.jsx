
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Edit3, Send, Eye, AlertCircle, CheckCircle, Award } from 'lucide-react';

const STATUS_CONFIG = {
  RASCUNHO: { label: 'Rascunho', color: 'bg-gray-200 text-gray-800 border-gray-300', icon: Edit3 },
  EM_EDICAO: { label: 'Em Edição', color: 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30', icon: Edit3 },
  ENVIADO_PARA_REVISAO: { label: 'Enviado p/ Revisão', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Send },
  EM_REVISAO: { label: 'Em Revisão', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: Eye },
  AJUSTES_SOLICITADOS: { label: 'Ajustes Solicitados', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  APROVADO: { label: 'Aprovado', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  FINALIZADO: { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-900 border-emerald-400', icon: Award }
};

export const ChapterStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.RASCUNHO;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border px-2 py-1 shadow-none flex items-center gap-1.5`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="font-semibold text-xs uppercase tracking-wider">{config.label}</span>
    </Badge>
  );
};
