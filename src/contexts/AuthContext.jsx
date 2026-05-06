import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch profile from Supabase after auth
  const fetchProfile = async (authUser) => {
    if (!authUser) { setUser(null); return; }
    try {
      // Usa RPC com SECURITY DEFINER para ignorar RLS e garantir leitura do próprio perfil
      const { data: profile, error: profileError } = await supabase
        .rpc('get_my_profile')
        .single();

      if (profileError) {
        // PGRST116 = row not found — tenta criar o profile automaticamente
        if (profileError.code === 'PGRST116') {
          const meta = authUser.user_metadata || {};
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              name: meta.name || authUser.email?.split('@')[0] || 'Usuário',
              role: meta.role || 'COAUTOR',
              tenant_id: 'tenant-1',
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            setUser({
              id: newProfile.id,
              email: newProfile.email || authUser.email,
              name: newProfile.name,
              role: newProfile.role,
              coordinator_id: newProfile.coordinator_id || null,
              tenant_id: newProfile.tenant_id || 'tenant-1',
              avatar_url: newProfile.avatar_url || null,
              phone: newProfile.phone || null,
              cep: newProfile.cep || null,
              address: newProfile.address || null,
              address_number: newProfile.address_number || null,
              social_name: newProfile.social_name || null,
              cpf: newProfile.cpf || null,
              referral_code: newProfile.referral_code || null,
              click_count: newProfile.click_count || 0,
              contract_status: newProfile.contract_status || 'ENVIADO',
              contract_signed_at: newProfile.contract_signed_at || null,
              contract_url: newProfile.contract_url || null,
              website_url: newProfile.website_url || null,
              manager_id: newProfile.manager_id || null,
              bio: newProfile.bio || null,
              instagram: newProfile.instagram || null,
              contact_email: newProfile.contact_email || null,
              chapter_photo_url: newProfile.chapter_photo_url || null,
            });
            return;
          }
        }
        throw profileError;
      }

      console.log('Profile fetched successfully:', profile.email, 'Role:', profile.role);
      setUser({
        id: profile.id,
        email: profile.email || authUser.email,
        name: profile.name,
        role: profile.role,
        coordinator_id: profile.coordinator_id,
        tenant_id: profile.tenant_id,
        avatar_url: profile.avatar_url || null,
        phone: profile.phone || null,
        cep: profile.cep || null,
        address: profile.address || null,
        address_number: profile.address_number || null,
        social_name: profile.social_name || null,
        cpf: profile.cpf || null,
        referral_code: profile.referral_code || null,
        click_count: profile.click_count || 0,
        contract_status: profile.contract_status || 'ENVIADO',
        contract_signed_at: profile.contract_signed_at || null,
        contract_url: profile.contract_url || null,
        website_url: profile.website_url || null,
        manager_id: profile.manager_id || null,
        bio: profile.bio || null,
        instagram: profile.instagram || null,
        contact_email: profile.contact_email || null,
        chapter_photo_url: profile.chapter_photo_url || null,
        whatsapp: profile.whatsapp || null,
        password_changed: profile.password_changed ?? false,
      });
    } catch (err) {
      console.error('Error fetching profile, falling back to metadata:', err);
      // Fallback: usa dados do auth para não bloquear o login
      const meta = authUser.user_metadata || {};
      console.log('Metadata fallback role:', meta.role || 'COAUTOR');
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: meta.name || authUser.email?.split('@')[0] || 'Usuário',
        role: meta.role || 'COAUTOR',
        coordinator_id: null,
        tenant_id: 'tenant-1',
        avatar_url: null,
        phone: null,
        cep: null,
        address: null,
        referral_code: null,
        click_count: 0,
        contract_status: 'ENVIADO',
        contract_signed_at: null,
        contract_url: null,
        website_url: null,
        manager_id: null,
      });
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    // Listen for auth changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESH)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        return;
      }
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true); // permanece true até onAuthStateChange completar o fetchProfile
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      // Não chama fetchProfile aqui — onAuthStateChange cuida disso e define setLoading(false)
      return data.user;
    } catch (err) {
      const message = err.message === 'Invalid login credentials'
        ? 'Email ou senha inválidos'
        : err.message;
      setError(message);
      setLoading(false);
      throw new Error(message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Recarrega o perfil do usuário atual (útil após atualizar dados)
  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await fetchProfile(session.user);
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isGestor = () => user?.role === 'GESTOR';  // Gestor: nível topo (gerencia Líderes)
  const isLider = () => user?.role === 'LIDER';    // Líder de Coordenação
  const isCS = () => user?.role === 'CS';
  const isVendedor = () => user?.role === 'VENDEDOR';
  const isCoordinator = () => user?.role === 'COORDENADOR';
  const isCoautor = () => user?.role === 'COAUTOR';
  const canAccess = (requiredRoles) => {
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.role);
  };
  const getTenantId = () => user?.tenant_id || 'tenant-1';
  const getTenantName = () => 'Novos Autores do Brasil (NAB)';

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshProfile, isAdmin, isGestor, isLider, isCS, isVendedor, isCoordinator, isCoautor, canAccess, getTenantId, getTenantName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
