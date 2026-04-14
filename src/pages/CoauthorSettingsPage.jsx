
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Lock, User, Phone, MapPin, Hash, Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Brand palette — Novos Autores do Brasil
   60 % → Cream #F5F5D9 + white   (backgrounds)
   30 % → Navy  #001B36           (structure, text, borders)
   10 % → Red   #AC1B00           (logo, CTAs, accents)
   +      Blue  #3F7DB0           (secondary actions, focus)
───────────────────────────────────────────────────────────── */
const NAV   = '#001B36';
const BLUE  = '#3F7DB0';
const RED   = '#AC1B00';
const CREAM = '#F5F5D9';

/* ── Field ──────────────────────────────────────────────────── */
const Field = ({ label, id, type = 'text', value, onChange, placeholder, disabled, icon: Icon }) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-[11px] font-semibold tracking-widest uppercase flex items-center gap-1.5"
      style={{ color: NAV, fontFamily: 'Poppins, sans-serif', opacity: 0.55 }}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200
                 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        border: `1.5px solid ${NAV}1A`,
        background: disabled ? CREAM : '#ffffff',
        color: NAV,
        fontFamily: "'Be Vietnam Pro', sans-serif",
        outline: 'none',
      }}
      onFocus={e => {
        e.target.style.borderColor = BLUE;
        e.target.style.boxShadow = `0 0 0 3px ${BLUE}25`;
      }}
      onBlur={e => {
        e.target.style.borderColor = `${NAV}1A`;
        e.target.style.boxShadow = 'none';
      }}
    />
  </div>
);

/* ── Section card ───────────────────────────────────────────── */
const Section = ({ icon: Icon, iconBg, iconColor, title, children, accentColor }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{
      background: '#ffffff',
      border: `1px solid ${NAV}0F`,
      boxShadow: `0 1px 3px ${NAV}0A, 0 4px 20px ${NAV}06`,
    }}
  >
    {/* header bar */}
    <div
      className="flex items-center gap-3 px-6 py-4"
      style={{
        borderBottom: `1px solid ${NAV}0C`,
        background: `linear-gradient(90deg, ${accentColor || NAV}08 0%, transparent 60%)`,
      }}
    >
      <span
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: iconBg || `${NAV}10` }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor || NAV }} />
      </span>
      <h2
        className="text-[15px] font-semibold"
        style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}
      >
        {title}
      </h2>
      {/* accent dot */}
      <span
        className="ml-auto w-1.5 h-1.5 rounded-full"
        style={{ background: accentColor || BLUE }}
      />
    </div>

    {/* body */}
    <div className="px-6 py-6">{children}</div>
  </div>
);

/* ── Primary button (red — 10 % accent) ────────────────────── */
const PrimaryBtn = ({ onClick, disabled, loading, loadingLabel, label, icon: Icon }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
               text-white transition-all duration-150 active:scale-[0.97]
               disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      background: RED,
      fontFamily: 'Poppins, sans-serif',
      boxShadow: `0 4px 14px ${RED}45`,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#8a1500'; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = RED; }}
  >
    {loading
      ? <Loader2 className="h-4 w-4 animate-spin" />
      : <Icon className="h-4 w-4" />}
    {loading ? loadingLabel : label}
  </button>
);

/* ── Outline button (navy) ──────────────────────────────────── */
const OutlineBtn = ({ onClick, disabled, loading, loadingLabel, label, icon: Icon }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
               transition-all duration-150 active:scale-[0.97]
               disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      border: `1.5px solid ${NAV}`,
      color: NAV,
      background: 'transparent',
      fontFamily: 'Poppins, sans-serif',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = `${NAV}08`; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {loading
      ? <Loader2 className="h-4 w-4 animate-spin" />
      : <Icon className="h-4 w-4" />}
    {loading ? loadingLabel : label}
  </button>
);

/* ═══════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════ */
const CoauthorSettingsPage = () => {
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
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile]   = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const getInitials = (n) =>
    n ? n.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : 'U';

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('profiles').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      setAvatarPreview(publicUrl);
      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      toast({ title: 'Foto atualizada!' });
    } catch (err) {
      toast({ title: 'Erro ao enviar foto', description: err.message, variant: 'destructive' });
      setAvatarPreview(user?.avatar_url || '');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles').update({
        name: name.trim(),
        social_name: socialName.trim() || null,
        phone: phone.trim() || null,
        cep: cep.trim() || null,
        address: address.trim() || null,
        address_number: addressNumber.trim() || null,
        cpf: cpf.trim() || null,
      }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas.' });
    } catch (err) {
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
      toast({ title: 'Senha muito curta', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
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
      toast({ title: 'Senha alterada!', description: 'Atualizada com sucesso.' });
    } catch (err) {
      toast({ title: 'Erro ao alterar senha', description: err.message, variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <Helmet><title>Meu Perfil — Novos Autores do Brasil</title></Helmet>

      <div className="max-w-2xl mx-auto pb-16 space-y-5">

        {/* ══════════════════════════════════════════════════════
            HERO HEADER — Navy bg, logo + brand name + title
        ═════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{ background: NAV }}
        >
          {/* Cream texture strip along bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, ${RED} 0%, ${BLUE} 50%, ${RED} 100%)` }}
          />

          {/* Decorative background shapes */}
          <div
            className="absolute right-0 top-0 bottom-0 w-48 opacity-[0.04]"
            style={{
              background: `radial-gradient(ellipse at right center, ${CREAM} 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-[0.06]"
            style={{ background: BLUE }}
          />

          {/* Content */}
          <div className="relative px-8 py-7 flex items-center gap-6">
            {/* Logo mark */}
            <div
              className="shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{
                background: `${RED}20`,
                border: `1.5px solid ${RED}40`,
              }}
            >
              <img
                src="/logo-nab.png"
                alt="Novos Autores do Brasil"
                className="w-10 h-10 object-contain"
                style={{ filter: 'brightness(1.1)' }}
              />
            </div>

            {/* Text block */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1"
                style={{ color: BLUE, fontFamily: 'Poppins, sans-serif' }}
              >
                Novos Autores do Brasil
              </p>
              <h1
                className="text-2xl font-bold leading-tight"
                style={{ color: '#ffffff', fontFamily: 'Poppins, sans-serif' }}
              >
                Meu Perfil
              </h1>
              <p
                className="text-[13px] mt-1"
                style={{ color: `${CREAM}99`, fontFamily: "'Be Vietnam Pro', sans-serif" }}
              >
                Gerencie suas informações pessoais e de acesso
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            FOTO DE PERFIL
        ═════════════════════════════════════════════════════ */}
        <Section
          icon={User}
          iconBg={`${BLUE}18`}
          iconColor={BLUE}
          accentColor={BLUE}
          title="Foto de Perfil"
        >
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar
                className="h-20 w-20"
                style={{
                  border: `2.5px solid ${BLUE}`,
                  boxShadow: `0 0 0 4px ${BLUE}15`,
                }}
              >
                {avatarPreview && <AvatarImage src={avatarPreview} alt={name} />}
                <AvatarFallback
                  className="text-xl font-bold"
                  style={{
                    background: NAV,
                    color: CREAM,
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.85)' }}
                >
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: BLUE }} />
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
                           font-semibold transition-all duration-150 active:scale-[0.97]"
                style={{
                  border: `1.5px solid ${BLUE}`,
                  color: BLUE,
                  background: `${BLUE}0D`,
                  fontFamily: 'Poppins, sans-serif',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}20`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}0D`; }}
              >
                <Camera className="h-4 w-4" />
                {uploadingAvatar ? 'Enviando...' : 'Alterar Foto'}
              </button>
              <p
                className="text-xs mt-2"
                style={{ color: NAV, opacity: 0.4, fontFamily: "'Be Vietnam Pro', sans-serif" }}
              >
                PNG, JPG ou WEBP. Máx. 5 MB.
              </p>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════
            DADOS PESSOAIS
        ═════════════════════════════════════════════════════ */}
        <Section
          icon={User}
          iconBg={`${RED}15`}
          iconColor={RED}
          accentColor={RED}
          title="Dados Pessoais"
        >
          <div className="space-y-4">
            <Field label="Nome completo" id="name"
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Seu nome completo" />

            <Field label="Nome Social (Opcional)" id="social_name"
              value={socialName} onChange={e => setSocialName(e.target.value)}
              placeholder="Como prefere ser chamado?" />

            <Field label="E-mail" id="email" type="email"
              value={user?.email || ''} disabled placeholder="seu@email.com" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="CPF" id="cpf"
                value={cpf} onChange={e => setCpf(e.target.value)}
                placeholder="000.000.000-00" />
              <Field label="Telefone / WhatsApp" id="phone" type="tel"
                icon={Phone} value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(11) 99999-9999" />
            </div>

            {/* CEP com auto-fill */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cep"
                className="text-[11px] font-semibold tracking-widest uppercase flex items-center gap-1.5"
                style={{ color: NAV, fontFamily: 'Poppins, sans-serif', opacity: 0.55 }}
              >
                <Hash className="h-3 w-3" /> CEP
              </label>
              <input
                id="cep"
                type="text"
                value={cep}
                maxLength={9}
                placeholder="00000-000"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                style={{
                  border: `1.5px solid ${NAV}1A`,
                  background: '#ffffff',
                  color: NAV,
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = BLUE;
                  e.target.style.boxShadow = `0 0 0 3px ${BLUE}25`;
                }}
                onBlur={e => {
                  e.target.style.borderColor = `${NAV}1A`;
                  e.target.style.boxShadow = 'none';
                }}
                onChange={async (e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  const fmt = val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val;
                  setCep(fmt);
                  if (val.length === 8) {
                    try {
                      const res  = await fetch(`https://viacep.com.br/ws/${val}/json/`);
                      const data = await res.json();
                      if (!data.erro)
                        setAddress(`${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`);
                    } catch { }
                  }
                }}
              />
              <p className="text-[11px] opacity-35" style={{ color: NAV }}>
                Digite o CEP para preencher o endereço automaticamente.
              </p>
            </div>

            <Field label="Endereço" id="address" icon={MapPin}
              value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Rua, bairro, cidade - UF" />

            <Field label="Número" id="address_number" icon={Hash}
              value={addressNumber} onChange={e => setAddressNumber(e.target.value)}
              placeholder="Número ou S/N" />

            {/* Divider */}
            <div className="pt-1 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: `${NAV}0C` }} />
            </div>

            <PrimaryBtn
              onClick={handleSaveProfile}
              disabled={savingProfile}
              loading={savingProfile}
              loadingLabel="Salvando..."
              label="Salvar Dados"
              icon={Save}
            />
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════
            ALTERAR SENHA
        ═════════════════════════════════════════════════════ */}
        <Section
          icon={Lock}
          iconBg={`${NAV}12`}
          iconColor={NAV}
          accentColor={NAV}
          title="Alterar Senha"
        >
          <div className="space-y-4">
            <Field label="Nova senha" id="newPassword" type="password"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" />

            <Field label="Confirmar nova senha" id="confirmPassword" type="password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha" />

            <div className="pt-1">
              <OutlineBtn
                onClick={handleChangePassword}
                disabled={savingPassword}
                loading={savingPassword}
                loadingLabel="Alterando..."
                label="Alterar Senha"
                icon={Lock}
              />
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════
            BRAND FOOTER STRIP
        ═════════════════════════════════════════════════════ */}
        <div
          className="rounded-xl px-6 py-4 flex items-center gap-3"
          style={{ background: `${NAV}06`, border: `1px solid ${NAV}0A` }}
        >
          <img
            src="/logo-nab.png"
            alt="NAB"
            className="w-6 h-6 object-contain opacity-40"
          />
          <p
            className="text-[11px] opacity-40"
            style={{ color: NAV, fontFamily: "'Be Vietnam Pro', sans-serif" }}
          >
            Novos Autores do Brasil · Plataforma de Coautores
          </p>
        </div>

      </div>
    </>
  );
};

export default CoauthorSettingsPage;
