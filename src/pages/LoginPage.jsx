import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoSimbol from '@/assets/logo-simbolo.png';
import { BeamsBackground } from '@/components/ui/beams-background';

/* ─── brand tokens ─── */
const NAV  = '#001B36';
const BLUE = '#3F7DB0';
const RED  = '#AC1B00';

const ROLE_DESTINATIONS = {
  COAUTOR:     '/coauthor/dashboard',
  COORDENADOR: '/coordinator/dashboard',
  LIDER:       '/leader/dashboard',
  GESTOR:      '/manager/dashboard',
  CS:          '/cs/dashboard',
  VENDEDOR:    '/vendedor/dashboard',
  ADMIN:       '/app/dashboard',
};


export default function LoginPage() {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wordIndex,  setWordIndex]  = useState(0);

  const rotatingWords = useMemo(() => [
    'referências',
    'autoridades',
    'bestsellers',
    'legados',
  ], []);

  useEffect(() => {
    const id = setTimeout(() => {
      setWordIndex(i => (i + 1) % rotatingWords.length);
    }, 2200);
    return () => clearTimeout(id);
  }, [wordIndex, rotatingWords]);

  const { login, error, user, loading } = useAuth();
  const navigate = useNavigate();

  /* redirect when user is set (after profile fetch) */
  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'COORDENADOR' && !user.password_changed) {
        navigate('/change-password', { replace: true });
      } else {
        navigate(ROLE_DESTINATIONS[user.role] || '/app/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const doLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const em = email;
    const pw = password;
    try {
      await login(em, pw);
      /* redirect happens via useEffect above */
    } catch {
      setSubmitting(false);
    }
  };

  const isLoading = submitting || loading;

  /* ── shared field style ── */
  const field = {
    width: '100%', padding: '13px 16px', borderRadius: 14,
    border: `1.5px solid #E2E8F0`, color: NAV, background: '#F8FAFC',
    fontSize: 14, fontFamily: "'Be Vietnam Pro', sans-serif",
    outline: 'none', transition: 'border-color .15s, box-shadow .15s, background .15s',
    boxSizing: 'border-box',
  };
  const onFocus = e => {
    e.target.style.borderColor = BLUE;
    e.target.style.boxShadow   = `0 0 0 4px ${BLUE}14`;
    e.target.style.background  = '#fff';
  };
  const onBlur = e => {
    e.target.style.borderColor = '#E2E8F0';
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = '#F8FAFC';
  };

  return (
    <>
      <Helmet>
        <title>Entrar — Novos Autores do Brasil</title>
      </Helmet>

      <div style={{
        display: 'flex', minHeight: '100vh',
        fontFamily: "'Be Vietnam Pro', sans-serif",
      }}>

        {/* ════════════════════════════════════
            LEFT PANEL — dark brand side
        ════════════════════════════════════ */}
        <div style={{
          flex: '0 0 48%', background: NAV,
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 56px',
        }} className="hidden lg:flex">

          {/* beams background — fills the whole panel */}
          <BeamsBackground intensity="medium" />

          {/* top: wordmark */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={logoSimbol}
                alt="NAB"
                style={{ width: 44, height: 44, objectFit: 'contain', filter: 'brightness(1.1)' }}
              />
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: `rgba(255,255,255,0.45)`,
                  lineHeight: 1,
                }}>
                  Plataforma
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 800, color: 'white',
                  fontFamily: 'Poppins, sans-serif', lineHeight: 1.2, marginTop: 2,
                }}>
                  Novos Autores do Brasil
                </div>
              </div>
            </div>
          </div>

          {/* center: lion watermark + headline */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            {/* large lion watermark behind text */}
            <img
              src={logoSimbol}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 320, height: 320, objectFit: 'contain',
                opacity: 0.07,
                filter: 'brightness(2) saturate(0)',
                pointerEvents: 'none',
                animation: 'nab-floatlogo 10s ease-in-out infinite',
              }}
            />
            <h1 style={{
              fontSize: 40, fontWeight: 900, color: 'white',
              fontFamily: 'Poppins, sans-serif', lineHeight: 1.15,
              letterSpacing: '-0.5px', margin: 0,
              position: 'relative', zIndex: 1,
            }}>
              Transformando<br />
              <span style={{ color: RED }}>autores</span> em
              {/* animated last word */}
              <span style={{
                display: 'block',
                height: '1.2em',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    style={{
                      display: 'block',
                      color: 'white',
                    }}
                    initial={{ y: 48, opacity: 0 }}
                    animate={{ y: 0,  opacity: 1 }}
                    exit={{   y: -48, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  >
                    {rotatingWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
          </div>

          {/* bottom spacer */}
          <div style={{ position: 'relative', zIndex: 1 }} />
        </div>

        {/* ════════════════════════════════════
            RIGHT PANEL — form side
        ════════════════════════════════════ */}
        <div style={{
          flex: 1, background: '#F0F4F8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 24px',
          position: 'relative',
        }}>
          {/* subtle top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${RED}, ${BLUE})`,
          }} />

          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* mobile: logo row */}
            <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <img src={logoSimbol} alt="NAB" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: NAV, fontFamily: 'Poppins, sans-serif' }}>
                Novos Autores do Brasil
              </div>
            </div>

            {/* card */}
            <div style={{
              background: 'white', borderRadius: 24,
              padding: '40px 40px 36px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 40px rgba(0,27,54,0.10)',
            }}>

              {/* heading */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{
                  fontSize: 26, fontWeight: 800, color: NAV,
                  fontFamily: 'Poppins, sans-serif', margin: '0 0 6px',
                  lineHeight: 1.2,
                }}>
                  Bem-vindo a Novos Autores
                </h2>
              </div>

              {/* error */}
              {error && (
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: 12, marginBottom: 20,
                  background: `${RED}0c`, border: `1.5px solid ${RED}28`,
                }}>
                  <AlertCircle style={{ width: 15, height: 15, color: RED, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: RED, margin: 0, lineHeight: 1.5 }}>{error}</p>
                </div>
              )}


              {/* form */}
              <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* email */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: `${NAV}85`, marginBottom: 8,
                  }}>
                    E-mail
                  </label>
                  <input
                    type="email" autoComplete="email"
                    placeholder="seu@email.com" required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={field}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {/* password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{
                      fontSize: 12, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: `${NAV}85`,
                    }}>
                      Senha
                    </label>
                    <button
                      type="button"
                      style={{
                        fontSize: 12, color: BLUE, background: 'none',
                        border: 'none', cursor: 'pointer', padding: 0,
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                      }}
                      onClick={() => alert('🚧 Em desenvolvimento')}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••" required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ ...field, paddingRight: 48 }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowPwd(v => !v)}
                      style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: `${NAV}70`, display: 'flex', padding: 2,
                        transition: 'color .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = `${NAV}80`; }}
                      onMouseLeave={e => { e.currentTarget.style.color = `${NAV}70`; }}
                    >
                      {showPwd
                        ? <EyeOff style={{ width: 17, height: 17 }} />
                        : <Eye    style={{ width: 17, height: 17 }} />}
                    </button>
                  </div>
                </div>

                {/* submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    marginTop: 4,
                    width: '100%', padding: '14px 0',
                    borderRadius: 14, border: 'none',
                    background: isLoading
                      ? `${NAV}85`
                      : `linear-gradient(135deg, ${RED} 0%, #c42200 100%)`,
                    color: 'white', fontSize: 15, fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: isLoading ? 'none' : `0 6px 20px ${RED}40`,
                    transition: 'all .2s',
                    letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${RED}50`; } }}
                  onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 6px 20px ${RED}40`; } }}
                >
                  {isLoading ? (
                    <>
                      <span style={{
                        display: 'inline-block', width: 16, height: 16,
                        borderRadius: '50%', border: '2.5px solid transparent',
                        borderTopColor: 'white', animation: 'nab-spin .7s linear infinite',
                      }} />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight style={{ width: 17, height: 17 }} />
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* footer */}
            <p style={{
              textAlign: 'center', marginTop: 28,
              fontSize: 12, color: `${NAV}70`,
            }}>
              © 2026 Novos Autores do Brasil. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nab-spin { to { transform: rotate(360deg); } }
        @keyframes nab-floatlogo {
          0%, 100% { transform: translate(-50%, -50%) scale(1)    rotate(0deg); }
          33%       { transform: translate(-50%, -52%) scale(1.04) rotate(1deg); }
          66%       { transform: translate(-50%, -48%) scale(0.97) rotate(-1deg); }
        }
      `}</style>
    </>
  );
}
