
import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Edit3 } from 'lucide-react';

export const ChapterStatusBanner = ({ status }) => {
  switch (status) {
    case 'RASCUNHO':
    case 'EM_EDICAO':
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 flex items-center gap-3 rounded-r-lg mb-6 shadow-sm">
          <Edit3 className="h-5 w-5 text-blue-500" />
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Em edição</h4>
            <p className="text-blue-700 text-xs">Você está com a palavra! Salve frequentemente seu progresso.</p>
          </div>
        </div>
      );
    case 'ENVIADO_PARA_REVISAO':
    case 'EM_REVISAO':
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 flex items-center gap-3 rounded-r-lg mb-6 shadow-sm">
          <Clock className="h-5 w-5 text-yellow-500" />
          <div>
            <h4 className="font-bold text-yellow-900 text-sm">Em revisão</h4>
            <p className="text-yellow-700 text-xs">Seu capítulo foi enviado e está sendo avaliado pela equipe editorial.</p>
          </div>
        </div>
      );
    case 'AJUSTES_SOLICITADOS':
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 rounded-r-lg mb-6 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <h4 className="font-bold text-red-900 text-sm">Ajustes solicitados</h4>
            <p className="text-red-700 text-xs">A equipe editorial solicitou ajustes no seu texto. Verifique as observações.</p>
          </div>
        </div>
      );
    case 'APROVADO':
    case 'FINALIZADO':
      return (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 flex items-center gap-3 rounded-r-lg mb-6 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <h4 className="font-bold text-green-900 text-sm">Aprovado</h4>
            <p className="text-green-700 text-xs">Parabéns! Seu capítulo foi aprovado e está pronto para a próxima etapa.</p>
          </div>
        </div>
      );
    default:
      return null;
  }
};
