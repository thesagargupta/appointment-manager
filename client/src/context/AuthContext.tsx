import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as appointmentsApi from '../services/appointments';
import { setUnauthorizedHandler } from '../services/api';
import type { Admin } from '../types';
import { useToast } from './ToastContext';

interface AuthState {
  admin: Admin | null;
  isLoading: boolean;
  error: unknown;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const ME_KEY = ['me'] as const;

// Drops all cached server data (so the next admin never sees the previous one's) and marks the session as ended.
// The 'me' query itself must stay registered, otherwise its observer would never see the change.
function endSession(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
  queryClient.setQueryData(ME_KEY, null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const me = useQuery({ queryKey: ME_KEY, queryFn: appointmentsApi.fetchMe, staleTime: Infinity, retry: 1 });

  // Any 401 from a protected call means the session expired: drop cached data and bounce to login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (queryClient.getQueryData(ME_KEY)) toast.error('Your session has expired. Please sign in again.');
      endSession(queryClient);
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient, toast]);

  const login = useCallback(
    async (email: string, password: string) => {
      const admin = await appointmentsApi.login(email, password);
      queryClient.setQueryData(ME_KEY, admin);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await appointmentsApi.logout();
    } catch {
      // Even if the server call fails, leave the UI in the signed-out state; the session cookie expires server-side.
    }
    endSession(queryClient);
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      admin: me.data ?? null,
      isLoading: me.isPending,
      error: me.error,
      login,
      logout,
      retry: () => void me.refetch(),
    }),
    [me.data, me.isPending, me.error, me, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
