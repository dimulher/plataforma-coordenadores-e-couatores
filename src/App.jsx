
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';

// Login Pages (por role)
import CoauthorLoginPage from '@/pages/CoauthorLoginPage';
import CoordinatorLoginPage from '@/pages/CoordinatorLoginPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import LoginPage from '@/pages/LoginPage'; // fallback /login

// Common & Admin Pages
import DashboardPage from '@/pages/DashboardPage';
import LeadsPage from '@/pages/LeadsPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ChaptersPage from '@/pages/ChaptersPage';
import ChapterEditorPage from '@/pages/ChapterEditorPage';
import AdminChapterReviewPage from '@/pages/AdminChapterReviewPage';
import AdminCoordinatorsPage from '@/pages/AdminCoordinatorsPage';
import AdminCoordinatorDetailPage from '@/pages/AdminCoordinatorDetailPage';
import AdminCoauthorsPage from '@/pages/AdminCoauthorsPage';
import AdminCoauthorDetailPage from '@/pages/AdminCoauthorDetailPage';
import AdminChaptersPage from '@/pages/AdminChaptersPage';
import AdminProjectDetailPage from '@/pages/AdminProjectDetailPage';
import AdminSiteRequestsPage from '@/pages/AdminSiteRequestsPage';
import AdminAnnouncementsPage from '@/pages/AdminAnnouncementsPage';
import CoursePage from '@/pages/CoursePage';
import AnnouncementsPage from '@/pages/AnnouncementsPage';
import MentorshipPage from '@/pages/MentorshipPage';
import RankingPage from '@/pages/RankingPage';
import FinancePage from '@/pages/FinancePage';
import SettingsPage from '@/pages/SettingsPage';

// Coordinator Pages
import CoordinatorDashboard from '@/pages/CoordinatorDashboard';
import CoordinatorFunnelPage from '@/pages/CoordinatorFunnelPage';
import CoordinatorCoauthorsPage from '@/pages/CoordinatorCoauthorsPage';
import CoordinatorCoauthorDetailPage from '@/pages/CoordinatorCoauthorDetailPage';
import CoordinatorCommissions from '@/pages/CoordinatorCommissions';
import CoordinatorRanking from '@/pages/CoordinatorRanking';
import CoordinatorLeads from '@/pages/CoordinatorLeads';
import CoordinatorLinkPage from '@/pages/CoordinatorLinkPage';
import CoordinatorSettingsPage from '@/pages/CoordinatorSettingsPage';
import GestorDashboard from '@/pages/GestorDashboard';
import GestorCoordinatorsPage from '@/pages/GestorCoordinatorsPage';
import GestorSettingsPage from '@/pages/GestorSettingsPage';
import GestorFunnelPage from '@/pages/GestorFunnelPage';
import CoordinatorInvitePage from '@/pages/CoordinatorInvitePage';
import CoauthorRegisterPage from '@/pages/CoauthorRegisterPage';
import CoauthorRegisterSPPage from '@/pages/CoauthorRegisterSPPage';

// Coauthor Pages
import CoauthorDashboard from '@/pages/CoauthorDashboard';
import CoauthorProjectsPage from '@/pages/CoauthorProjectsPage';
import CoauthorChaptersPage from '@/pages/CoauthorChaptersPage';
import CoauthorChapterEditorPage from '@/pages/CoauthorChapterEditorPage';
import CoauthorSettingsPage from '@/pages/CoauthorSettingsPage';

// Redirect to role-specific dashboard or login page
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
  if (!user) return <Navigate to="/login/coautor" replace />;
  if (user.role === 'COAUTOR') return <Navigate to="/coauthor/dashboard" replace />;
  if (user.role === 'GESTOR') return <Navigate to="/manager/dashboard" replace />;
  if (user.role === 'COORDENADOR') return <Navigate to="/coordinator/dashboard" replace />;
  return <Navigate to="/app/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Role-specific login pages */}
      <Route path="/login/coautor" element={<CoauthorLoginPage />} />
      <Route path="/login/coordenador" element={<CoordinatorLoginPage />} />
      <Route path="/login/admin" element={<AdminLoginPage />} />
      <Route path="/login" element={<Navigate to="/login/coautor" replace />} />
      <Route path="/register/coordinator/:managerId" element={<CoordinatorInvitePage />} />
      <Route path="/register/coordinator/:managerId/:projectId" element={<CoordinatorInvitePage />} />
      <Route path="/register/coautor/:coordinatorId" element={<CoauthorRegisterPage />} />
      <Route path="/register/autor-sp/:coordinatorId" element={<CoauthorRegisterSPPage />} />

      {/* Main App Routes (Admin) */}
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leads" element={<ProtectedRoute requiredRoles={['ADMIN']}><LeadsPage /></ProtectedRoute>} />
        <Route path="admin/coordinators" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminCoordinatorsPage /></ProtectedRoute>} />
        <Route path="admin/coordinators/:coordinatorId" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminCoordinatorDetailPage /></ProtectedRoute>} />
        <Route path="admin/coauthors" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminCoauthorsPage /></ProtectedRoute>} />
        <Route path="admin/coauthors/:coauthorId" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminCoauthorDetailPage /></ProtectedRoute>} />
        <Route path="admin/chapters" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminChaptersPage /></ProtectedRoute>} />
        <Route path="admin/chapters/:chapterId/review" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminChapterReviewPage /></ProtectedRoute>} />
        <Route path="admin/projects/:projectId" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminProjectDetailPage /></ProtectedRoute>} />
        <Route path="admin/site-requests" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminSiteRequestsPage /></ProtectedRoute>} />
        <Route path="admin/announcements" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminAnnouncementsPage /></ProtectedRoute>} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="chapters" element={<ChaptersPage />} />
        <Route path="chapters/:chapterId/edit" element={<ProtectedRoute requiredRoles={['COAUTOR', 'ADMIN']}><ChapterEditorPage /></ProtectedRoute>} />
        <Route path="course" element={<CoursePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="mentorship" element={<MentorshipPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="settings" element={<ProtectedRoute requiredRoles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />
      </Route>

      {/* Coordinator Routes */}
      <Route path="/coordinator" element={<ProtectedRoute requiredRoles={['COORDENADOR', 'ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<CoordinatorDashboard />} />
        <Route path="funnel" element={<CoordinatorFunnelPage />} />
        <Route path="coauthors" element={<CoordinatorCoauthorsPage />} />
        <Route path="coauthors/:coauthorId" element={<CoordinatorCoauthorDetailPage />} />
        <Route path="commissions" element={<CoordinatorCommissions />} />
        <Route path="ranking" element={<CoordinatorRanking />} />
        <Route path="leads" element={<CoordinatorLeads />} />
        <Route path="link" element={<CoordinatorLinkPage />} />
        <Route path="settings" element={<CoordinatorSettingsPage />} />
      </Route>

      {/* Gestor Routes */}
      <Route path="/manager" element={<ProtectedRoute requiredRoles={['GESTOR', 'ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<GestorDashboard />} />
        <Route path="coordinators" element={<GestorCoordinatorsPage />} />
        <Route path="coordinators/:coordinatorId" element={<GestorFunnelPage />} />
        <Route path="relatorio" element={<GestorFunnelPage />} />
        <Route path="settings" element={<GestorSettingsPage />} />
      </Route>

      {/* Coauthor Routes */}
      <Route path="/coauthor" element={<ProtectedRoute requiredRoles={['COAUTOR', 'COORDENADOR', 'GESTOR', 'ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<CoauthorDashboard />} />
        <Route path="projects" element={<CoauthorProjectsPage />} />
        <Route path="chapters" element={<CoauthorChaptersPage />} />
        <Route path="chapters/:chapterId/edit" element={<CoauthorChapterEditorPage />} />
        <Route path="course" element={<CoursePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="mentorship" element={<MentorshipPage />} />
        <Route path="settings" element={<CoauthorSettingsPage />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
