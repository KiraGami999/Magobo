import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ApiResponse, LoginInput, PublicUser, RegisterInput } from '@magobo/shared';
import { apiGet, apiPost } from './api-client';
import { clearSessionToken, saveSessionToken } from './session-store';

interface RegisterOrLoginResponse {
  user: PublicUser;
  sessionToken?: string;
}

export interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<ApiResponse<RegisterOrLoginResponse>>;
  register: (input: RegisterInput) => Promise<ApiResponse<RegisterOrLoginResponse>>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const response = await apiGet<{ user: PublicUser }>('/api/auth/me');
    setUser(response.success ? response.data.user : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see apps/web/src/lib/use-current-user.ts
    void refetch();
  }, [refetch]);

  const persistSessionIfPresent = useCallback(
    async (response: ApiResponse<RegisterOrLoginResponse>) => {
      if (response.success && response.data.sessionToken) {
        await saveSessionToken(response.data.sessionToken);
        setUser(response.data.user);
      }
    },
    [],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await apiPost<RegisterOrLoginResponse>('/api/auth/login', input);
      await persistSessionIfPresent(response);
      return response;
    },
    [persistSessionIfPresent],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await apiPost<RegisterOrLoginResponse>('/api/auth/register', input);
      await persistSessionIfPresent(response);
      return response;
    },
    [persistSessionIfPresent],
  );

  const logout = useCallback(async () => {
    await apiPost('/api/auth/logout', {});
    await clearSessionToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refetch }),
    [user, loading, login, register, logout, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
