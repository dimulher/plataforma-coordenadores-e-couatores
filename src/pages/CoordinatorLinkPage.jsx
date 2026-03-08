
import React from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Link as LinkIcon, MousePointerClick, TrendingUp, Share2 } from 'lucide-react';

const CoordinatorLinkPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const nameSlug = (user?.name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
  const referralLink = `${window.location.origin}/register/coautor/${nameSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copiado!",
      description: "Seu link de captação foi copiado para a área de transferência.",
      className: "bg-success text-success-foreground border-none",
    });
  };

  const mockHistory = [
    { id: 1, date: new Date().toLocaleString(), ip: '192.168.x.x', source: 'Direct' },
  ];

  return (
    <>
      <Helmet>
        <title>Meu Link - NAB Platform</title>
      </Helmet>

      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Link de Captação</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu link exclusivo para atrair novos autores.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Link Card */}
          <Card className="md:col-span-2 shadow-lg border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                Seu Link Exclusivo
              </CardTitle>
              <CardDescription>Compartilhe este link para garantir que os leads sejam atribuídos a você.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralLink}
                  className="bg-muted/50 text-foreground font-medium"
                />
                <Button onClick={handleCopy} className="bg-primary hover:bg-primary/90 text-white shrink-0">
                  <Copy className="h-4 w-4 mr-2" /> Copiar
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex-1" onClick={() => toast({ title: "🚧 Em breve!" })}>
                  <Share2 className="h-4 w-4 mr-2" /> Compartilhar no WhatsApp
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => toast({ title: "🚧 Em breve!" })}>
                  <Share2 className="h-4 w-4 mr-2" /> Compartilhar no Instagram
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="shadow-lg bg-secondary text-secondary-foreground">
            <CardHeader>
              <CardTitle className="text-white">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <MousePointerClick className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total de Cliques</p>
                  <p className="text-3xl font-bold text-white">{user?.click_count || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/20 rounded-full">
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Conversão Estimada</p>
                  <p className="text-xl font-bold text-white">4.2%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Histórico Recente de Cliques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Data/Hora</th>
                    <th className="px-4 py-3">Origem Estimada</th>
                    <th className="px-4 py-3 rounded-tr-lg">IP (Parcial)</th>
                  </tr>
                </thead>
                <tbody>
                  {mockHistory.map((hit) => (
                    <tr key={hit.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{hit.date}</td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold">
                          {hit.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{hit.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CoordinatorLinkPage;
