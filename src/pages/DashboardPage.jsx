
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import CoauthorDashboard from './CoauthorDashboard';
import { Navigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'COORDENADOR':
      return <CoordinatorDashboard />;
    case 'COAUTOR':
      return <CoauthorDashboard />;
    default:
      return <div className="p-8">Papel de usuário não reconhecido.</div>;
  }
};

export default DashboardPage;
