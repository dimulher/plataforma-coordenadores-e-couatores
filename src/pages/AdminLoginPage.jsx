import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, AlertCircle, Shield } from 'lucide-react';

const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginAttempted, setLoginAttempted] = useState(false);
    const { login, error, user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loginAttempted && !loading && user) {
            setIsLoading(false);
            navigate('/', { replace: true });
        }
    }, [user, loading, loginAttempted, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            setLoginAttempted(true);
        } catch (err) {
            console.error('Login failed:', err);
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Login Admin - NAB Platform</title>
            </Helmet>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800">Acesso Administrativo</h1>
                            <p className="text-slate-500 mt-1">Novos Autores do Brasil</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <Label htmlFor="email" className="text-slate-700">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@email.com"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="password" className="text-slate-700">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-6 text-base font-semibold"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Entrando...</span>
                                    </div>
                                ) : (
                                    <><LogIn className="h-5 w-5 mr-2" /> Entrar</>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm space-y-2">
                            <p><Link to="/login/coautor" className="text-blue-600 hover:underline font-medium">Portal do Coautor</Link></p>
                            <p><Link to="/login/coordenador" className="text-purple-600 hover:underline font-medium">Portal do Coordenador</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLoginPage;
