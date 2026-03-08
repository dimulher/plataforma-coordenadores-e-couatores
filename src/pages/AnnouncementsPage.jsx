
import React from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';

const AnnouncementsPage = () => {
  const { toast } = useToast();

  return (
    <>
      <Helmet>
        <title>Avisos - NAB Platform</title>
        <meta name="description" content="Visualize avisos e comunicados importantes" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Avisos</h1>
          <p className="text-muted-foreground mt-1">Comunicados e informações importantes</p>
        </div>

        <div className="flex items-center justify-center h-96 bg-card rounded-lg border-2 border-dashed border-border">
          <div className="text-center">
            <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">Esta página está sendo construída</p>
            <Button onClick={() => toast({ title: '🚧 Em breve!', description: 'Aguarde novidades' })}>
              Notifique-me
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnnouncementsPage;
