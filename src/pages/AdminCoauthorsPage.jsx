import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Loader2, Users2, BookOpen, ImageIcon, FileText,
  ExternalLink, ChevronDown, ChevronUp, Eye, UserCircle2, Link2,
  X, Clock, Mail,
} from 'lucide-react';
import { NAV, BLUE, RED, BrandCard } from '@/lib/brand';

const STATUS_MAP = {
  RASCUNHO:             { label: 'Em Escrita', text: BLUE,      bg: `${BLUE}12` },
  EM_EDICAO:            { label: 'Em Escrita', text: BLUE,      bg: `${BLUE}12` },
  AJUSTES_SOLICITADOS:  { label: 'Ajustes',    text: '#FF6B35', bg: 'rgba(255,107,53,0.10)' },
  ENVIADO_PARA_REVISAO: { label: 'P/ Revisão', text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  EM_REVISAO:           { label: 'Revisão',    text: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  APROVADO:             { label: 'Produção',   text: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  PRODUCAO:             { label: 'Produção',   text: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  FINALIZADO:           { label: 'Concluído',  text: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  CONCLUIDO:            { label: 'Concluído',  text: '#10B981', bg: 'rgba(16,185,129,0.10)' },
};

const CoauthorFolder = ({ author, navigate, onViewProfile }) => {
  const [activeTab, setActiveTab] = useState('capitulos');
  const [expanded, setExpanded] = useState(false);
  const initials = (author.name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const tabs = [
    { key: 'capitulos',  label: 'Capítulos',  icon: BookOpen,     count: author.chapters.length },
    { key: 'identidade', label: 'Identidade', icon: UserCircle2 },
    { key: 'foto',       label: 'Foto',       icon: ImageIcon },
    { key: 'contrato',   label: 'Contrato',   icon: FileText },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white transition-shadow hover:shadow-md"
      style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
    >
      {/* Tab strip */}
      <div className="flex text-xs font-semibold" style={{ borderBottom: `1px solid ${NAV}0C`, background: `${NAV}04` }}>
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setExpanded(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 transition-colors"
            style={{
              borderRight: `1px solid ${NAV}0C`,
              background: activeTab === key && expanded ? 'white' : 'transparent',
              color: activeTab === key && expanded ? BLUE : `${NAV}85`,
            }}
            onMouseEnter={e => { if (!(activeTab === key && expanded)) e.currentTarget.style.color = NAV; }}
            onMouseLeave={e => { if (!(activeTab === key && expanded)) e.currentTarget.style.color = `${NAV}85`; }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${NAV}12`, color: `${NAV}85` }}>
                {count}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setExpanded(v => !v)}
          className="ml-auto px-3 transition-colors"
          style={{ color: `${NAV}70` }}
          onMouseEnter={e => { e.currentTarget.style.color = NAV; }}
          onMouseLeave={e => { e.currentTarget.style.color = `${NAV}70`; }}
          title={expanded ? 'Recolher' : 'Expandir'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {author.avatar_url
            ? <img src={author.avatar_url} className="h-10 w-10 rounded-full object-cover shrink-0" style={{ border: `2px solid ${BLUE}30` }} alt="" />
            : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: `${BLUE}15`, color: BLUE, border: `2px solid ${BLUE}25` }}>
                {initials}
              </div>
            )
          }
          <div>
            <p className="font-bold text-sm" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{author.name}</p>
            <p className="text-xs" style={{ color: `${NAV}75` }}>{author.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${NAV}08`, color: `${NAV}85`, border: `1px solid ${NAV}10` }}>
            {author.coordinatorName}
          </span>
          <button
            onClick={() => onViewProfile(author)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: BLUE, background: `${BLUE}0D` }}
            onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}0D`; }}
          >
            <Eye className="w-3.5 h-3.5" /> Ver perfil
          </button>
        </div>
      </div>

      {/* Expandable */}
      {expanded && (
        <div className="px-5 py-4" style={{ borderTop: `1px solid ${NAV}08`, background: `${NAV}03` }}>
          {activeTab === 'capitulos' && (
            <div className="space-y-2">
              {author.chapters.length === 0 ? (
                <p className="text-sm text-center py-3" style={{ color: `${NAV}75` }}>Nenhum capítulo atribuído.</p>
              ) : (
                author.chapters.map(chap => {
                  const cfg = STATUS_MAP[chap.status] || { label: chap.status, text: `${NAV}85`, bg: `${NAV}08` };
                  return (
                    <div key={chap.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3"
                      style={{ border: `1px solid ${NAV}0C` }}>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[260px]" style={{ color: NAV }}>{chap.title}</p>
                        <p className="text-[10px] uppercase mt-0.5 font-bold tracking-wider" style={{ color: `${NAV}70` }}>{chap.projectName || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.text, background: cfg.bg }}>{cfg.label}</span>
                        <button
                          onClick={() => navigate(`/app/admin/chapters/${chap.id}/review`)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: `${NAV}75` }}
                          onMouseEnter={e => { e.currentTarget.style.color = BLUE; e.currentTarget.style.background = `${BLUE}10`; }}
                          onMouseLeave={e => { e.currentTarget.style.color = `${NAV}75`; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'identidade' && (
            <div className="space-y-4 py-2">
              {/* Bio */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: `${NAV}72` }}>Minicurrículo</p>
                {author.bio ? (
                  <p className="text-sm leading-relaxed p-3 rounded-xl bg-white" style={{ color: NAV, border: `1px solid ${NAV}0C` }}>{author.bio}</p>
                ) : (
                  <p className="text-xs italic p-3 rounded-xl" style={{ color: `${NAV}72`, background: `${NAV}04` }}>Não preenchido.</p>
                )}
              </div>

              {/* Redes sociais */}
              <div className="flex flex-wrap gap-3">
                {author.instagram && (
                  <a href={author.instagram.startsWith('http') ? author.instagram : `https://instagram.com/${author.instagram.replace('@','')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(225,48,108,0.1)', color: '#E1306C', border: '1px solid rgba(225,48,108,0.25)' }}>
                    <Link2 className="w-3 h-3" /> {author.instagram}
                  </a>
                )}
                {author.contact_email && (
                  <a href={`mailto:${author.contact_email}`}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(63,125,176,0.1)', color: '#3F7DB0', border: '1px solid rgba(63,125,176,0.25)' }}>
                    <Link2 className="w-3 h-3" /> {author.contact_email}
                  </a>
                )}
                {!author.instagram && !author.contact_email && (
                  <p className="text-xs" style={{ color: `${NAV}72` }}>Nenhuma rede social cadastrada.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'foto' && (
            <div className="py-4">
              {author.chapter_photo_url ? (
                <div className="flex items-center gap-4 p-3 rounded-xl" style={{ border: `1px solid ${NAV}0C`, background: 'white' }}>
                  <img src={author.chapter_photo_url} alt="Foto capítulo" className="w-20 h-20 rounded-xl object-cover shrink-0" style={{ border: '2px solid rgba(139,92,246,0.2)' }} />
                  <a href={author.chapter_photo_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium" style={{ color: BLUE }}>
                    <ExternalLink className="w-3 h-3" /> Abrir imagem
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6" style={{ color: `${NAV}55` }}>
                  <ImageIcon className="w-10 h-10" />
                  <p className="text-sm" style={{ color: `${NAV}75` }}>Nenhuma foto cadastrada</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contrato' && (
            <div className="flex flex-col items-center gap-3 py-4">
              {author.contract_url ? (
                <>
                  <FileText className="w-10 h-10" style={{ color: BLUE }} />
                  <p className="text-sm font-medium" style={{ color: NAV }}>Contrato disponível</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={
                        author.contract_status === 'ASSINADO'
                          ? { background: 'rgba(16,185,129,0.10)', color: '#10B981' }
                          : { background: 'rgba(245,158,11,0.10)', color: '#F59E0B' }
                      }
                    >
                      {author.contract_status === 'ASSINADO' ? 'Assinado' : author.contract_status || 'Enviado'}
                    </span>
                    <a href={author.contract_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium" style={{ color: BLUE }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir contrato
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2" style={{ color: `${NAV}55` }}>
                  <FileText className="w-10 h-10" />
                  <p className="text-sm" style={{ color: `${NAV}75` }}>Nenhum contrato cadastrado</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminCoauthorsPage = () => {
  const navigate = useNavigate();
  const [coauthors, setCoauthors] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [coordFilter, setCoordFilter] = useState('ALL');
  const [profileModal, setProfileModal] = useState(null);

  const fetchCoauthors = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: coordRaw }, { data: coauthorRaw, error }] = await Promise.all([
        supabase.from('profiles').select('id, name, email, avatar_url, contract_url, contract_status').eq('role', 'COORDENADOR').order('name'),
        supabase.from('profiles').select('id, name, email, avatar_url, coordinator_id, contract_url, contract_status, bio, instagram, contact_email, chapter_photo_url').eq('role', 'COAUTOR').order('name'),
      ]);
      if (error) throw error;

      const coordMap = {};
      (coordRaw || []).forEach(c => { coordMap[c.id] = c.name; });
      setCoordinators((coordRaw || []).map(c => ({ id: c.id, name: c.name })));

      const allProfiles = [
        ...(coauthorRaw || []).map(c => ({ ...c, role: 'COAUTOR' })),
        ...(coordRaw || []).map(c => ({ ...c, role: 'COORDENADOR', coordinator_id: c.id })),
      ].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      const ids = allProfiles.map(p => p.id);
      const { data: chapters } = ids.length > 0
        ? await supabase.from('chapters').select('id, author_id, title, status, word_count, word_goal, deadline, project:project_id(name)').in('author_id', ids)
        : { data: [] };

      setCoauthors(allProfiles.map(author => ({
        ...author,
        coordinatorName: author.role === 'COORDENADOR' ? author.name : (coordMap[author.coordinator_id] || 'Sem Coordenador'),
        coordId: author.coordinator_id || null,
        chapters: (chapters || [])
          .filter(c => c.author_id === author.id)
          .map(c => ({ ...c, projectName: c.project?.name || '—' })),
      })));
    } catch (err) {
      console.error('AdminCoauthorsPage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoauthors(); }, [fetchCoauthors]);

  const filtered = coauthors.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.coordinatorName || '').toLowerCase().includes(term);
    const matchCoord = coordFilter === 'ALL' || c.coordId === coordFilter;
    return matchSearch && matchCoord;
  });

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Gestão de Coautores — Novos Autores do Brasil</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Coautores</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Pastas individuais com capítulos, foto e contrato de cada autor.</p>
        </div>
        <span
          className="text-sm font-semibold px-4 py-2 rounded-xl"
          style={{ background: `${BLUE}12`, color: BLUE, border: `1px solid ${BLUE}25` }}
        >
          {coauthors.length} cadastrado{coauthors.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div
        className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-white"
        style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 4px ${NAV}08` }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${NAV}70` }} />
          <Input
            placeholder="Buscar por nome, email ou coordenador..."
            className="pl-9 text-sm"
            style={{ borderColor: `${NAV}20`, color: NAV, background: `${NAV}04` }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={coordFilter} onValueChange={setCoordFilter}>
          <SelectTrigger className="w-full md:w-64 text-sm bg-white" style={{ borderColor: `${NAV}20`, color: NAV }}>
            <SelectValue placeholder="Filtrar por Coordenador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Coordenadores</SelectItem>
            {coordinators.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Modal perfil completo */}
      {profileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,27,54,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setProfileModal(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            style={{ boxShadow: `0 24px 64px ${NAV}40` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Banner: foto do capítulo */}
            <div className="relative rounded-t-2xl overflow-hidden" style={{ minHeight: 200 }}>
              {profileModal.chapter_photo_url ? (
                <img src={profileModal.chapter_photo_url} alt="Foto" className="w-full object-cover" style={{ maxHeight: 260, minHeight: 200 }} />
              ) : (
                <div className="w-full" style={{ height: 180, background: `linear-gradient(135deg, ${BLUE}, ${NAV})` }} />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 35%, rgba(0,27,54,0.85))' }} />
              <div className="absolute bottom-5 left-6 right-14">
                <h2 className="text-2xl font-bold text-white drop-shadow" style={{ fontFamily: 'Poppins, sans-serif' }}>{profileModal.name}</h2>
                <p className="text-sm text-white/75 mt-0.5">{profileModal.coordinatorName}</p>
              </div>
              <button
                onClick={() => setProfileModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-6">
              {/* Minicurrículo */}
              {profileModal.bio ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: `${NAV}72` }}>Minicurrículo — Capa do Livro</p>
                  <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ color: NAV, background: `${NAV}04`, border: `1px solid ${NAV}0C` }}>{profileModal.bio}</p>
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: `${NAV}55` }}>Minicurrículo não preenchido.</p>
              )}

              {/* Redes sociais */}
              {(profileModal.instagram || profileModal.contact_email) && (
                <div className="flex flex-wrap gap-2">
                  {profileModal.instagram && (
                    <a
                      href={profileModal.instagram.startsWith('http') ? profileModal.instagram : `https://instagram.com/${profileModal.instagram.replace('@','')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(225,48,108,0.1)', color: '#E1306C', border: '1px solid rgba(225,48,108,0.25)' }}
                    >
                      <Link2 className="w-3 h-3" /> {profileModal.instagram}
                    </a>
                  )}
                  {profileModal.contact_email && (
                    <a
                      href={`mailto:${profileModal.contact_email}`}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: `${BLUE}12`, color: BLUE, border: `1px solid ${BLUE}25` }}
                    >
                      <Mail className="w-3 h-3" /> {profileModal.contact_email}
                    </a>
                  )}
                </div>
              )}

              {/* Capítulos */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: `${NAV}72` }}>Capítulos</p>
                {profileModal.chapters.length === 0 ? (
                  <p className="text-sm italic" style={{ color: `${NAV}55` }}>Nenhum capítulo atribuído.</p>
                ) : (
                  <div className="space-y-3">
                    {profileModal.chapters.map(chap => {
                      const cfg = STATUS_MAP[chap.status] || { label: chap.status, text: `${NAV}85`, bg: `${NAV}08` };
                      const progress = chap.word_goal > 0 ? Math.min(100, Math.round((chap.word_count / chap.word_goal) * 100)) : 0;
                      const daysRem = chap.deadline ? Math.ceil((new Date(chap.deadline) - new Date()) / 86400000) : null;
                      return (
                        <div key={chap.id} className="p-4 rounded-xl space-y-3" style={{ border: `1px solid ${NAV}0C`, background: `${NAV}02` }}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-sm leading-tight" style={{ color: NAV }}>{chap.title}</p>
                            <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.text, background: cfg.bg }}>{cfg.label}</span>
                          </div>
                          {chap.word_goal > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs" style={{ color: `${NAV}75` }}>
                                <span>{(chap.word_count || 0).toLocaleString('pt-BR')} palavras</span>
                                <span>{progress}% de {chap.word_goal.toLocaleString('pt-BR')}</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: `${NAV}10` }}>
                                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: BLUE }} />
                              </div>
                            </div>
                          )}
                          {chap.deadline && (
                            <p className="flex items-center gap-1 text-xs" style={{ color: daysRem !== null && daysRem < 0 ? '#AC1B00' : `${NAV}75` }}>
                              <Clock className="w-3 h-3" />
                              {daysRem === null ? '' : daysRem < 0 ? `Atrasado ${Math.abs(daysRem)} dias` : daysRem === 0 ? 'Entrega hoje' : `${daysRem} dias para entrega`}
                              {' · '}{new Date(chap.deadline).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${NAV}12`, background: 'white' }}>
          <Users2 className="h-12 w-12 mb-3" style={{ color: `${NAV}25` }} />
          <p className="font-medium" style={{ color: `${NAV}85` }}>Nenhum coautor encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(author => (
            <CoauthorFolder key={author.id} author={author} navigate={navigate} onViewProfile={setProfileModal} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCoauthorsPage;
