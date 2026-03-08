
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeartHandshake as Handshake, Calendar, ExternalLink, Clock } from 'lucide-react';

const MentorshipPage = () => {
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentorships = async () => {
      try {
        const { data, error } = await supabase
          .from('mentorships')
          .select('*')
          .order('date', { ascending: true });

        if (error) throw error;
        setMentorships(data || []);
      } catch (err) {
        console.error('MentorshipPage fetch error:', err);
        setMentorships([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMentorships();
  }, []);

  const now = new Date();

  const upcoming = mentorships.filter(m => m.date && new Date(m.date) >= now);
  const past = mentorships.filter(m => m.date && new Date(m.date) < now);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Data não definida';
    return new Date(dateStr).toLocaleString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const MentorshipCard = ({ mentorship, isPast }) => (
    <Card className={`border shadow-sm transition-all hover:shadow-md ${isPast ? 'opacity-70' : 'border-indigo-200'}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className={`font-bold text-lg leading-tight ${isPast ? 'text-slate-600' : 'text-slate-800'}`}>
            {mentorship.title || 'Mentoria'}
          </h3>
          <Badge className={isPast
            ? 'bg-slate-100 text-slate-500 border-none shrink-0'
            : 'bg-indigo-100 text-indigo-700 border-none shrink-0'
          }>
            {isPast ? 'Realizada' : 'Próxima'}
          </Badge>
        </div>

        {mentorship.description && (
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">{mentorship.description}</p>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <Calendar className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="capitalize">{formatDate(mentorship.date)}</span>
        </div>

        {mentorship.link && (
          <Button
            variant={isPast ? 'outline' : 'default'}
            className={`w-full gap-2 ${!isPast ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
            onClick={() => window.open(mentorship.link, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            {isPast ? 'Ver Gravação' : 'Acessar Link'}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Mentoria - NAB Platform</title>
        <meta name="description" content="Sessões de mentoria com links de acesso" />
      </Helmet>

      <div className="space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mentoria</h1>
          <p className="text-muted-foreground mt-1">Sessões de orientação e acompanhamento</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-indigo-500 rounded-full" />
          </div>
        ) : mentorships.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-card rounded-lg border-2 border-dashed border-border">
            <div className="text-center">
              <Handshake className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma mentoria agendada</h3>
              <p className="text-muted-foreground">As sessões serão divulgadas aqui com os links de acesso.</p>
            </div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-800">Próximas Sessões</h2>
                  <Badge className="bg-indigo-100 text-indigo-700 border-none">{upcoming.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcoming.map(m => <MentorshipCard key={m.id} mentorship={m} isPast={false} />)}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-600">Sessões Anteriores</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {past.map(m => <MentorshipCard key={m.id} mentorship={m} isPast={true} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default MentorshipPage;
