
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChapterStatusBadge } from '@/components/ChapterStatusBadge';
import { ChapterDeadlineIndicator } from '@/components/ChapterDeadlineIndicator';
import { FileEdit, Eye, FileText } from 'lucide-react';

const ChaptersPage = () => {
  const { user, isAdmin, getTenantId } = useAuth();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('nab_data') || '{}');
    let tenantChapters = (data.chapters || []).filter(c => c.tenant_id === getTenantId());
    
    if (!isAdmin()) {
      // Coauthors only see their own
      tenantChapters = tenantChapters.filter(c => c.author_id === user?.id);
    }
    
    setChapters(tenantChapters);
  }, [user, isAdmin, getTenantId]);

  return (
    <>
      <Helmet>
        <title>Capítulos - NAB Platform</title>
      </Helmet>

      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meus Capítulos</h1>
            <p className="text-gray-500 mt-1">Gerencie as entregas e a escrita dos seus projetos literários.</p>
          </div>
        </div>

        {chapters.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700">Nenhum capítulo encontrado</h3>
              <p className="text-sm text-gray-500">Você ainda não foi atribuído a nenhum capítulo.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {chapters.map(chapter => (
              <Card key={chapter.id} className="hover:shadow-md transition-shadow border-gray-200 bg-white">
                <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-800">{chapter.title}</h3>
                      <ChapterStatusBadge status={chapter.status} />
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Progresso: {chapter.word_count || 0} / {chapter.word_goal} palavras</span>
                      {isAdmin() && <span className="font-mono">Autor ID: {chapter.author_id}</span>}
                    </div>
                    
                    <div className="pt-2">
                      <ChapterDeadlineIndicator deadline={chapter.deadline} />
                    </div>
                  </div>

                  <div className="w-full md:w-auto">
                    {isAdmin() ? (
                      <Button 
                        onClick={() => navigate(`/app/admin/chapters/${chapter.id}/review`)}
                        className="w-full bg-[#0E1A32] hover:bg-slate-800 text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" /> Revisar Capítulo
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => navigate(`/app/chapters/${chapter.id}/edit`)}
                        className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white"
                      >
                        {['RASCUNHO', 'EM_EDICAO', 'AJUSTES_SOLICITADOS'].includes(chapter.status) ? (
                          <><FileEdit className="w-4 h-4 mr-2" /> Continuar Escrevendo</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Visualizar</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ChaptersPage;
