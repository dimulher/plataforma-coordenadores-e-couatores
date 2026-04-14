
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoginLayout from '@/components/LoginLayout';

const AdminLoginPage = () => {
  const [isLoading, setIsLoading]           = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const { login, error, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loginAttempted && !loading && user) {
      setIsLoading(false);
      navigate('/', { replace: true });
    }
  }, [user, loading, loginAttempted, navigate]);

  const handleSubmit = async (email, password) => {
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
      <Helmet><title>Acesso Admin — Novos Autores do Brasil</title></Helmet>
      <LoginLayout
        title="Acesso Administrativo"
        subtitle="Área restrita à equipe interna"
        icon={Shield}
        accentColor="#001B36"
        error={error}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        links={[
          { to: '/login/coautor',    label: 'Portal do Coautor →',    primary: true },
          { to: '/login/coordenador', label: 'Portal do Coordenador →', primary: true },
        ]}
      />
    </>
  );
};

export default AdminLoginPage;
