
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { GraduationCap, PlayCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { NAV, BLUE } from '@/lib/brand';

const PRIMARY = NAV;
const PRIMARY_LIGHT = '#002a52';
const ACCENT = BLUE;

const extractYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const CoursePage = () => {
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [watched, setWatched] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('course_videos')
          .select('*')
          .order('order', { ascending: true });
        if (error) throw error;
        const list = data || [];
        setVideos(list);
        if (list.length > 0) setSelected(list[0]);
      } catch (err) {
        console.error('CoursePage fetch error:', err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const markWatched = (id) => setWatched((prev) => ({ ...prev, [id]: true }));
  const videoId = selected ? extractYouTubeId(selected.youtube_url) : null;
  const nextVideos = videos.filter((v) => v.id !== selected?.id);
  const watchedCount = Object.keys(watched).length;
  const progress = videos.length > 0 ? Math.round((watchedCount / videos.length) * 100) : 0;
  const selectedIndex = videos.findIndex((v) => v.id === selected?.id);
  const nextUp = videos[selectedIndex + 1] ?? null;

  return (
    <>
      <Helmet>
        <title>Aulas - NAB Platform</title>
        <meta name="description" content="Assista as aulas do curso" />
      </Helmet>

      <div className="space-y-5 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Aulas do Curso</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Assista às aulas e materiais de aprendizado</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-card rounded-xl border-2 border-dashed border-border">
            <div className="text-center">
              <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma aula disponível</h3>
              <p className="text-muted-foreground">As aulas serão publicadas em breve.</p>
            </div>
          </div>
        ) : (
          /* Main container - dark card */
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: PRIMARY }}
          >
            {/* Top: current video title bar */}
            <div className="px-6 pt-5 pb-3">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">
                Módulo 1 — Início
              </p>
              <h2 className="text-white text-xl font-bold">
                {selected?.title ?? 'Selecione uma aula'}
              </h2>
              {nextUp && (
                <p className="text-white/40 text-sm mt-0.5">
                  Próxima aula:{' '}
                  <span className="text-white/70 font-medium">{nextUp.title}</span>
                </p>
              )}
            </div>

            {/* Body: player + sidebar */}
            <div className="flex gap-0">
              {/* Player */}
              <div className="flex-1 relative" style={{ minWidth: 0 }}>
                {selected && videoId ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      key={videoId}
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                      title={selected.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => markWatched(selected.id)}
                    />
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{ paddingBottom: '56.25%', position: 'relative' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
                      Link de vídeo inválido.
                    </div>
                  </div>
                )}

                {/* Progress bar below player */}
                <div className="px-6 py-3 flex items-center gap-4">
                  <div
                    className="flex-1 rounded-full h-1"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: ACCENT }}
                    />
                  </div>
                  <span className="text-white/50 text-xs shrink-0">
                    {watchedCount}/{videos.length} concluídas
                  </span>
                  <button
                    onClick={() => selected && markWatched(selected.id)}
                    className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: watched[selected?.id]
                        ? 'rgba(34,197,94,0.15)'
                        : ACCENT,
                      color: watched[selected?.id] ? '#4ade80' : '#fff',
                    }}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {watched[selected?.id] ? 'Concluída' : 'Marcar concluída'}
                  </button>
                </div>
              </div>

              {/* Right sidebar */}
              <div
                className="w-72 flex-shrink-0 flex flex-col overflow-y-auto"
                style={{
                  backgroundColor: PRIMARY_LIGHT,
                  maxHeight: 'calc(56.25vw * 0.45 + 120px)',
                }}
              >
                <div
                  className="px-4 py-3 text-xs font-bold uppercase tracking-widest border-b"
                  style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  Próximas Aulas
                </div>

                <div className="flex-1 overflow-y-auto">
                  {videos.map((video, index) => {
                    const isActive = selected?.id === video.id;
                    const yId = extractYouTubeId(video.youtube_url);
                    const thumb = yId
                      ? `https://img.youtube.com/vi/${yId}/mqdefault.jpg`
                      : null;
                    const isWatched = watched[video.id];

                    return (
                      <button
                        key={video.id}
                        onClick={() => setSelected(video)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 transition-all"
                        style={{
                          backgroundColor: isActive
                            ? 'rgba(26,111,196,0.25)'
                            : 'transparent',
                          borderLeft: isActive
                            ? `3px solid ${ACCENT}`
                            : '3px solid transparent',
                        }}
                      >
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-black/30">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PlayCircle className="h-5 w-5 text-white/30" />
                            </div>
                          )}
                          {/* Overlay */}
                          {isActive && (
                            <div className="absolute inset-0 bg-blue-900/50 flex items-center justify-center">
                              <PlayCircle className="h-5 w-5 text-white" />
                            </div>
                          )}
                          {isWatched && !isActive && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' }}
                          >
                            {video.title}
                          </p>
                          {video.duration && (
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {video.duration}
                            </p>
                          )}
                        </div>

                        {isActive && (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: ACCENT }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CoursePage;
