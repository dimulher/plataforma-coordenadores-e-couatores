
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import HeroSection from '@/components/HeroSection';
import KPICards from '@/components/KPICards';
import PerformanceCards from '@/components/PerformanceCards';
import CoauthorsTable from '@/components/CoauthorsTable';
import CobrancaModal from '@/components/CobrancaModal';

const CoordinatorDashboardPage = () => {
  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoauthor, setSelectedCoauthor] = useState('');

  // Mock Data definitions
  const mockData = {
    activeProject: "Mulheres que Inspiram",
    weekRange: "23/02 - 01/03",
    kpis: {
      leadsIndicados: 24,
      coautoresAtivos: 12,
      capitulosAndamento: 8,
      enviadosRevisao: 3,
      capitulosAtrasados: 2
    },
    progressoMedio: 68,
    proximasEntregas: [
      { coautor: "Ana Silva", capitulo: "A jornada feminina", data: "05/03" },
      { coautor: "Carlos Mendes", capitulo: "Liderança com empatia", data: "06/03" }
    ],
    pendenciasCriticas: [
      "Capítulos atrasados: 2",
      "Revisão pendente: 3"
    ],
    coauthorsList: [
      { id: 1, coautor: "Ana Silva", projeto: "Mulheres que Inspiram", capitulo: "A jornada feminina", status: "Atrasado", progresso: 45, ultimaAtualizacao: "28/02", prazo: "01/03" },
      { id: 2, coautor: "Carlos Mendes", projeto: "Liderança 360", capitulo: "Liderança com empatia", status: "Revisão", progresso: 100, ultimaAtualizacao: "01/03", prazo: "10/03" },
      { id: 3, coautor: "Mariana Costa", projeto: "Mulheres que Inspiram", capitulo: "Empreendedorismo na prática", status: "Em edição", progresso: 60, ultimaAtualizacao: "01/03", prazo: "15/03" },
      { id: 4, coautor: "Roberto Alves", projeto: "Gestão do Futuro", capitulo: "Inovação contínua", status: "Em rascunho", progresso: 15, ultimaAtualizacao: "25/02", prazo: "20/03" },
      { id: 5, coautor: "Juliana Santos", projeto: "Mulheres que Inspiram", capitulo: "Maternidade e carreira", status: "Aprovado", progresso: 100, ultimaAtualizacao: "20/02", prazo: "25/02" }
    ]
  };

  const handleCobrar = (coauthorName) => {
    setSelectedCoauthor(coauthorName);
    setIsModalOpen(true);
  };

  // Calculate average progress from active chapters (filtering out 'Aprovado' to represent truly active ones, or using all if needed)
  const activeChapters = mockData.coauthorsList.filter(c => c.status !== 'Aprovado');
  const calculatedAvgProgress = activeChapters.length > 0 
    ? Math.round(activeChapters.reduce((acc, curr) => acc + curr.progresso, 0) / activeChapters.length)
    : 0;

  return (
    <>
      <Helmet>
        <title>Painel do Coordenador - NAB</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
        <HeroSection 
          activeProject={mockData.activeProject} 
          weekRange={mockData.weekRange} 
        />
        
        <KPICards 
          leadsIndicados={mockData.kpis.leadsIndicados}
          coautoresAtivos={mockData.kpis.coautoresAtivos}
          capitulosAndamento={mockData.kpis.capitulosAndamento}
          enviadosRevisao={mockData.kpis.enviadosRevisao}
          capitulosAtrasados={mockData.kpis.capitulosAtrasados}
        />
        
        <PerformanceCards 
          progressoMedio={mockData.progressoMedio}
          proximasEntregas={mockData.proximasEntregas}
          pendenciasCriticas={mockData.pendenciasCriticas}
        />
        
        {/* Nova Seção: Visão de Produção da Equipe */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Visão de Produção da Equipe</h2>
          <div className="bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-[24px] rounded-[8px] w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Progresso Médio da Equipe</h3>
            
            {activeChapters.length > 0 ? (
              <div>
                <div className="text-[48px] md:text-[56px] font-bold text-[#1F2937] leading-none mb-4">
                  {calculatedAvgProgress}%
                </div>
                <div className="w-full h-[8px] bg-[#E5E7EB] rounded-[4px] overflow-hidden mb-3">
                  <div 
                    className="h-full bg-[#3B82F6] rounded-[4px] transition-all duration-500" 
                    style={{ width: `${calculatedAvgProgress}%` }}
                  ></div>
                </div>
                <p className="text-[13px] text-[#6B7280]">Média de progresso dos capítulos ativos</p>
              </div>
            ) : (
              <p className="text-[14px] text-[#6B7280]">Nenhum capítulo ativo no momento.</p>
            )}
          </div>
        </div>
        
        <CoauthorsTable 
          coauthors={mockData.coauthorsList} 
          onCobrar={handleCobrar}
        />
        
        <CobrancaModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          coauthorName={selectedCoauthor}
        />
      </div>
    </>
  );
};

export default CoordinatorDashboardPage;
