
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Eye, Clock, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CoauthorChaptersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chapters, setChapters] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState('deadline');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      try {
        const { data: myChapters, error: chapError } = await supabase
          .from('chapters')
          .select('*')
          .eq('author_id', user.id);

        if (chapError) throw chapError;

        const { data: participations, error: projError } = await supabase
          .from('project_participants')
          .select('project_id, projects(*)')
          .eq('user_id', user.id);

        if (projError) throw projError;

        setChapters(myChapters || []);
        setProjects(participations?.map(p => p.projects) || []);
      } catch (err) {
        console.error('CoauthorChaptersPage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const getProjectName = (pid) => projects.find(p => p?.id === pid)?.name || 'Projeto Desconhecido';

  const getStatusStyles = (status) => {
    switch (status) {
      case 'RASCUNHO':
      case 'EM_EDICAO': return { text: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Em edição' };
      case 'ENVIADO_PARA_REVISAO': return { text: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: 'Enviado p/ revisão' };
      case 'AJUSTES_SOLICITADOS': return { text: '#FF6B35', bg: 'rgba(255, 107, 53, 0.1)', label: 'Ajustes solicitados' };
      case 'APROVADO': return { text: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Aprovado' };
      case 'FINALIZADO': return { text: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', label: 'Concluído' };
      default: return { text: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', label: status || 'Desconhecido' };
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleCreateChapter = async () => {
    if (!user?.id) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          author_id: user.id,
          title: 'Meu Capítulo',
          status: 'RASCUNHO',
          word_count: 0,
          word_goal: 1000,
          content_text: '',
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Capítulo criado!', description: 'Você pode começar a escrever agora.' });
      navigate(`/coauthor/chapters/${data.id}/edit`);
    } catch (err) {
      console.error('Error creating chapter:', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar o capítulo.' });
    } finally {
      setCreating(false);
    }
  };

  const filteredChapters = chapters
    .filter(c => statusFilter === 'ALL' || c.status === statusFilter)
    .sort((a, b) => {
      if (sortConfig === 'deadline') return new Date(a.deadline || 0) - new Date(b.deadline || 0);
      if (sortConfig === 'progress') {
        const progA = a.word_goal ? (a.word_count || 0) / a.word_goal : 0;
        const progB = b.word_goal ? (b.word_count || 0) / b.word_goal : 0;
        return progB - progA;
      }
      if (sortConfig === 'date') return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      return 0;
    });

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Meu Capítulo - NAB Platform</title></Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Meu Capítulo</h1>
          <p className="text-slate-500">Escreva, gerencie e envie seu capítulo para revisão.</p>
        </div>

        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="Filtrar Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="RASCUNHO">Em edição</SelectItem>
              <SelectItem value="ENVIADO_PARA_REVISAO">Enviado p/ revisão</SelectItem>
              <SelectItem value="AJUSTES_SOLICITADOS">Ajustes solicitados</SelectItem>
              <SelectItem value="APROVADO">Aprovado</SelectItem>
              <SelectItem value="FINALIZADO">Concluído</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortConfig} onValueChange={setSortConfig}>
            <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Prazo (mais próximo)</SelectItem>
              <SelectItem value="progress">Maior progresso</SelectItem>
              <SelectItem value="date">Última edição</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChapters.map(chapter => {
          const wordCount = chapter.word_count || 0;
          const wordGoal = chapter.word_goal || 1;
          const progress = Math.min(Math.round((wordCount / wordGoal) * 100), 100);
          const isEditable = ['RASCUNHO', 'EM_EDICAO', 'AJUSTES_SOLICITADOS'].includes(chapter.status);
          const statusStyle = getStatusStyles(chapter.status);
          const wordsRemaining = Math.max(0, wordGoal - wordCount);
          let remainingColor = '#EF4444';
          if (wordsRemaining === 0) remainingColor = '#10B981';
          else if (wordsRemaining <= wordGoal * 0.3) remainingColor = '#F59E0B';

          return (
            <Card key={chapter.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{getProjectName(chapter.project_id)}</p>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{chapter.title || 'Sem título'}</h3>
                  </div>
                  <span
                    className="text-[14px] font-bold px-[14px] py-[6px] rounded-[12px] whitespace-nowrap"
                    style={{ color: statusStyle.text, backgroundColor: statusStyle.bg }}
                  >
                    {statusStyle.label}
                  </span>
                </div>

                <div className="space-y-4 mb-6 flex-1">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-slate-600">Progresso</span>
                      <span className="text-sm font-bold text-slate-800">
                        {wordCount.toLocaleString()} / {(chapter.word_goal || 0).toLocaleString()} <span className="text-slate-400 font-normal">palavras</span> ({progress}%)
                      </span>
                    </div>
                    <Progress value={progress} className="h-[6px] bg-[#E5E7EB] rounded-[3px] transition-all duration-300 w-full" indicatorColor="bg-[#3B82F6]" />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[13px] text-[#6B7280]">Meta sugerida: {wordGoal} palavras</span>
                      <span className="text-[13px] font-medium" style={{ color: remainingColor }}>
                        {wordsRemaining === 0 ? 'Meta atingida!' : `Faltam ${wordsRemaining} palavras`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-slate-500 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Prazo: <strong className="text-slate-700">{chapter.deadline ? new Date(chapter.deadline).toLocaleDateString('pt-BR') : 'N/A'}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="text-[12px] text-[#9CA3AF] text-left">
                    Última atualização: {formatDateTime(chapter.updated_at)}
                  </div>
                  <Button
                    onClick={() => navigate(`/coauthor/chapters/${chapter.id}/edit`)}
                    className={`w-full font-semibold ${isEditable ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                  >
                    {isEditable ? <><Edit3 className="w-4 h-4 mr-2" /> Continuar Escrevendo</> : <><Eye className="w-4 h-4 mr-2" /> Visualizar Capítulo</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Estado vazio — sem capítulos */}
        {filteredChapters.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <PenLine className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {statusFilter !== 'ALL' ? 'Nenhum capítulo com este status.' : 'Você ainda não começou a escrever.'}
            </h3>
            <p className="text-slate-500 mb-6 text-sm">
              {statusFilter !== 'ALL'
                ? 'Tente outro filtro ou comece a escrever seu capítulo.'
                : 'Clique abaixo para criar seu capítulo e começar a escrever.'}
            </p>
            {statusFilter === 'ALL' && (
              <Button
                onClick={handleCreateChapter}
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                {creating ? 'Criando...' : <><PenLine className="w-4 h-4 mr-2" /> Começar a escrever meu capítulo</>}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoauthorChaptersPage;
