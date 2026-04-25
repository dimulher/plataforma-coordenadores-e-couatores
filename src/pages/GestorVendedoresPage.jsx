import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Trash2, Loader2, Users2, Link2 } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader } from '@/lib/brand';

const GestorVendedoresPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading]           = useState(true);
  const [vendedores, setVendedores]     = useState([]);   // todos os VENDEDOREs
  const [liders, setLiders]             = useState([]);   // LÍDEREs do gestor
  const [assignments, setAssignments]   = useState([]);   // atribuições atuais
  const [saving, setSaving]             = useState(false);

  // Formulário de nova atribuição
  const [selVendedor, setSelVendedor]   = useState('');
  const [selLider, setSelLider]         = useState('');

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [{ data: vends }, { data: lids }, { data: assigns }] = await Promise.all([
      supabase.rpc('get_all_vendedores'),
      supabase.from('profiles').select('id, name, email').eq('role', 'LIDER').eq('manager_id', user.id).order('name'),
      supabase.rpc('get_my_vendedor_assignments'),
    ]);
    setVendedores(vends || []);
    setLiders(lids || []);
    setAssignments(assigns || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdd = async () => {
    if (!selVendedor || !selLider) {
      toast({ title: 'Selecione o vendedor e o líder', variant: 'destructive' });
      return;
    }
    // Verificar se já existe
    const exists = assignments.find(a => a.vendedor_id === selVendedor && a.lider_id === selLider);
    if (exists) {
      toast({ title: 'Atribuição já existe', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('vendedor_assignments').insert({
      vendedor_id: selVendedor,
      lider_id: selLider,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atribuir', description: error.message });
    } else {
      toast({ title: 'Vendedor atribuído com sucesso!' });
      setSelVendedor('');
      setSelLider('');
      fetchAll();
    }
    setSaving(false);
  };

  const handleRemove = async (assignmentId) => {
    const { error } = await supabase.from('vendedor_assignments').delete().eq('id', assignmentId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: error.message });
    } else {
      toast({ title: 'Atribuição removida.' });
      fetchAll();
    }
  };

  // Agrupar atribuições por líder
  const byLider = assignments.reduce((acc, a) => {
    const key = a.lider_id;
    if (!acc[key]) acc[key] = { lider_name: a.lider_name, items: [] };
    acc[key].items.push(a);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: BLUE }} />
    </div>
  );

  const selectStyle = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: '0.75rem',
    border: `1.5px solid ${NAV}18`,
    color: NAV,
    background: 'white',
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Gestão de Vendedores — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Vendedores</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}60` }}>
          Atribua vendedores aos seus Líderes de Coordenação. Cada vendedor verá todos os leads dos coordenadores do líder atribuído.
        </p>
      </div>

      {/* Formulário de nova atribuição */}
      <BrandCard>
        <BrandCardHeader icon={Link2} iconColor={BLUE} accentColor={BLUE} title="Nova Atribuição" />
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: `${NAV}80` }}>Vendedor</label>
              <select
                value={selVendedor}
                onChange={e => setSelVendedor(e.target.value)}
                style={selectStyle}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">Selecionar vendedor...</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {vendedores.length === 0 && (
                <p className="text-xs" style={{ color: `${NAV}45` }}>Nenhum vendedor cadastrado ainda.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: `${NAV}80` }}>Líder de Coordenação</label>
              <select
                value={selLider}
                onChange={e => setSelLider(e.target.value)}
                style={selectStyle}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">Selecionar líder...</option>
                {liders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {liders.length === 0 && (
                <p className="text-xs" style={{ color: `${NAV}45` }}>Nenhum líder vinculado ao seu time.</p>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={saving || !selVendedor || !selLider}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: BLUE, fontFamily: 'Poppins, sans-serif' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#2d6a9f'; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLUE; }}
            >
              {saving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Plus className="h-4 w-4" />
              }
              {saving ? 'Atribuindo...' : 'Atribuir'}
            </button>
          </div>
        </div>
      </BrandCard>

      {/* Atribuições atuais agrupadas por líder */}
      <BrandCard>
        <BrandCardHeader icon={Users2} iconColor="#F97316" accentColor="#F97316" title="Atribuições Ativas" />
        <div className="px-6 pb-6">
          {Object.keys(byLider).length === 0 ? (
            <p className="text-sm italic text-center py-8" style={{ color: `${NAV}40` }}>
              Nenhuma atribuição configurada. Use o formulário acima para vincular vendedores aos seus líderes.
            </p>
          ) : (
            <div className="space-y-6 mt-4">
              {Object.entries(byLider).map(([liderId, group]) => (
                <div key={liderId}>
                  {/* Header do líder */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: `${BLUE}12`, color: BLUE, fontFamily: 'Poppins, sans-serif' }}
                    >
                      Líder: {group.lider_name}
                    </span>
                    <div className="h-px flex-1" style={{ background: `${NAV}10` }} />
                  </div>

                  {/* Vendedores deste líder */}
                  <div className="space-y-2 ml-2">
                    {group.items.map(a => (
                      <div
                        key={a.assignment_id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: `${NAV}03`, border: `1px solid ${NAV}0C` }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316' }}
                          >
                            {(a.vendedor_name || 'V').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: NAV }}>{a.vendedor_name}</p>
                            <p className="text-xs" style={{ color: `${NAV}50` }}>{a.vendedor_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-bold px-2 py-1 rounded-md"
                            style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}
                          >
                            VENDEDOR
                          </span>
                          <button
                            onClick={() => handleRemove(a.assignment_id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: `${NAV}30` }}
                            title="Remover atribuição"
                            onMouseEnter={e => { e.currentTarget.style.color = RED; e.currentTarget.style.background = `${RED}10`; }}
                            onMouseLeave={e => { e.currentTarget.style.color = `${NAV}30`; e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BrandCard>

      {/* Info sobre vendedores sem atribuição */}
      {vendedores.length > 0 && (() => {
        const atribuidos = new Set(assignments.map(a => a.vendedor_id));
        const semAtribuicao = vendedores.filter(v => !atribuidos.has(v.id));
        if (semAtribuicao.length === 0) return null;
        return (
          <div
            className="px-5 py-4 rounded-2xl flex items-start gap-3"
            style={{ background: `${NAV}04`, border: `1px solid ${NAV}0C` }}
          >
            <ShoppingCart className="h-4 w-4 mt-0.5 shrink-0" style={{ color: `${NAV}50` }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: NAV }}>
                {semAtribuicao.length} vendedor{semAtribuicao.length > 1 ? 'es' : ''} sem atribuição
              </p>
              <p className="text-xs mt-0.5" style={{ color: `${NAV}55` }}>
                {semAtribuicao.map(v => v.name).join(', ')}
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default GestorVendedoresPage;
