import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { GlowButton } from '@/components/ui/glow-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Mail, User, AlertCircle, CheckCircle2, Phone, Instagram, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Cores da bandeira de Portugal
const PT_GREEN = '#006600';
const PT_RED = '#CC0000';

const CoauthorRegisterPage = () => {
  const { coordinatorId: coordinatorSlug } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorId, setCoordinatorId] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    profession: '',
  });

  useEffect(() => {
    if (!coordinatorSlug) return;
    supabase.rpc('get_coordinator_info', { lookup: coordinatorSlug })
      .then(({ data }) => {
        const coord = data?.[0];
        if (coord) { setCoordinatorId(coord.id); setCoordinatorName(coord.name); }
      });
  }, [coordinatorSlug]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!coordinatorId) {
      setError('Link de cadastro inválido. Solicite um novo link ao seu coordenador.');
      return;
    }

    setLoading(true);

    try {
      // Salva direto na tabela leads — sem criar conta Auth ainda.
      // A conta Auth só será criada quando o lead virar COAUTOR (após pagar).
      const { error: leadError } = await supabase.from('leads').insert({
        coordinator_id: coordinatorId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        instagram: formData.instagram || null,
        profession: formData.profession || null,
        status: 'INDICADO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (leadError) throw leadError;

      setSuccess(true);
      toast({ title: 'Inscrição realizada!', description: 'Seus dados foram enviados com sucesso.' });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Ocorreu um erro ao realizar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const waMessage = encodeURIComponent(
      `Olá! Acabei de me inscrever como autor internacional${coordinatorName ? ` pelo coordenador ${coordinatorName}` : ''} na plataforma da Novos Autores do Brasil. Quero saber os próximos passos!`
    );
    const waLink = `https://wa.me/5511952138107?text=${waMessage}`;

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #004d00 0%, #1a1a1a 50%, #990000 100%)' }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden text-center p-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: '#e6ffe6' }}>
            <CheckCircle2 className="h-10 w-10" style={{ color: PT_GREEN }} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Parabéns!</h2>
          <p className="text-slate-500 mb-2 leading-relaxed">
            Sua inscrição foi realizada com sucesso!
          </p>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Em breve o time da <strong className="text-slate-700">Novos Autores do Brasil</strong> entrará em contato para os próximos passos.
          </p>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full">
            <button
              className="w-full h-14 rounded-xl text-lg font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{ background: '#25D366' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.882l6.198-1.448A11.948 11.948 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.866 9.866 0 0 1-5.031-1.378l-.36-.214-3.733.872.942-3.638-.235-.374A9.848 9.848 0 0 1 2.106 12C2.106 6.533 6.533 2.106 12 2.106S21.894 6.533 21.894 12 17.467 21.894 12 21.894z"/>
              </svg>
              Furar a Fila
            </button>
          </a>
          <p className="text-xs text-slate-400 mt-3">Resposta em até 1 hora útil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans antialiased" style={{ background: 'linear-gradient(135deg, #004d00 0%, #1a1a1a 50%, #990000 100%)' }}>
      <Helmet><title>Seja um Autor Internacional - NAB</title></Helmet>

      <div className="w-full max-w-lg my-8">
        {/* Header com as cores de Portugal */}
        <div className="rounded-t-2xl overflow-hidden shadow-2xl">
          <div className="flex h-3">
            <div className="w-2/5" style={{ background: PT_GREEN }} />
            <div className="w-3/5" style={{ background: PT_RED }} />
          </div>

          <div className="bg-white px-8 pt-8 pb-6 text-center border-x border-t-0 border-slate-100">
            {/* Emblema */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-md" style={{ background: 'linear-gradient(135deg, #004d00, #CC0000)' }}>
              <BookOpen className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-900">
              Seja um Autor Internacional
            </h1>

            <p className="mt-3 text-slate-500 text-base leading-relaxed font-medium">
              {coordinatorName
                ? <>Você foi convidado por <strong className="text-slate-800">{coordinatorName}</strong> para uma oportunidade única:</>
                : 'Uma oportunidade única:'}
              <br />
              <span className="text-slate-700 font-semibold">publique seu capítulo e tenha seu nome em um livro distribuído em Portugal e no Brasil.</span>
            </p>

            {/* Faixa de bandeira decorativa */}
            <div className="flex justify-center gap-1 mt-5">
              <span className="inline-block w-6 h-1.5 rounded-full" style={{ background: PT_GREEN }} />
              <span className="inline-block w-6 h-1.5 rounded-full" style={{ background: '#FFD700' }} />
              <span className="inline-block w-6 h-1.5 rounded-full" style={{ background: PT_RED }} />
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white border-x border-b border-slate-100 rounded-b-2xl shadow-2xl px-8 pb-8 pt-6">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="name" placeholder="Seu nome completo" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.name} onChange={handleChange} required />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="email" type="email" placeholder="voce@exemplo.com" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Telefone com DDD</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="phone" placeholder="(00) 00000-0000" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>

            {/* Instagram + Profissão lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="instagram" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="instagram" placeholder="@seu.perfil" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.instagram} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profession" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Profissão</Label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="profession" placeholder="Ex: Médico, Empresário..." className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.profession} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <GlowButton type="submit" disabled={loading}>
              {loading
                ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Enviando...</span></>
                : 'Quero ser Autor Internacional →'
              }
            </GlowButton>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
              Ao se inscrever, seus dados serão analisados pela equipe NAB. Você receberá as instruções de acesso no e-mail informado.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoauthorRegisterPage;
