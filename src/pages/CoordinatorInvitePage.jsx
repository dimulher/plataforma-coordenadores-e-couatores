
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserSquare2, Mail, User, AlertCircle, CheckCircle2, ArrowRight, Phone, MessageSquare, MapPin, Hash, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://n8n.prosperamentor.com.br/webhook/f78026cc-c11f-4120-b3c3-9f9c4b3aba26';
const DEFAULT_PASSWORD = 'Mudar123@';

const CoordinatorInvitePage = () => {
    const { managerId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
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
            // 1. Sign up user in Supabase Auth with fixed password
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
                // 2. Create/Update profile in profiles table with all new fields
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

                // 3. Send data to n8n webhook
                try {
                    await fetch(WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...formData,
                            manager_id: managerId,
                            registration_date: new Date().toISOString(),
                            role: 'COORDENADOR',
                            status: 'PENDING_CONTRACT'
                        })
                    });
                } catch (webhookErr) {
                    console.error('Webhook failed:', webhookErr);
                    // We don't block the UI for webhook failure if DB was successful
                }

                setSuccess(true);
                toast({
                    title: "Cadastro realizado!",
                    description: "Seus dados foram enviados com sucesso.",
                });
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Ocorreu um erro ao realizar o cadastro.');
            toast({
                variant: "destructive",
                title: "Erro no cadastro",
                description: err.message || "Tente novamente mais tarde.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
                <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="h-2 bg-emerald-500 w-full"></div>
                    <CardContent className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Solicitação Enviada!</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Seu cadastro foi realizado. Enviaremos o acesso assim que o contrato for assinado.
                        </p>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold" onClick={() => navigate('/login/coordenador')}>
                            Ir para Login <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans antialiased">
            <Helmet>
                <title>Cadastro Coordenador - NAB</title>
            </Helmet>

            <Card className="w-full max-w-2xl border-none shadow-2xl overflow-hidden my-8">
                <div className="h-2 bg-blue-600 w-full"></div>
                <CardHeader className="p-8 pb-4 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                        <UserSquare2 className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        Seja um Coordenador
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-lg mt-2 font-medium">
                        Participe do projeto de coautoria da Novos Autores do Brasil e lidere a criação do seu próprio livro como coordenador.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-8 pt-4">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Nome Completo</Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                                    <Input
                                        id="name"
                                        placeholder="Nome civil completo"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-medium"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="social_name" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Nome Social (Opcional)</Label>
                                <div className="relative group">
                                    <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                                    <Input
                                        id="social_name"
                                        placeholder="Como prefere ser chamado?"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-medium"
                                        value={formData.social_name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">E-mail Profissional</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="voce@exemplo.com"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-medium"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cpf" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">CPF</Label>
                                <div className="relative group">
                                    <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                                    <Input
                                        id="cpf"
                                        placeholder="000.000.000-00"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-medium"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">WhatsApp</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                                    <Input
                                        id="phone"
                                        placeholder="(00) 00000-0000"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-medium"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cep" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">CEP</Label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                                    <Input
                                        id="cep"
                                        placeholder="00000-000"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-medium"
                                        value={formData.cep}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-3 space-y-2">
                                <Label htmlFor="address" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Endereço Completo</Label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                                    <Input
                                        id="address"
                                        placeholder="Rua, Avenida, etc."
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-medium"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address_number" className="text-slate-700 font-bold uppercase text-[10px] tracking-widest ml-1">Número</Label>
                                <div className="relative group">
                                    <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
                                    <Input
                                        id="address_number"
                                        placeholder="Nº"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-medium"
                                        value={formData.address_number}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] mt-4"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Processando...</span>
                                </div>
                            ) : (
                                'Finalizar Cadastro'
                            )}
                        </Button>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] text-slate-500 text-center leading-relaxed font-medium">
                                Ao clicar em finalizar, seus dados serão enviados para análise. Você receberá as instruções de acesso no e-mail informado após a validação do contrato.
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CoordinatorInvitePage;
