
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserSquare2, FolderKanban, FileText,
  GraduationCap, Megaphone, HeartHandshake as Handshake, Trophy,
  DollarSign, Settings, Menu, X, User, ChevronLeft, ChevronRight,
  Target, Workflow, Lock, Globe, Users2, LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AlertsIndicator from '@/components/AlertsIndicator';

/* ── Brand tokens ───────────────────────────────────────────── */
const NAV   = '#001B36';
const BLUE  = '#3F7DB0';
const RED   = '#AC1B00';
const CREAM = '#F5F5D9';

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout, isCoordinator, isAdmin, isCoautor, isGestor } = useAuth();

  /* ── Nav item lists ──────────────────────────────────────── */
  const adminItems = [
    { path: '/app/dashboard',              icon: LayoutDashboard, label: 'Dashboard Geral' },
    { path: '/app/admin/coordinators',     icon: UserSquare2,     label: 'Coordenadores' },
    { path: '/app/admin/coauthors',        icon: Users2,          label: 'Coautores' },
    { path: '/app/admin/chapters',         icon: FileText,        label: 'Produção Editorial' },
    { path: '/app/admin/site-requests',    icon: Globe,           label: 'Sites Solicitados' },
    { path: '/app/admin/announcements',    icon: Megaphone,       label: 'Avisos' },
  ];

  const generalItems = [
    { path: '/app/dashboard',   icon: LayoutDashboard, label: 'Dashboard Geral',  roles: [] },
    { path: '/app/projects',    icon: FolderKanban,    label: 'Projetos',          roles: [] },
    { path: '/app/chapters',    icon: FileText,        label: 'Meus Capítulos',    roles: ['COAUTOR', 'COORDENADOR'] },
    { path: '/app/course',      icon: GraduationCap,   label: 'Curso',             roles: [] },
    { path: '/app/announcements', icon: Megaphone,     label: 'Avisos',            roles: [] },
    { path: '/app/mentorship',  icon: Handshake,       label: 'Mentoria',          roles: [] },
    { path: '/app/ranking',     icon: Trophy,          label: 'Ranking Geral',     roles: ['ADMIN'] },
    { path: '/app/finance',     icon: DollarSign,      label: 'Financeiro',        roles: ['ADMIN'] },
    { path: '/app/settings',    icon: Settings,        label: 'Configurações',     roles: ['ADMIN'] },
  ];

  const coordinatorItems = [
    { path: '/coordinator/dashboard', icon: Target,    label: 'Meu Painel' },
    { path: '/coordinator/funnel',    icon: Workflow,  label: 'Relatório' },
    { path: '/coordinator/coauthors', icon: Users,     label: 'Meus Coautores' },
    { path: '/coordinator/settings',  icon: Settings,  label: 'Dados de Cadastro' },
  ];

  const managerItems = [
    { path: '/manager/dashboard',    icon: Target,      label: 'Meu Painel' },
    { path: '/manager/coordinators', icon: UserSquare2, label: 'Meus Coordenadores' },
    { path: '/manager/relatorio',    icon: Workflow,    label: 'Relatório de Time' },
    { path: '/manager/settings',     icon: Settings,    label: 'Dados de Cadastro' },
  ];

  const coauthorItems = [
    { path: '/coauthor/dashboard',    icon: LayoutDashboard, label: 'Meu Painel' },
    { path: '/coauthor/projects',     icon: FolderKanban,    label: 'Projetos (Em produção)', disabled: true },
    { path: '/coauthor/chapters',     icon: FileText,        label: 'Meu Capítulo' },
    { path: '/coauthor/course',       icon: GraduationCap,   label: 'Aulas' },
    { path: '/coauthor/announcements', icon: Megaphone,      label: 'Avisos' },
    { path: '/coauthor/mentorship',   icon: Handshake,       label: 'Mentoria' },
    { path: '/coauthor/settings',     icon: Settings,        label: 'Meu Perfil' },
  ];

  const visibleGeneralItems = generalItems.filter(item => {
    const roleMatch = item.roles.length === 0 || item.roles.includes(user?.role);
    if (!roleMatch) return false;
    if ((isCoordinator() || isAdmin() || isGestor()) && item.label === 'Dashboard Geral') return false;
    return true;
  }).map(item => {
    if (isCoordinator()) {
      if (item.label === 'Projetos')       return { ...item, label: 'Projetos (Em produção)', disabled: true };
      if (item.label === 'Meus Capítulos') return { ...item, label: 'Meu Capítulo', path: '/coauthor/chapters' };
    }
    return item;
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActiveRoute = (path) =>
    (location.pathname.startsWith(path) && path !== '/app/dashboard') ||
    location.pathname === path;

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  const getProfilePath = () => {
    if (isCoautor())     return '/coauthor/settings';
    if (isCoordinator()) return '/coordinator/settings';
    if (isGestor())      return '/manager/settings';
    return '/app/settings';
  };

  const getRoleBadge = () => {
    if (isAdmin())       return { label: 'Admin',        color: RED };
    if (isCoordinator()) return { label: 'Coordenador',  color: BLUE };
    if (isCoautor())     return { label: 'Coautor',      color: '#10B981' };
    if (isGestor())      return { label: 'Gestor',       color: '#F59E0B' };
    return { label: user?.role || '', color: BLUE };
  };

  /* ── Nav group renderer ──────────────────────────────────── */
  const renderNavGroup = (items, title) => {
    if (!items.length) return null;
    return (
      <div className="mb-2">
        {!sidebarCollapsed && title && (
          <p
            className="px-4 mb-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: BLUE, fontFamily: 'Poppins, sans-serif' }}
          >
            {title}
          </p>
        )}
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon   = item.icon;
            const active = isActiveRoute(item.path);

            if (item.disabled) {
              return (
                <div
                  key={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl cursor-not-allowed
                    ${sidebarCollapsed ? 'justify-center' : ''}`}
                  style={{ color: `${CREAM}30` }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-[13px] font-medium truncate flex-1">{item.label}</span>
                      <Lock className="h-3 w-3 opacity-40 shrink-0" />
                    </>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-all duration-150
                  ${sidebarCollapsed ? 'justify-center' : ''}`}
                style={
                  active
                    ? { background: RED, color: '#ffffff', boxShadow: `0 2px 8px ${RED}50` }
                    : { color: `${CREAM}99` }
                }
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = CREAM; }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = `${CREAM}99`; } }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <span
                    className="text-[13px] font-medium truncate"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: CREAM }}>

      {/* ── Mobile overlay ──────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ════════════════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-[68px]' : 'w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: NAV }}
      >
        {/* Logo section */}
        <div
          className={`flex items-center h-16 px-4 shrink-0 ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}
          style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}
        >
          <div
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: `${RED}25`, border: `1.5px solid ${RED}50` }}
          >
            <img src="/logo-nab.png" alt="NAB" className="w-5 h-5 object-contain" />
          </div>

          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p
                className="text-[13px] font-bold leading-tight truncate"
                style={{ color: '#ffffff', fontFamily: 'Poppins, sans-serif' }}
              >
                Novos Autores
              </p>
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: `${BLUE}`, fontFamily: 'Poppins, sans-serif' }}
              >
                do Brasil
              </p>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex ml-auto items-center justify-center w-6 h-6 rounded-lg transition-colors"
            style={{ color: `${CREAM}50` }}
            onMouseEnter={e => { e.currentTarget.style.color = CREAM; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = `${CREAM}50`; e.currentTarget.style.background = 'transparent'; }}
          >
            {sidebarCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden ml-auto p-1 rounded-lg"
            style={{ color: `${CREAM}70` }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-1 space-y-4 custom-scrollbar">
          {isAdmin()       && renderNavGroup(adminItems,       'Gestão Admin')}
          {isGestor()      && renderNavGroup(managerItems,     'Área do Gestor')}
          {isCoordinator() && renderNavGroup(coordinatorItems, 'Área do Coordenador')}
          {isCoautor()
            ? renderNavGroup(coauthorItems,      'Área do Autor')
            : renderNavGroup(visibleGeneralItems, 'Plataforma')}
        </nav>

        {/* User footer */}
        <div
          className={`shrink-0 p-3 flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}
          style={{ borderTop: `1px solid rgba(255,255,255,0.07)` }}
        >
          <Avatar
            className="h-8 w-8 shrink-0"
            style={{ border: `2px solid ${BLUE}60` }}
          >
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user?.name} />}
            <AvatarFallback
              className="text-xs font-bold"
              style={{ background: `${BLUE}30`, color: CREAM }}
            >
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>

          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-semibold truncate"
                  style={{ color: CREAM, fontFamily: 'Poppins, sans-serif' }}
                >
                  {user?.name}
                </p>
                <p
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: roleBadge.color }}
                >
                  {roleBadge.label}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg transition-colors shrink-0"
                style={{ color: `${CREAM}40` }}
                title="Sair"
                onMouseEnter={e => { e.currentTarget.style.color = RED; e.currentTarget.style.background = `${RED}15`; }}
                onMouseLeave={e => { e.currentTarget.style.color = `${CREAM}40`; e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════
          MAIN AREA
      ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top header ──────────────────────────────────────── */}
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-6 shrink-0"
          style={{
            background: '#ffffff',
            borderBottom: `1px solid ${NAV}10`,
            boxShadow: `0 1px 8px ${NAV}08`,
          }}
        >
          {/* Left: mobile menu + search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: NAV }}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand mark — visible on mobile when sidebar is hidden */}
            <div className="flex items-center gap-2 lg:hidden">
              <img src="/logo-nab.png" alt="NAB" className="w-6 h-6 object-contain" />
              <span
                className="text-sm font-bold"
                style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}
              >
                NAB
              </span>
            </div>
          </div>

          {/* Right: alerts + user dropdown */}
          <div className="flex items-center gap-2">
            <AlertsIndicator />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-colors"
                  style={{ outline: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${NAV}06`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="hidden md:block text-right">
                    <p
                      className="text-[13px] font-semibold leading-tight"
                      style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}
                    >
                      {user?.name}
                    </p>
                    <p
                      className="text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: roleBadge.color }}
                    >
                      {roleBadge.label}
                    </p>
                  </div>
                  <Avatar
                    className="h-8 w-8"
                    style={{ border: `2px solid ${BLUE}40` }}
                  >
                    {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user?.name} />}
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{ background: NAV, color: CREAM }}
                    >
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-48"
                style={{ background: '#fff', border: `1px solid ${NAV}12` }}
              >
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-sm"
                  style={{ color: NAV, fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  onClick={() => navigate(getProfilePath())}
                >
                  <User className="h-4 w-4" style={{ color: BLUE }} />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 text-sm"
                  style={{ color: RED, fontFamily: "'Be Vietnam Pro', sans-serif" }}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Page content ──────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar"
          style={{ background: CREAM }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
