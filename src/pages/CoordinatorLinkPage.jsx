import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';

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
      const { data: rows, error: ppError } = await supabase
        .from('project_participants')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1);

      console.log('[CoordinatorLinkPage] user.id:', user.id);
      console.log('[CoordinatorLinkPage] project_participants rows:', rows, 'error:', ppError);

      const projectId = rows?.[0]?.project_id;
      if (!projectId) { setLink(ALL_LINKS.portugal); return; }

      const { data: proj, error: projError } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .limit(1);

      console.log('[CoordinatorLinkPage] project:', proj, 'error:', projError);

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
      <Helmet>
        <title>Meu Link - NAB Platform</title>
      </Helmet>

      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Link de Captação</h1>
          <p className="text-muted-foreground mt-1">Compartilhe seu link exclusivo para atrair novos autores.</p>
        </div>

        {link && (
          <Card className="shadow-md overflow-hidden">
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${link.color}, ${link.accent})` }} />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>{link.flag}</span>
                {link.label}
              </CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={linkUrl}
                  className="bg-muted/50 text-foreground font-medium text-sm"
                />
                <Button
                  onClick={() => handleCopy(linkUrl)}
                  className="shrink-0"
                  style={{ background: link.color }}
                >
                  {copiedId === 'link'
                    ? <Check className="h-4 w-4" />
                    : <><Copy className="h-4 w-4 mr-2" /> Copiar</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-slate-100">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <LinkIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-500 leading-relaxed">
                Seu link é exclusivo e direciona o lead para a página do seu projeto. Os cadastros são automaticamente vinculados ao seu perfil.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CoordinatorLinkPage;
