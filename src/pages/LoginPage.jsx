
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, AlertCircle } from 'lucide-react';
import { isPreviewEnvironment } from '@/utils/environment';
import QuickLoginButtons from '@/components/QuickLoginButtons';

/*
 * TESTING INSTRUCTIONS:
 * To test preview mode: Access app normally (localhost:5173 or preview URL). The QuickLoginButtons and manual credentials will be visible.
 * To test production mode: Temporarily change the logic in `src/utils/environment.js` to return `false`, or deploy to a production domain. 
 * Expected: The QuickLoginButtons and the manual demo credentials section should NOT appear.
 */

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (loginEmail, loginPassword) => {
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginSubmit(email, password);
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    
    // Slight delay to allow state to update visually if needed
    setTimeout(() => {
      handleLoginSubmit(quickEmail, quickPassword);
    }, 50);
  };

  return (
    <>
      <Helmet>
        <title>Login - NAB Platform</title>
        <meta name="description" content="Acesse a plataforma NAB - Novos Autores do Brasil" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-[#0E1A32] p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B82F6] rounded-full mb-4">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-[#0E1A32] mb-2">
                Bem-vindo ao NAB
              </h1>
              <p className="text-gray-600">
                Novos Autores do Brasil
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Demo login buttons only shown in preview environment */}
            {isPreviewEnvironment() && (
              <QuickLoginButtons onQuickLogin={handleQuickLogin} />
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-6 text-lg font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Demo credentials only visible in preview mode - production environment hides this section */}
            {isPreviewEnvironment() && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Credenciais de demonstração (Manuais):</p>
                <div className="space-y-1 text-xs text-blue-800">
                  <p>👑 Admin: admin@nab.com / admin123</p>
                  <p>🎯 Coordenador: coordenador@nab.com / coord123</p>
                  <p>✍️ Coautor: coautor@nab.com / coautor123</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm text-[#3B82F6] hover:underline"
                onClick={() => alert('🚧 Funcionalidade em desenvolvimento')}
              >
                Esqueceu sua senha?
              </button>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            © 2026 Novos Autores do Brasil. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
