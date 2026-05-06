import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Mail, ShieldCheck, Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import { NAV, BLUE } from '@/lib/brand';

const SEND_OTP_WEBHOOK = 'https://n8n.prosperamentor.com.br/webhook/2cf69aba-953d-43a0-8dad-d7a4f39c7f76';

const FirstAccessPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep]         = useState(1); // 1 = email, 2 = código
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const inputBase = {
    border: `1.5px solid ${NAV}20`,
    color: NAV,
    outline: 'none',
    background: 'white',
  };
  const onFocus = e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; };
  const onBlur  = e => { e.target.style.borderColor = `${NAV}20`; e.target.style.boxShadow = 'none'; };

  // Passo 1 — enviar código via webhook do n8n
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Informe seu e-mail.'); return; }
    setLoading(true);
    try {
      // Confirma que o email existe e tem OTP pendente (RPC não expõe o código)
      const { data: rows, error: profileError } = await supabase
        .rpc('get_profile_for_first_access', { p_email: email.trim() });

      const profile = rows?.[0];

      if (profileError || !profile) {
        setError('E-mail não encontrado. Verifique o endereço informado.');
        return;
      }

      if (profile.password_changed === true) {
        setError('Acesso já configurado. Use a tela de login normal.');
        return;
      }

      if (!profile.has_pending_otp) {
        setError('Código de acesso não encontrado. Entre em contato com seu líder de coordenação.');
        return;
      }

      // Dispara webhook — n8n busca o OTP no Supabase via service key e envia via WhatsApp
      await fetch(SEND_OTP_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: profile.name,
          action: 'send_otp',
        }),
      });

      setStep(2);
      toast({ title: 'Código enviado!', description: 'Verifique seu WhatsApp.' });
    } catch (err) {
      setError('Erro ao enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2 — fazer login com o código recebido
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) { setError('Informe o código recebido.'); return; }
    setLoading(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: code.trim().toUpperCase(),
      });

      if (loginError) {
        setError('Código inválido. Verifique o código recebido no WhatsApp.');
        return;
      }

      // O AuthContext detecta password_changed = false e redireciona para /change-password
      navigate('/change-password', { replace: true });
    } catch (err) {
      setError('Erro ao verificar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${NAV} 0%, #0d3a6e 100%)` }}>
      <Helmet><title>Primeiro Acesso — Novos Autores do Brasil</title></Helmet>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: BLUE }} />

        <div className="p-8 space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2"
              style={{ background: `${BLUE}15` }}>
              {step === 1
                ? <Mail className="w-7 h-7" style={{ color: BLUE }} />
                : <MessageCircle className="w-7 h-7" style={{ color: '#25D366' }} />
              }
            </div>
            <h1 className="text-2xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>
              {step === 1 ? 'Primeiro Acesso' : 'Verifique seu WhatsApp'}
            </h1>
            <p className="text-sm" style={{ color: `${NAV}75` }}>
              {step === 1
                ? 'Informe seu e-mail para receber o código de acesso no WhatsApp.'
                : `Enviamos um código para o WhatsApp cadastrado com ${email}. Digite-o abaixo.`
              }
            </p>
          </div>

          {/* Step 1 — Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}70` }}>E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${NAV}50` }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-sm"
                    style={inputBase}
                    onFocus={onFocus} onBlur={onBlur}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm font-medium px-3 py-2 rounded-lg"
                  style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: BLUE, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                {loading ? 'Enviando...' : 'Enviar Código no WhatsApp'}
              </button>
            </form>
          )}

          {/* Step 2 — Código */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}70` }}>Código de Verificação</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  placeholder="Ex: K7NX3QBH"
                  className="w-full px-4 py-3 rounded-xl text-center text-xl font-bold tracking-widest"
                  style={{ ...inputBase, letterSpacing: '0.25em' }}
                  onFocus={onFocus} onBlur={onBlur}
                  maxLength={8}
                  required
                />
                <p className="text-xs text-center" style={{ color: `${NAV}60` }}>
                  Não recebeu?{' '}
                  <button type="button" onClick={() => { setStep(1); setCode(''); setError(''); }}
                    className="font-semibold underline" style={{ color: BLUE }}>
                    Reenviar
                  </button>
                </p>
              </div>

              {error && (
                <p className="text-sm font-medium px-3 py-2 rounded-lg"
                  style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: BLUE, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                {loading ? 'Verificando...' : 'Confirmar e Entrar'}
              </button>
            </form>
          )}

          <div className="text-center">
            <Link to="/login" className="text-sm flex items-center justify-center gap-1"
              style={{ color: `${NAV}60` }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstAccessPage;
