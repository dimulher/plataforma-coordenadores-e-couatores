
import React from 'react';
import { Calendar, Folder } from 'lucide-react';

const HeroSection = ({ activeProject = "—", weekRange = "—" }) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel do Coordenador</h1>
        <p className="text-gray-600">Visão geral da sua captação, coautores e produção.</p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-[#F3F4F6] text-gray-700 px-[12px] py-[6px] rounded-[16px] text-[12px] font-medium">
          <Folder className="w-3.5 h-3.5" />
          <span>Projeto Ativo: {activeProject}</span>
        </div>
        <div className="flex items-center gap-2 bg-[#F3F4F6] text-gray-700 px-[12px] py-[6px] rounded-[16px] text-[12px] font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>Semana: {weekRange}</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
