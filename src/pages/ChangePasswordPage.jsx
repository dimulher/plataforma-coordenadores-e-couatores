import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { NAV, BLUE } from '@/lib/brand';

const ChangePasswordPage = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');

  const strength = (() => {
    if (newPassword.length === 0) return 0;
    let s = 0;
    if (newPassword.length >= 8)          s++;
    if (/[A-Z]/.test(newPassword))        s++;
    if (/[0-9]/.test(newPassword))        s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Fraca', 'Média', 'Boa', 'Forte'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return; }
    if (newPassword === 'Mudar123@') { setError('A nova senha não pode ser igual à senha padrão.'); return; }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem.'); return; }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      await supabase.from('profiles').update({ password_changed: true, otp_password: null }).eq('id', user.id);
      await refreshProfile();

      toast({ title: 'Senha alterada com sucesso!', description: 'Você será redirecionado para o painel.' });

      const role = user?.role;
      if (role === 'COORDENADOR')      navigate('/coordinator/dashboard');
      else if (role === 'COAUTOR')     navigate('/coauthor/dashboard');
      else if (role === 'ADMIN')       navigate('/admin/dashboard');
      else if (role === 'LIDER')       navigate('/manager/dashboard');
      else                             navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao alterar senha.');
    } finally {
      setSaving(false);
    }
  };

  const inputBase = {
    border: `1.5px solid ${NAV}20`,
    color: NAV,
    outline: 'none',
    background: 'white',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NAV} 0%, #0d3a6e 100%)` }}>
      <Helmet><title>Alterar Senha — Novos Autores do Brasil</title></Helmet>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: BLUE }} />

        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2" style={{ background: `${BLUE}15` }}>
              <ShieldCheck className="w-7 h-7" style={{ color: BLUE }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Crie sua senha</h1>
            <p className="text-sm" style={{ color: `${NAV}80` }}>
              Por segurança, defina uma senha pessoal antes de continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}70` }}>Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${NAV}50` }} />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm"
                  style={inputBase}
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                  onBlur={e => { e.target.style.borderColor = `${NAV}20`; e.target.style.boxShadow = 'none'; }}
                  required
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: `${NAV}50` }}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : `${NAV}12` }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}70` }}>Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${NAV}50` }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm"
                  style={inputBase}
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                  onBlur={e => { e.target.style.borderColor = `${NAV}20`; e.target.style.boxShadow = 'none'; }}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: `${NAV}50` }}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium px-3 py-2 rounded-lg" style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: BLUE, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {saving ? 'Salvando...' : 'Confirmar Nova Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
