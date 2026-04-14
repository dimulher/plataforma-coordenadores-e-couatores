
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoginLayout from '@/components/LoginLayout';

const CoordinatorLoginPage = () => {
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
      <Helmet><title>Portal do Coordenador — Novos Autores do Brasil</title></Helmet>
      <LoginLayout
        title="Portal do Coordenador"
        subtitle="Gerencie sua equipe de coautores"
        icon={Users}
        accentColor="#3F7DB0"
        error={error}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        links={[
          { to: '/login/coautor', label: 'Sou Coautor →', primary: true },
          { to: '/login/admin',   label: 'Acesso Administrativo' },
        ]}
      />
    </>
  );
};

export default CoordinatorLoginPage;
