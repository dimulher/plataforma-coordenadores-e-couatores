import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Lock, User, Phone, MapPin, Hash, Loader2 } from 'lucide-react';
import { NAV, BLUE, RED, BrandCard, BrandCardHeader, BtnPrimary, BtnOutline } from '@/lib/brand';

const Field = ({ label, id, type = 'text', value, onChange, placeholder, disabled, icon: Icon }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-sm font-medium flex items-center gap-1.5" style={{ color: `${NAV}80` }}>
      {Icon && <Icon className="h-3.5 w-3.5" style={{ color: `${NAV}75` }} />}
      {label}
    </label>
    <input
      id={id} type={type} value={value} onChange={onChange}
      placeholder={placeholder} disabled={disabled}
      className="w-full px-3 py-2.5 rounded-xl text-sm transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ border: `1.5px solid ${NAV}18`, background: disabled ? `${NAV}05` : 'white', color: NAV, outline: 'none' }}
      onFocus={e => { if (!disabled) { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; } }}
      onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

const CSSettingsPage = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [name, setName]                   = useState(user?.name || '');
  const [socialName, setSocialName]       = useState(user?.social_name || '');
  const [phone, setPhone]                 = useState(user?.phone || '');
  const [cep, setCep]                     = useState(user?.cep || '');
  const [address, setAddress]             = useState(user?.address || '');
  const [addressNumber, setAddressNumber] = useState(user?.address_number || '');
  const [cpf, setCpf]                     = useState(user?.cpf || '');
  const [avatarUrl, setAvatarUrl]         = useState(user?.avatar_url || '');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile]   = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const getInitials = (n) => n ? n.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : 'U';

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
      const { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      setAvatarUrl(urlData.publicUrl);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
      await refreshProfile();
      toast({ title: 'Foto atualizada!' });
    } catch (err) {
      toast({ title: 'Erro ao enviar foto', description: err.message, variant: 'destructive' });
      setAvatarUrl(user?.avatar_url || '');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles').update({
        name: name.trim(), social_name: socialName.trim() || null,
        phone: phone.trim() || null, cep: cep.trim() || null,
        address: address.trim() || null, address_number: addressNumber.trim() || null,
        cpf: cpf.trim() || null,
      }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Perfil atualizado!' });
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) { toast({ title: 'Preencha os campos de senha', variant: 'destructive' }); return; }
    if (newPassword.length < 6) { toast({ title: 'Senha muito curta', description: 'Mínimo 6 caracteres.', variant: 'destructive' }); return; }
    if (newPassword !== confirmPassword) { toast({ title: 'As senhas não coincidem', variant: 'destructive' }); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword(''); setConfirmPassword('');
      toast({ title: 'Senha alterada!' });
    } catch (err) {
      toast({ title: 'Erro ao alterar senha', description: err.message, variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <Helmet><title>Dados do CS — Novos Autores do Brasil</title></Helmet>
      <div className="space-y-6 pb-12 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Dados de Cadastro</h1>
          <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Gerencie suas informações pessoais e de acesso</p>
        </div>

        <BrandCard>
          <BrandCardHeader icon={User} iconColor={BLUE} accentColor={BLUE} title="Foto de Perfil" />
          <div className="px-6 py-6 flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20" style={{ border: `2px solid ${BLUE}30` }}>
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback style={{ background: `${BLUE}15`, color: BLUE, fontSize: '1.25rem', fontWeight: 700 }}>
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: BLUE }} />
                </div>
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
              <BtnOutline onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} loading={uploadingAvatar}
                icon={Camera} label="Alterar Foto" loadingLabel="Enviando..." color={BLUE} />
              <p className="text-xs mt-2" style={{ color: `${NAV}70` }}>PNG, JPG ou WEBP. Máx. 5MB.</p>
            </div>
          </div>
        </BrandCard>

        <BrandCard>
          <BrandCardHeader icon={User} iconColor={BLUE} accentColor={BLUE} title="Dados Pessoais" />
          <div className="px-6 py-6 space-y-4">
            <Field label="Nome completo"          id="name"        value={name}        onChange={e => setName(e.target.value)}        placeholder="Seu nome completo" />
            <Field label="Nome Social (Opcional)" id="social_name" value={socialName}  onChange={e => setSocialName(e.target.value)}  placeholder="Como prefere ser chamado?" />
            <Field label="E-mail"                 id="email"       type="email" value={user?.email || ''} disabled placeholder="seu@email.com" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="CPF"                 id="cpf"   value={cpf}   onChange={e => setCpf(e.target.value)}   placeholder="000.000.000-00" icon={Hash} />
              <Field label="Telefone / WhatsApp" id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" icon={Phone} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cep" className="text-sm font-medium flex items-center gap-1.5" style={{ color: `${NAV}80` }}>
                <Hash className="h-3.5 w-3.5" style={{ color: `${NAV}75` }} /> CEP
              </label>
              <input id="cep" type="text" value={cep} maxLength={9} placeholder="00000-000"
                onChange={async (e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  const formatted = val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val;
                  setCep(formatted);
                  if (val.length === 8) {
                    try {
                      const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
                      const data = await res.json();
                      if (!data.erro) setAddress(`${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`);
                    } catch {}
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ border: `1.5px solid ${NAV}18`, color: NAV, background: 'white', outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <Field label="Endereço" id="address"        value={address}       onChange={e => setAddress(e.target.value)}       placeholder="Rua, bairro, cidade - UF" icon={MapPin} />
            <Field label="Número"   id="address_number" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="Número ou S/N" icon={Hash} />
            <div className="pt-2">
              <BtnPrimary onClick={handleSaveProfile} disabled={savingProfile} loading={savingProfile}
                icon={Save} label="Salvar Dados" loadingLabel="Salvando..." />
            </div>
          </div>
        </BrandCard>

        <BrandCard>
          <BrandCardHeader icon={Lock} iconColor={RED} accentColor={RED} title="Alterar Senha" />
          <div className="px-6 py-6 space-y-4">
            <Field label="Nova senha"           id="newPassword"     type="password" value={newPassword}     onChange={e => setNewPassword(e.target.value)}     placeholder="Mínimo 6 caracteres" />
            <Field label="Confirmar nova senha" id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
            <div className="pt-2">
              <BtnOutline onClick={handleChangePassword} disabled={savingPassword} loading={savingPassword}
                icon={Lock} label="Alterar Senha" loadingLabel="Alterando..." color={NAV} />
            </div>
          </div>
        </BrandCard>
      </div>
    </>
  );
};

export default CSSettingsPage;
