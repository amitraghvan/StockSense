'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import {
  UserProfile,
  TenantSummary,
  RoleSummary,
  TenantMembershipSummary,
  AuthResponseData,
  AuthMeResponseData,
} from '@stocksense/types';
import { LoginInput, SignupInput } from '@stocksense/validation';

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  activeTenant: TenantSummary | null;
  activeRole: RoleSummary | null;
  permissions: string[];
  availableTenants: TenantMembershipSummary[];
  login: (credentials: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/internal/foundation',
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [activeTenant, setActiveTenant] = React.useState<TenantSummary | null>(null);
  const [activeRole, setActiveRole] = React.useState<RoleSummary | null>(null);
  const [permissions, setPermissions] = React.useState<string[]>([]);
  const [availableTenants, setAvailableTenants] = React.useState<TenantMembershipSummary[]>([]);

  // Wire up apiClient 401 callback
  React.useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      handleClearState();
      router.push('/login');
    });
  }, [router]);

  const handleClearState = React.useCallback(() => {
    setUser(null);
    setActiveTenant(null);
    setActiveRole(null);
    setPermissions([]);
    setAvailableTenants([]);
    apiClient.clearAuth();
  }, []);

  const loadMe = React.useCallback(async () => {
    const token = apiClient.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiClient.get<AuthMeResponseData>('auth/me');
      setUser(data.user);
      setActiveTenant(data.activeTenant);
      setActiveRole(data.activeRole);
      setPermissions(data.permissions);
      setAvailableTenants(data.availableTenants);

      if (data.activeTenant) {
        apiClient.setActiveTenant(data.activeTenant.id);
      }
    } catch {
      handleClearState();
    } finally {
      setIsLoading(false);
    }
  }, [handleClearState]);

  React.useEffect(() => {
    loadMe();
  }, [loadMe]);

  // Route protection redirect check
  React.useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    const token = apiClient.getAccessToken();

    if (!token && !isPublic) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (token && isPublic && pathname !== '/internal/foundation') {
      router.replace('/dashboard');
    }
  }, [isLoading, pathname, router]);

  const login = async (credentials: LoginInput) => {
    setIsLoading(true);
    try {
      const data = await apiClient.post<AuthResponseData>('auth/login', credentials, {
        skipAuth: true,
      });
      apiClient.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      apiClient.setActiveTenant(data.activeTenant.id);

      setUser(data.user);
      setActiveTenant(data.activeTenant);
      setActiveRole(data.activeRole);
      setPermissions(data.permissions);

      // Fetch full memberships
      const meData = await apiClient.get<AuthMeResponseData>('auth/me');
      setAvailableTenants(meData.availableTenants);

      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      } else {
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<AuthResponseData>('auth/signup', data, { skipAuth: true });
      apiClient.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      apiClient.setActiveTenant(res.activeTenant.id);

      setUser(res.user);
      setActiveTenant(res.activeTenant);
      setActiveRole(res.activeRole);
      setPermissions(res.permissions);

      const meData = await apiClient.get<AuthMeResponseData>('auth/me');
      setAvailableTenants(meData.availableTenants);

      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      } else {
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      handleClearState();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
    }
  };

  const switchTenant = async (tenantId: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{
        activeTenant: TenantSummary;
        activeRole: RoleSummary;
        permissions: string[];
        accessToken: string;
      }>('auth/switch-tenant', { tenantId });

      apiClient.setTokens(res.accessToken);
      apiClient.setActiveTenant(res.activeTenant.id);

      setActiveTenant(res.activeTenant);
      setActiveRole(res.activeRole);
      setPermissions(res.permissions);

      // Refresh me data to update memberships
      await loadMe();
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = React.useCallback(
    (permission: string): boolean => {
      if (activeRole?.name === 'SUPER_ADMIN') return true;
      return permissions.includes(permission);
    },
    [activeRole, permissions],
  );

  const hasAnyPermission = React.useCallback(
    (required: string[]): boolean => {
      if (activeRole?.name === 'SUPER_ADMIN') return true;
      return required.some((p) => permissions.includes(p));
    },
    [activeRole, permissions],
  );

  const value: AuthContextValue = {
    isAuthenticated: !!user && !!apiClient.getAccessToken(),
    isLoading,
    user,
    activeTenant,
    activeRole,
    permissions,
    availableTenants,
    login,
    signup,
    logout,
    switchTenant,
    hasPermission,
    hasAnyPermission,
    refetchUser: loadMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useCurrentUser(): UserProfile | null {
  return useAuth().user;
}

export function useCurrentTenant(): TenantSummary | null {
  return useAuth().activeTenant;
}

export function usePermissions() {
  const { permissions, hasPermission, hasAnyPermission, activeRole } = useAuth();
  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    role: activeRole,
  };
}
