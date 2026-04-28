
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Megaphone, Clock } from 'lucide-react';
import { NAV, BLUE, RED, CREAM, BrandCard, BrandCardHeader } from '@/lib/brand';

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnnouncements(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Avisos — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Avisos</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Comunicados e informações importantes</p>
      </div>

      {announcements.length === 0 ? (
        <div
          className="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${NAV}12`, background: '#fff' }}
        >
          <div className="text-center">
            <Megaphone className="h-14 w-14 mx-auto mb-4" style={{ color: `${NAV}25` }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Nenhum aviso no momento</h3>
            <p className="text-sm" style={{ color: `${NAV}75` }}>Fique atento aos comunicados da editora aqui.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <BrandCard key={a.id}>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                      style={{ background: `${RED}12` }}
                    >
                      <Megaphone className="h-4 w-4" style={{ color: RED }} />
                    </span>
                    <h3 className="font-bold text-base leading-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                      {a.title}
                    </h3>
                  </div>
                  {a.created_at && (
                    <span className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: `${NAV}75` }}>
                      <Clock className="h-3 w-3" />
                      {fmtDate(a.created_at)}
                    </span>
                  )}
                </div>
                {a.content && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap pl-12" style={{ color: `${NAV}80` }}>
                    {a.content}
                  </p>
                )}
              </div>
            </BrandCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
