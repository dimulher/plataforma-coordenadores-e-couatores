
/**
 * Shared login shell — used by CoauthorLoginPage, CoordinatorLoginPage, AdminLoginPage.
 * Applies the Novos Autores do Brasil brand identity.
 */
import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const NAV   = '#001B36';
const BLUE  = '#3F7DB0';
const RED   = '#AC1B00';
const CREAM = '#F5F5D9';

const LoginLayout = ({
  title,
  subtitle,
  icon: Icon,
  accentColor = RED,
  error,
  isLoading,
  onSubmit,
  links = [],       // [{ to, label, primary }]
}) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: NAV }}
    >
      {/* ── Decorative background shapes ────────────────────── */}
      {/* Large blue ellipse — top right */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
        style={{ background: BLUE }}
      />
      {/* Red star — bottom left */}
      <div
        className="absolute -bottom-16 -left-16 w-56 h-56 opacity-[0.07]"
        style={{
          background: RED,
          clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
        }}
      />
      {/* Cream glow — center bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 opacity-[0.04] rounded-full"
        style={{ background: CREAM, filter: 'blur(48px)' }}
      />
      {/* Thin colored stripe at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${RED} 0%, ${BLUE} 50%, ${RED} 100%)` }}
      />

      {/* ── Card ──────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-[420px] rounded-2xl p-8"
        style={{
          background: '#ffffff',
          boxShadow: `0 24px 64px ${NAV}85, 0 0 0 1px ${NAV}18`,
        }}
      >
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-8">
          {/* Brand logo */}
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: NAV,
              boxShadow: `0 4px 16px ${NAV}70`,
            }}
          >
            <img src="/logo-nab.png" alt="NAB" className="w-8 h-8 object-contain" />
          </div>

          {/* Brand name */}
          <p
            className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1"
            style={{ color: BLUE, fontFamily: 'Poppins, sans-serif' }}
          >
            Novos Autores do Brasil
          </p>

          {/* Portal title */}
          <h1
            className="text-[22px] font-bold text-center leading-tight"
            style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-sm mt-1 text-center opacity-50"
              style={{ color: NAV, fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Role icon pill */}
        {Icon && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-full mx-auto w-fit mb-6"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}25` }}
          >
            <Icon className="h-4 w-4" style={{ color: accentColor }} />
            <span
              className="text-xs font-semibold"
              style={{ color: accentColor, fontFamily: 'Poppins, sans-serif' }}
            >
              {subtitle || title}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="mb-5 p-3.5 rounded-xl flex items-start gap-2.5"
            style={{ background: `${RED}0C`, border: `1px solid ${RED}25` }}
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: RED }} />
            <p className="text-sm" style={{ color: RED, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: NAV, opacity: 0.55, fontFamily: 'Poppins, sans-serif' }}
            >
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150"
              style={{
                border: `1.5px solid ${NAV}18`,
                background: '#ffffff',
                color: NAV,
                fontFamily: "'Be Vietnam Pro', sans-serif",
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}20`; }}
              onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: NAV, opacity: 0.55, fontFamily: 'Poppins, sans-serif' }}
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm transition-all duration-150"
                style={{
                  border: `1.5px solid ${NAV}18`,
                  background: '#ffffff',
                  color: NAV,
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}20`; }}
                onBlur={e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: `${NAV}70` }}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
                       text-white transition-all duration-150 active:scale-[0.98] mt-2
                       disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: accentColor,
              fontFamily: 'Poppins, sans-serif',
              boxShadow: `0 4px 16px ${accentColor}45`,
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.filter = 'brightness(0.88)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
          >
            {isLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>
              : <><LogIn className="h-4 w-4" /> Entrar</>}
          </button>
        </form>

        {/* Links */}
        {links.length > 0 && (
          <div
            className="mt-6 pt-5 flex flex-col items-center gap-1.5"
            style={{ borderTop: `1px solid ${NAV}0C` }}
          >
            {links.map((link, i) => (
              <a
                key={i}
                href={link.to}
                className="text-sm transition-colors"
                style={{
                  color: link.primary ? BLUE : `${NAV}72`,
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontWeight: link.primary ? 600 : 400,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = link.primary ? NAV : `${NAV}80`; }}
                onMouseLeave={e => { e.currentTarget.style.color = link.primary ? BLUE : `${NAV}72`; }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginLayout;
