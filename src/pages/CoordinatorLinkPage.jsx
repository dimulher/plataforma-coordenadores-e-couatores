import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { NAV, BLUE, BrandCard } from '@/lib/brand';

const ALL_LINKS = {
  portugal: {
    id: 'portugal',
    label: 'Feira do Livro - Portugal',
    description: 'Página temática com as cores de Portugal',
    route: 'register/coautor',
    color: '#006600',
    accent: '#CC0000',
    flag: '🇵🇹',
    keyword: 'portugal',
  },
  saopaulo: {
    id: 'saopaulo',
    label: 'Bienal - São Paulo',
    description: 'Página temática com as cores do Brasil',
    route: 'register/autor-sp',
    color: '#009C3B',
    accent: '#002776',
    flag: '🇧🇷',
    keyword: 'paulo',
  },
};

const CoordinatorLinkPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState(null);
  const [link, setLink] = useState(null);

  const nameSlug = (user?.name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();

  useEffect(() => {
    if (!user?.id) return;
    async function detectProject() {
      const { data: rows } = await supabase
        .from('project_participants')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1);

      const projectId = rows?.[0]?.project_id;
      if (!projectId) { setLink(ALL_LINKS.portugal); return; }

      const { data: proj } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .limit(1);

      const name = proj?.[0]?.name?.toLowerCase() || '';
      setLink(name.includes('paulo') ? ALL_LINKS.saopaulo : ALL_LINKS.portugal);
    }
    detectProject();
  }, [user?.id]);

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedId('link');
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const linkUrl = link ? `${window.location.origin}/${link.route}/${nameSlug}` : '';

  return (
    <>
      <Helmet><title>Meu Link — Novos Autores do Brasil</title></Helmet>

      <div className="space-y-6 max-w-3xl pb-12">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Link de Captação</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Compartilhe seu link exclusivo para atrair novos autores.</p>
        </div>

        {link && (
          <BrandCard>
            <div className="h-1.5 w-full rounded-t-2xl" style={{ background: `linear-gradient(to right, ${link.color}, ${link.accent})` }} />
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{link.flag}</span>
                <h3 className="font-bold text-lg" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{link.label}</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: `${NAV}85` }}>{link.description}</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={linkUrl}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ border: `1.5px solid ${NAV}15`, color: `${NAV}80`, background: `${NAV}04`, outline: 'none' }}
                />
                <button
                  onClick={() => handleCopy(linkUrl)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: copiedId === 'link' ? '#10B981' : link.color }}
                >
                  {copiedId === 'link'
                    ? <Check className="h-4 w-4" />
                    : <><Copy className="h-4 w-4" /> Copiar</>
                  }
                </button>
              </div>
            </div>
          </BrandCard>
        )}

        <BrandCard>
          <div className="px-6 py-4 flex items-start gap-3">
            <LinkIcon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: BLUE }} />
            <p className="text-sm leading-relaxed" style={{ color: `${NAV}85` }}>
              Seu link é exclusivo e direciona o lead para a página do seu projeto. Os cadastros são automaticamente vinculados ao seu perfil.
            </p>
          </div>
        </BrandCard>
      </div>
    </>
  );
};

export default CoordinatorLinkPage;
