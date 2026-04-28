
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlowButton } from '@/components/ui/glow-button';
import { UserSquare2, Mail, User, AlertCircle, CheckCircle2, ArrowRight, Phone, MessageSquare, MapPin, Hash, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://n8n.prosperamentor.com.br/webhook/f78026cc-c11f-4120-b3c3-9f9c4b3aba26';
const DEFAULT_PASSWORD = 'Mudar123@';


const THEMES = {
    portugal: {
        bg: 'linear-gradient(135deg, #004d00 0%, #1a1a1a 50%, #990000 100%)',
        bar: ['#006600', '#CC0000'],
        icon: 'linear-gradient(135deg, #004d00, #CC0000)',
        dots: ['#006600', '#FFD700', '#CC0000'],
        btn: 'linear-gradient(to right, #006600, #CC0000)',
        label: 'Feira do Livro - Portugal',
        text: 'Você foi aprovado para ser coordenador do seu livro com lançamento na',
    },
    saopaulo: {
        bg: 'linear-gradient(135deg, #009C3B 0%, #1a1a2e 50%, #002776 100%)',
        bar: ['#009C3B', '#002776'],
        icon: 'linear-gradient(135deg, #009C3B, #002776)',
        dots: ['#009C3B', '#FFDF00', '#002776'],
        btn: 'linear-gradient(to right, #009C3B, #002776)',
        label: 'Bienal - São Paulo',
        text: 'Você foi aprovado para ser coordenador do seu livro com lançamento na',
    },
};

const CoordinatorInvitePage = () => {
    const { managerId, projectId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [projectName, setProjectName] = React.useState('');

    React.useEffect(() => {
        if (!projectId) return;
        supabase.from('projects').select('name').eq('id', projectId).single()
            .then(({ data }) => { if (data?.name) setProjectName(data.name); });
    }, [projectId]);

    const isSP = projectName.toLowerCase().includes('paulo');
    const theme = isSP ? THEMES.saopaulo : THEMES.portugal;
    const [formData, setFormData] = useState({
        name: '',
        social_name: '',
        email: '',
        cpf: '',
        phone: '',
        cep: '',
        address: '',
        address_number: '',
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: DEFAULT_PASSWORD,
                options: {
                    data: {
                        name: formData.name,
                        role: 'COORDENADOR',
                        manager_id: managerId,
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        email: formData.email,
                        name: formData.name,
                        social_name: formData.social_name,
                        role: 'COORDENADOR',
                        manager_id: managerId,
                        coordinator_id: authData.user.id,
                        tenant_id: 'tenant-1',
                        contract_status: 'ENVIADO',
                        cpf: formData.cpf,
                        phone: formData.phone,
                        cep: formData.cep,
                        address: formData.address,
                        address_number: formData.address_number
                    }, { onConflict: 'id' });

                if (profileError) throw profileError;

                if (projectId) {
                    await supabase.from('project_participants').insert({
                        user_id: authData.user.id,
                        project_id: projectId,
                    });
                }

                try {
                    await fetch(WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...formData,
                            manager_id: managerId,
                            project_id: projectId || null,
                            registration_date: new Date().toISOString(),
                            role: 'COORDENADOR',
                            status: 'PENDING_CONTRACT'
                        })
                    });
                } catch (webhookErr) {
                    console.error('Webhook failed:', webhookErr);
                }

                setSuccess(true);
                toast({ title: "Cadastro realizado!", description: "Seus dados foram enviados com sucesso." });
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Ocorreu um erro ao realizar o cadastro.');
            toast({ variant: "destructive", title: "Erro no cadastro", description: err.message || "Tente novamente mais tarde." });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: theme.bg }}>
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden text-center">
                    <div className="flex h-2">
                        <div className="w-2/5" style={{ background: theme.bar[0] }} />
                        <div className="w-3/5" style={{ background: theme.bar[1] }} />
                    </div>
                    <div className="p-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: '#e6ffe6' }}>
                            <CheckCircle2 className="h-10 w-10" style={{ color: theme.bar[0] }} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-3">Solicitação Enviada!</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Seu cadastro foi realizado. Enviaremos o acesso assim que o contrato for assinado.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full h-14 rounded-xl text-lg font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                            style={{ background: theme.bar[0] }}
                        >
                            Ir para Login <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans antialiased" style={{ background: theme.bg }}>
            <Helmet>
                <title>Cadastro Coordenador - NAB</title>
            </Helmet>

            <div className="w-full max-w-2xl my-8">
                <div className="rounded-t-2xl overflow-hidden shadow-2xl">
                    <div className="flex h-3">
                        <div className="w-2/5" style={{ background: theme.bar[0] }} />
                        <div className="w-3/5" style={{ background: theme.bar[1] }} />
                    </div>

                    <div className="bg-white px-8 pt-8 pb-6 text-center border-x border-t-0 border-slate-100">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-md" style={{ background: theme.icon }}>
                            <UserSquare2 className="h-8 w-8 text-white" />
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-900">
                            Seja um Coordenador
                        </h1>

                        <p className="mt-3 text-slate-500 text-base leading-relaxed font-medium">
                            {theme.text} <strong className="text-slate-800">{theme.label}</strong>.
                        </p>

                        <div className="flex justify-center gap-1 mt-5">
                            {theme.dots.map((color, i) => (
                                <span key={i} className="inline-block w-6 h-1.5 rounded-full" style={{ background: color }} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white border-x border-b border-slate-100 rounded-b-2xl shadow-2xl px-8 pb-8 pt-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="name" placeholder="Nome civil completo" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.name} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="social_name" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Nome Social (Opcional)</Label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="social_name" placeholder="Como prefere ser chamado?" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.social_name} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">E-mail Profissional</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="email" type="email" placeholder="voce@exemplo.com" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.email} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cpf" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">CPF</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="cpf" placeholder="000.000.000-00" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.cpf} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">WhatsApp</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="phone" placeholder="(00) 00000-0000" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.phone} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cep" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">CEP</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="cep" placeholder="00000-000" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.cep} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div className="md:col-span-3 space-y-1.5">
                                <Label htmlFor="address" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Endereço Completo</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="address" placeholder="Rua, Avenida, etc." className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.address} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address_number" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Número</Label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="address_number" placeholder="Nº" className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl" value={formData.address_number} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <GlowButton type="submit" disabled={loading}>
                            {loading
                                ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Processando...</span></>
                                : 'Quero me tornar Coordenador Internacional →'
                            }
                        </GlowButton>

                        <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                            Ao clicar em finalizar, seus dados serão enviados para análise. Você receberá as instruções de acesso no e-mail informado após a validação do contrato.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorInvitePage;
