
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { HeartHandshake as Handshake, Calendar, ExternalLink, Clock } from 'lucide-react';
import { NAV, BLUE, RED, CREAM, BrandCard, BrandCardHeader, BtnOutline } from '@/lib/brand';

const MentorshipPage = () => {
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('mentorships')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data }) => {
        setMentorships(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = mentorships.filter(m => m.date && new Date(m.date) >= now);
  const past     = mentorships.filter(m => m.date && new Date(m.date) < now);

  const formatDate = (d) => {
    if (!d) return 'Data não definida';
    return new Date(d).toLocaleString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const MentorCard = ({ m, isPast }) => (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 bg-white transition-shadow hover:shadow-md"
      style={{
        border: `1px solid ${isPast ? `${NAV}0F` : `${BLUE}30`}`,
        opacity: isPast ? 0.75 : 1,
        boxShadow: `0 1px 4px ${NAV}08`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-base leading-tight" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
          {m.title || 'Mentoria'}
        </h3>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wider"
          style={isPast
            ? { background: `${NAV}0C`, color: `${NAV}60` }
            : { background: `${BLUE}15`, color: BLUE }}
        >
          {isPast ? 'Realizada' : 'Próxima'}
        </span>
      </div>

      {m.description && (
        <p className="text-sm leading-relaxed" style={{ color: `${NAV}70` }}>{m.description}</p>
      )}

      <div className="flex items-center gap-2 text-sm" style={{ color: `${NAV}70` }}>
        <Calendar className="h-4 w-4 shrink-0" style={{ color: BLUE }} />
        <span className="capitalize">{formatDate(m.date)}</span>
      </div>

      {m.link && (
        <BtnOutline
          onClick={() => window.open(m.link, '_blank')}
          icon={ExternalLink}
          label={isPast ? 'Ver Gravação' : 'Acessar Link'}
          color={isPast ? NAV : BLUE}
          className="w-full justify-center mt-1"
        />
      )}
    </div>
  );

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-b-2 animate-spin" style={{ borderColor: `transparent transparent ${BLUE} transparent` }} />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <Helmet><title>Mentoria — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Mentoria</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>Sessões de orientação e acompanhamento</p>
      </div>

      {mentorships.length === 0 ? (
        <div
          className="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${NAV}12`, background: '#fff' }}
        >
          <div className="text-center">
            <Handshake className="h-14 w-14 mx-auto mb-4" style={{ color: `${NAV}25` }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Nenhuma mentoria agendada</h3>
            <p className="text-sm" style={{ color: `${NAV}50` }}>As sessões serão divulgadas aqui com os links de acesso.</p>
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: BLUE }} />
                <h2 className="text-base font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Próximas Sessões</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${BLUE}15`, color: BLUE }}
                >
                  {upcoming.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(m => <MentorCard key={m.id} m={m} isPast={false} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-base font-bold" style={{ color: `${NAV}60`, fontFamily: 'Poppins, sans-serif' }}>Sessões Anteriores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map(m => <MentorCard key={m.id} m={m} isPast={true} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default MentorshipPage;
