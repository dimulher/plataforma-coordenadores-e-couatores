
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PenLine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoginLayout from '@/components/LoginLayout';

const CoauthorLoginPage = () => {
  const [isLoading, setIsLoading]         = useState(false);
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
      <Helmet><title>Portal do Coautor — Novos Autores do Brasil</title></Helmet>
      <LoginLayout
        title="Portal do Coautor"
        subtitle="Acesse sua área de escrita"
        icon={PenLine}
        accentColor="#AC1B00"
        error={error}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        links={[
          { to: '/login/coordenador', label: 'Sou Coordenador →', primary: true },
          { to: '/login/admin',       label: 'Acesso Administrativo' },
        ]}
      />
    </>
  );
};

export default CoauthorLoginPage;
