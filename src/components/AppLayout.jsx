
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserSquare2, FolderKanban, FileText, GraduationCap, Megaphone, HeartHandshake as Handshake, Trophy, DollarSign, Settings, Menu, X, Search, User, ChevronLeft, ChevronRight, Target, KanbanSquare, Wallet, Users2, Workflow, Lock, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AlertsIndicator from '@/components/AlertsIndicator';

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isCoordinator, isAdmin, isCoautor, isGestor } = useAuth();

  const adminItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard Geral' },
    { path: '/app/admin/coordinators', icon: UserSquare2, label: 'Coordenadores' },
    { path: '/app/admin/coauthors', icon: Users2, label: 'Coautores' },
    { path: '/app/admin/chapters', icon: FileText, label: 'Produção Editorial' },
    { path: '/app/admin/site-requests', icon: Globe, label: 'Sites Solicitados' },
    { path: '/app/admin/announcements', icon: Megaphone, label: 'Avisos' },
  ];

  const generalItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard Geral', roles: [] },
    { path: '/app/projects', icon: FolderKanban, label: 'Projetos', roles: [] },
    { path: '/app/chapters', icon: FileText, label: 'Meus Capítulos', roles: ['COAUTOR', 'COORDENADOR'] },
    { path: '/app/course', icon: GraduationCap, label: 'Curso', roles: [] },
    { path: '/app/announcements', icon: Megaphone, label: 'Avisos', roles: [] },
    { path: '/app/mentorship', icon: Handshake, label: 'Mentoria', roles: [] },
    { path: '/app/ranking', icon: Trophy, label: 'Ranking Geral', roles: ['ADMIN'] },
    { path: '/app/finance', icon: DollarSign, label: 'Financeiro', roles: ['ADMIN'] },
    { path: '/app/settings', icon: Settings, label: 'Configurações', roles: ['ADMIN'] },
  ];

  const coordinatorItems = [
    { path: '/coordinator/dashboard', icon: Target, label: 'Meu Painel' },
    { path: '/coordinator/funnel', icon: Workflow, label: 'Relatório' },
    { path: '/coordinator/coauthors', icon: Users, label: 'Meus Coautores' },
    { path: '/coordinator/settings', icon: Settings, label: 'Dados de Cadastro' },
  ];

  const managerItems = [
    { path: '/manager/dashboard', icon: Target, label: 'Meu Painel' },
    { path: '/manager/coordinators', icon: UserSquare2, label: 'Meus Coordenadores' },
    { path: '/manager/relatorio', icon: Workflow, label: 'Relatório de Time' },
    { path: '/manager/settings', icon: Settings, label: 'Dados de Cadastro' },
  ];

  const coauthorItems = [
    { path: '/coauthor/dashboard', icon: LayoutDashboard, label: 'Meu Painel' },
    { path: '/coauthor/projects', icon: FolderKanban, label: 'Projetos (Em produção)', disabled: true },
    { path: '/coauthor/chapters', icon: FileText, label: 'Meu Capítulo' },
    { path: '/coauthor/course', icon: GraduationCap, label: 'Aulas' },
    { path: '/coauthor/announcements', icon: Megaphone, label: 'Avisos' },
    { path: '/coauthor/mentorship', icon: Handshake, label: 'Mentoria' },
    { path: '/coauthor/settings', icon: Settings, label: 'Meu Perfil' },
  ];

  const visibleGeneralItems = generalItems.filter(item => {
    const roleMatch = item.roles.length === 0 || item.roles.includes(user?.role);
    if (!roleMatch) return false;

    // Hide Dashboard Geral for coordinator and admin (appears in their own section)
    if ((isCoordinator() || isAdmin()) && item.label === 'Dashboard Geral') return false;

    return true;
  }).map(item => {
    // Overrides for Coordinator in "Platform" section
    if (isCoordinator()) {
      if (item.label === 'Projetos') {
        return { ...item, label: 'Projetos (Em produção)', disabled: true };
      }
      if (item.label === 'Meus Capítulos') {
        return { ...item, label: 'Meu Capítulo', path: '/coauthor/chapters' };
      }
    }
    return item;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveRoute = (path) => location.pathname.startsWith(path) && path !== '/app/dashboard' || location.pathname === path;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getProfilePath = () => {
    if (isCoautor()) return '/coauthor/settings';
    if (isCoordinator()) return '/coordinator/settings';
    if (isGestor()) return '/manager/settings';
    return '/app/settings';
  };

  const renderNavGroup = (items, title) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        {!sidebarCollapsed && title && (
          <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {title}
          </h4>
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.path);
            const isDisabled = item.disabled;

            if (isDisabled) {
              return (
                <div
                  key={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 mx-2 rounded-xl
                    text-foreground/40 cursor-not-allowed
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium text-sm truncate">{item.label}</span>
                      <Lock className="h-3 w-3 ml-auto opacity-50" />
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
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-xl
                  transition-all duration-200
                  ${active
                    ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20'
                    : 'text-foreground/80 hover:bg-white/5 hover:text-foreground'
                  }
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-card text-foreground border-r border-border/20
          transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/10">
          {!sidebarCollapsed && (
            <span className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">N</span>
              </div>
              NAB
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex text-muted-foreground hover:bg-white/5">
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:bg-white/5">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          {isAdmin() && renderNavGroup(adminItems, 'Gestão Admin')}
          {isGestor() && renderNavGroup(managerItems, 'Área do Gestor')}
          {isCoordinator() && renderNavGroup(coordinatorItems, 'Área do Coordenador')}
          {isCoautor() ? renderNavGroup(coauthorItems, 'Área do Autor') : renderNavGroup(visibleGeneralItems, 'Plataforma')}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border/20 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)} className="lg:hidden text-foreground">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 w-72 rounded-full border border-border/50 bg-card/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AlertsIndicator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-0 md:pr-2 hover:bg-transparent">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                    <p className="text-[10px] uppercase font-bold text-accent tracking-wider">{user?.role}</p>
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-accent/20">
                    {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user?.name} />}
                    <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border/50">
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(getProfilePath())}>
                  <User className="mr-2 h-4 w-4" /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <User className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
