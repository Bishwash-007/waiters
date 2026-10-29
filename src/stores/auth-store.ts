import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clearApiSession, getApiErrorMessage, setApiSession, setRefreshHandler } from "@/lib/api";
import { secureStorage } from "@/lib/secure-storage";
import { authApi, type LoginInput, type OnboardingInput } from "@/services/api";
import type { AuthSession, AuthUser } from "@/types/api";

interface AuthState {
  tenantId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  setTenant: (tenantId: string) => void;
  login: (input: LoginInput) => Promise<void>;
  onboard: (input: OnboardingInput) => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const applySession = (session: AuthSession) => {
  setApiSession({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    tenantId: session.user.tenantId,
  });
  return session;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      accessToken: null,
      refreshToken: null,
      user: null,
      isHydrated: false,
      isLoading: false,
      error: null,
      setTenant: (tenantId) => {
        if (tenantId !== get().tenantId) {
          clearApiSession();
          set({ tenantId, accessToken: null, refreshToken: null, user: null });
        } else {
          set({ tenantId });
        }
        setApiSession({ tenantId });
      },
      login: async (input) => {
        const tenant = get().tenantId;
        if (!tenant) {
          set({ error: "Enter your tenant before signing in." });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const session = applySession(await authApi.login(tenant, input));
          set({ ...session, tenantId: session.user.tenantId, isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: getApiErrorMessage(error) });
          throw error;
        }
      },
      onboard: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.onboard(input);
          set({ tenantId: result.slug, isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: getApiErrorMessage(error) });
          throw error;
        }
      },
      loadCurrentUser: async () => {
        if (!get().accessToken) return;
        set({ isLoading: true, error: null });
        try {
          const user = await authApi.me();
          set({ user, isLoading: false });
          setApiSession({ tenantId: user.tenantId });
        } catch (error) {
          set({ isLoading: false, error: getApiErrorMessage(error) });
          throw error;
        }
      },
      logout: async () => {
        const token = get().refreshToken;
        try {
          if (token) await authApi.logout(token);
        } finally {
          clearApiSession();
          set({ accessToken: null, refreshToken: null, user: null, isLoading: false });
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: "waiters-auth",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        tenantId: state.tenantId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setApiSession({
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            tenantId: state.tenantId,
          });
        }
        useAuthStore.setState({ isHydrated: true });
      },
    },
  ),
);

setRefreshHandler(async () => {
  const state = useAuthStore.getState();
  if (!state.tenantId || !state.refreshToken) return null;
  const session = applySession(await authApi.refresh(state.tenantId, state.refreshToken));
  useAuthStore.setState({
    ...session,
    tenantId: session.user.tenantId,
    error: null,
  });
  return session;
});

export const initializeAuth = () => {
  const state = useAuthStore.getState();
  if (state.accessToken && state.refreshToken && state.tenantId) {
    setApiSession({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      tenantId: state.tenantId,
    });
  }
};
