import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useCoordinatorData } from '@/hooks/useCoordinatorData';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Target, TrendingUp } from 'lucide-react';
import { NAV, BLUE, BrandCard } from '@/lib/brand';

const CoordinatorRanking = () => {
  const { getCoordinatorRanking, loading } = useCoordinatorData();
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    getCoordinatorRanking().then(data => setRanking(data || []));
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getPositionBadge = (index) => {
    if (index === 0) return <span className="text-2xl" title="1º Lugar">🥇</span>;
    if (index === 1) return <span className="text-2xl" title="2º Lugar">🥈</span>;
    if (index === 2) return <span className="text-2xl" title="3º Lugar">🥉</span>;
    return <span className="text-lg font-bold px-2" style={{ color: `${NAV}60` }}>{index + 1}º</span>;
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  return (
    <>
      <Helmet><title>Ranking — Novos Autores do Brasil</title></Helmet>

      <div className="space-y-6 pb-12">
        {/* Header card */}
        <div className="rounded-2xl p-6 flex items-center gap-4" style={{ background: NAV }}>
          <div className="p-3 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}>
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Ranking Geral</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Classificação competitiva de coordenadores no mês atual</p>
          </div>
        </div>

        <BrandCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead style={{ background: `${NAV}04`, borderBottom: `1px solid ${NAV}08` }}>
                <tr>
                  {['Posição', 'Nome do Coordenador', 'Fechamentos', 'Receita Gerada', 'Taxa de Conversão'].map(h => (
                    <th key={h} className="px-6 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}50` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((coord, index) => {
                  const isMe = coord.id === user?.id;
                  return (
                    <tr
                      key={coord.id}
                      className="transition-colors"
                      style={{
                        borderTop: `1px solid ${NAV}08`,
                        borderLeft: isMe ? `3px solid ${BLUE}` : '3px solid transparent',
                        background: isMe ? `${BLUE}06` : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = `${NAV}03`; }}
                      onMouseLeave={e => { if (!isMe) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-6 py-4 text-center">{getPositionBadge(index)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-semibold" style={{ color: NAV }}>
                          {coord.name}
                          {isMe && (
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold" style={{ background: BLUE, color: 'white' }}>
                              Você
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-semibold" style={{ color: NAV }}>
                          <Target className="h-4 w-4" style={{ color: BLUE }} />
                          {coord.closed_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold" style={{ color: '#10B981' }}>
                        {formatCurrency(coord.revenue)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium" style={{ color: NAV }}>
                          {coord.conversion_rate}%
                          <TrendingUp className="h-4 w-4" style={{ color: coord.conversion_rate > 10 ? '#10B981' : `${NAV}40` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {ranking.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center" style={{ color: `${NAV}40` }}>
                      Nenhum coordenador encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </BrandCard>
      </div>
    </>
  );
};

export default CoordinatorRanking;
