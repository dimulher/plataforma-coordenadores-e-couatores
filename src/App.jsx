
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';

// Unified login page
import LoginPage from '@/pages/LoginPage';

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
import AdminReportsPage from '@/pages/AdminReportsPage';
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
import GestorVendedoresPage from '@/pages/GestorVendedoresPage';
import CSDashboard from '@/pages/CSDashboard';
import CSCoauthorsPage from '@/pages/CSCoauthorsPage';
import CSSettingsPage from '@/pages/CSSettingsPage';
import VendedorDashboard from '@/pages/VendedorDashboard';
import VendedorLeadsPage from '@/pages/VendedorLeadsPage';
import VendedorLinksPage from '@/pages/VendedorLinksPage';
import VendedorSettingsPage from '@/pages/VendedorSettingsPage';
import CoordinatorInvitePage from '@/pages/CoordinatorInvitePage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import CoauthorRegisterPage from '@/pages/CoauthorRegisterPage';
import CoauthorRegisterSPPage from '@/pages/CoauthorRegisterSPPage';

// Coauthor Pages
import CoauthorDashboard from '@/pages/CoauthorDashboard';
import CoauthorProjectsPage from '@/pages/CoauthorProjectsPage';
import CoauthorChaptersPage from '@/pages/CoauthorChaptersPage';
import CoauthorChapterEditorPage from '@/pages/CoauthorChapterEditorPage';
import CoauthorSettingsPage from '@/pages/CoauthorSettingsPage';
import CoauthorIdentityPage from '@/pages/CoauthorIdentityPage';

// Redirect to role-specific dashboard or login page
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'COAUTOR')    return <Navigate to="/coauthor/dashboard"    replace />;
  if (user.role === 'LIDER')      return <Navigate to="/leader/dashboard"      replace />;
  if (user.role === 'GESTOR')     return <Navigate to="/manager/dashboard"     replace />;
  if (user.role === 'CS')         return <Navigate to="/cs/dashboard"          replace />;
  if (user.role === 'VENDEDOR')   return <Navigate to="/vendedor/dashboard"    replace />;
  if (user.role === 'COORDENADOR') return <Navigate to="/coordinator/dashboard" replace />;
  return <Navigate to="/app/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Login — unified page for all roles */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/coautor" element={<LoginPage />} />
      <Route path="/login/coordenador" element={<LoginPage />} />
      <Route path="/login/admin" element={<LoginPage />} />
      <Route path="/register/coordinator/:managerId" element={<CoordinatorInvitePage />} />
      <Route path="/register/coordinator/:managerId/:projectId" element={<CoordinatorInvitePage />} />
      <Route path="/register/coautor/:coordinatorId" element={<CoauthorRegisterPage />} />
      <Route path="/register/autor-sp/:coordinatorId" element={<CoauthorRegisterSPPage />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

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
        <Route path="admin/reports" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminReportsPage /></ProtectedRoute>} />
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
        <Route path="identity" element={<CoauthorIdentityPage />} />
        <Route path="settings" element={<CoordinatorSettingsPage />} />
      </Route>

      {/* LIDER (Líder de Coordenação) Routes */}
      <Route path="/leader" element={<ProtectedRoute requiredRoles={['LIDER', 'ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<GestorDashboard />} />
        <Route path="coordinators" element={<GestorCoordinatorsPage />} />
        <Route path="coordinators/:coordinatorId" element={<GestorFunnelPage />} />
        <Route path="relatorio"  element={<GestorFunnelPage />} />
        <Route path="settings"   element={<GestorSettingsPage />} />
      </Route>

      {/* GESTOR (nível topo) Routes */}
      <Route path="/manager" element={<ProtectedRoute requiredRoles={['GESTOR', 'ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard"  element={<GestorDashboard />} />
        <Route path="lideres"    element={<GestorCoordinatorsPage />} />
        <Route path="vendedores" element={<GestorVendedoresPage />} />
        <Route path="settings"   element={<GestorSettingsPage />} />
      </Route>

      {/* CS Routes */}
      <Route path="/cs" element={<ProtectedRoute requiredRoles={['CS', 'ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard"  element={<CSDashboard />} />
        <Route path="coauthors"  element={<CSCoauthorsPage />} />
        <Route path="settings"   element={<CSSettingsPage />} />
      </Route>

      {/* Vendedor Routes */}
      <Route path="/vendedor" element={<ProtectedRoute requiredRoles={['VENDEDOR', 'ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard"  element={<VendedorDashboard />} />
        <Route path="leads"      element={<VendedorLeadsPage />} />
        <Route path="links"      element={<VendedorLinksPage />} />
        <Route path="settings"   element={<VendedorSettingsPage />} />
      </Route>

      {/* Coauthor Routes */}
      <Route path="/coauthor" element={<ProtectedRoute requiredRoles={['COAUTOR', 'COORDENADOR', 'LIDER', 'GESTOR', 'ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<CoauthorDashboard />} />
        <Route path="projects" element={<CoauthorProjectsPage />} />
        <Route path="chapters" element={<CoauthorChaptersPage />} />
        <Route path="chapters/:chapterId/edit" element={<CoauthorChapterEditorPage />} />
        <Route path="course" element={<CoursePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="mentorship" element={<MentorshipPage />} />
        <Route path="settings" element={<CoauthorSettingsPage />} />
        <Route path="identity" element={<CoauthorIdentityPage />} />
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
