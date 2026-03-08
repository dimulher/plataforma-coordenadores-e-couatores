
import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Lock, User, Phone, MapPin, Hash, Loader2, Globe, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react';

const Field = ({ label, id, type = 'text', value, onChange, placeholder, disabled }) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
    </div>
);

const CoordinatorSettingsPage = () => {
    const { user, refreshProfile } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef(null);

    const [name, setName] = useState(user?.name || '');
    const [socialName, setSocialName] = useState(user?.social_name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [cep, setCep] = useState(user?.cep || '');
    const [address, setAddress] = useState(user?.address || '');
    const [addressNumber, setAddressNumber] = useState(user?.address_number || '');
    const [cpf, setCpf] = useState(user?.cpf || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [siteRequest, setSiteRequest] = useState(null);
    const [requestingSite, setRequestingSite] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        supabase
            .from('site_requests')
            .select('id, status, website_url, requested_at')
            .eq('coordinator_id', user.id)
            .maybeSingle()
            .then(({ data }) => setSiteRequest(data || null));
    }, [user?.id]);

    const handleRequestSite = async () => {
        setRequestingSite(true);
        try {
            const { data, error } = await supabase
                .from('site_requests')
                .insert({ coordinator_id: user.id, status: 'PENDENTE' })
                .select('id, status, website_url, requested_at')
                .single();

            if (error) throw error;
            setSiteRequest(data);
            toast({ title: 'Solicitação enviada!', description: 'Nossa equipe entrará em contato em breve.' });
        } catch (err) {
            toast({ title: 'Erro ao solicitar', description: err.message, variant: 'destructive' });
        } finally {
            setRequestingSite(false);
        }
    };

    const getInitials = (n) => {
        if (!n) return 'U';
        return n.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => setAvatarUrl(ev.target.result);
        reader.readAsDataURL(file);

        setUploadingAvatar(true);
        try {
            const ext = file.name.split('.').pop();
            const filePath = `avatars/${user.id}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;
            setAvatarUrl(publicUrl);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
            toast({ title: 'Foto atualizada!', description: 'Sua foto de perfil foi alterada.' });
        } catch (err) {
            console.error('Avatar upload error:', err);
            toast({ title: 'Erro ao enviar foto', description: err.message, variant: 'destructive' });
            setAvatarUrl(user?.avatar_url || '');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            toast({ title: 'Nome obrigatório', description: 'Por favor, informe seu nome.', variant: 'destructive' });
            return;
        }
        setSavingProfile(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: name.trim(),
                    social_name: socialName.trim() || null,
                    phone: phone.trim() || null,
                    cep: cep.trim() || null,
                    address: address.trim() || null,
                    address_number: addressNumber.trim() || null,
                    cpf: cpf.trim() || null,
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas.' });
        } catch (err) {
            console.error('Save profile error:', err);
            toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast({ title: 'Preencha os campos de senha', variant: 'destructive' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: 'Senha muito curta', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'As senhas não coincidem', variant: 'destructive' });
            return;
        }

        setSavingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setNewPassword('');
            setConfirmPassword('');
            toast({ title: 'Senha alterada!', description: 'Sua senha foi atualizada com sucesso.' });
        } catch (err) {
            console.error('Change password error:', err);
            toast({ title: 'Erro ao alterar senha', description: err.message, variant: 'destructive' });
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Dados do Coordenador - NAB Platform</title>
            </Helmet>

            <div className="space-y-8 pb-12 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Dados de Cadastro</h1>
                    <p className="text-slate-500 mt-1">Gerencie suas informações pessoais e de acesso</p>
                </div>

                {/* Foto de Perfil */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4 border-b border-slate-100">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" /> Foto de Perfil
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-20 w-20 border-2 border-blue-200">
                                    {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                                        {getInitials(name)}
                                    </AvatarFallback>
                                </Avatar>
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                                <Button
                                    variant="outline"
                                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                >
                                    <Camera className="h-4 w-4" />
                                    {uploadingAvatar ? 'Enviando...' : 'Alterar Foto'}
                                </Button>
                                <p className="text-xs text-slate-400 mt-2">PNG, JPG ou WEBP. Máx. 5MB.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dados pessoais */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4 border-b border-slate-100">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" /> Dados Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <Field
                            label="Nome completo"
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Seu nome completo"
                        />
                        <Field
                            label="Nome Social (Opcional)"
                            id="social_name"
                            value={socialName}
                            onChange={e => setSocialName(e.target.value)}
                            placeholder="Como prefere ser chamado?"
                        />
                        <Field
                            label="E-mail"
                            id="email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            placeholder="seu@email.com"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field
                                label="CPF"
                                id="cpf"
                                value={cpf}
                                onChange={e => setCpf(e.target.value)}
                                placeholder="000.000.000-00"
                            />
                            <div className="space-y-1.5">
                                <label htmlFor="phone" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" /> Telefone / WhatsApp
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="cep" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-slate-400" /> CEP
                            </label>
                            <input
                                id="cep"
                                type="text"
                                value={cep}
                                onChange={async (e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                    const formatted = val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val;
                                    setCep(formatted);
                                    if (val.length === 8) {
                                        try {
                                            const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
                                            const data = await res.json();
                                            if (!data.erro) {
                                                setAddress(`${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`);
                                            }
                                        } catch { }
                                    }
                                }}
                                placeholder="00000-000"
                                maxLength={9}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="address" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" /> Endereço
                            </label>
                            <input
                                id="address"
                                type="text"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Rua, bairro, cidade - UF"
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="address_number" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-slate-400" /> Número
                            </label>
                            <input
                                id="address_number"
                                type="text"
                                value={addressNumber}
                                onChange={e => setAddressNumber(e.target.value)}
                                placeholder="Número ou S/N"
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {savingProfile ? 'Salvando...' : 'Salvar Dados'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Site de Divulgação */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4 border-b border-slate-100">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-500" /> Site de Divulgação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!siteRequest || siteRequest.status === 'CANCELADO' ? (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm text-slate-600">
                                    Solicite a criação de um site profissional para divulgar seu trabalho como coordenador.
                                </p>
                                <div>
                                    <Button
                                        onClick={handleRequestSite}
                                        disabled={requestingSite}
                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                    >
                                        {requestingSite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                                        {requestingSite ? 'Enviando...' : 'Solicitar Agora'}
                                    </Button>
                                </div>
                            </div>
                        ) : siteRequest.status === 'PENDENTE' ? (
                            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <Clock className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-yellow-800">Solicitação em análise</p>
                                    <p className="text-sm text-yellow-700 mt-0.5">Nossa equipe recebeu seu pedido e entrará em contato em breve.</p>
                                </div>
                            </div>
                        ) : siteRequest.status === 'EM_ANDAMENTO' ? (
                            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <Loader2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                                <div>
                                    <p className="font-semibold text-blue-800">Site em desenvolvimento</p>
                                    <p className="text-sm text-blue-700 mt-0.5">Estamos construindo seu site. Você será notificado quando estiver pronto.</p>
                                </div>
                            </div>
                        ) : siteRequest.status === 'CONCLUIDO' ? (
                            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold text-green-800">Site pronto!</p>
                                    {siteRequest.website_url ? (
                                        <a
                                            href={siteRequest.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:underline font-medium mt-1"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            {siteRequest.website_url}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-green-700 mt-0.5">Seu site está no ar!</p>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Alterar Senha */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4 border-b border-slate-100">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Lock className="h-5 w-5 text-blue-500" /> Alterar Senha
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <Field
                            label="Nova senha"
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                        />
                        <Field
                            label="Confirmar nova senha"
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                        />

                        <div className="pt-2">
                            <Button
                                onClick={handleChangePassword}
                                disabled={savingPassword}
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-2"
                            >
                                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                {savingPassword ? 'Alterando...' : 'Alterar Senha'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default CoordinatorSettingsPage;
