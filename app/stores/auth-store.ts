import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const TOKEN_STORAGE_KEY = "valyu_oauth_tokens";
const USER_STORAGE_KEY = "valyu_user";

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
}

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  showSignInModal: boolean;
  signIn: (user: User, tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }) => void;
  signOut: () => void;
  initialize: () => void;
  getAccessToken: () => string | null;
  openSignInModal: () => void;
  closeSignInModal: () => void;
}

function saveTokens(tokens: TokenData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

function loadTokens(): TokenData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function saveUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
}

function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 30000;
}

function loadInitialTokens(): { user: User | null; tokens: TokenData | null } {
  if (typeof window === "undefined") {
    return { user: null, tokens: null };
  }
  const user = loadUser();
  const tokens = loadTokens();
  if (user && tokens && !isTokenExpired(tokens.expiresAt)) {
    return { user, tokens };
  }
  return { user: null, tokens: null };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      isLoading: true,
      initialized: false,
      showSignInModal: false,

      initialize: () => {
        const currentState = get();
        if (currentState.isAuthenticated && currentState.accessToken) {
          set({ initialized: true, isLoading: false });
          return;
        }

        if (currentState.initialized) {
          set({ isLoading: false });
          return;
        }

        set({ initialized: true });

        const { user, tokens } = loadInitialTokens();
        if (user && tokens) {
          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || null,
            tokenExpiresAt: tokens.expiresAt,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      signIn: (user, tokens) => {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const expiresAt = tokens.expiresIn
          ? Date.now() + tokens.expiresIn * 1000
          : Date.now() + SEVEN_DAYS_MS;

        saveUser(user);
        saveTokens({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt,
        });

        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          tokenExpiresAt: expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      signOut: () => {
        clearUser();
        clearTokens();

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      getAccessToken: () => {
        const state = get();

        if (state.accessToken) {
          if (state.tokenExpiresAt && isTokenExpired(state.tokenExpiresAt)) {
            return null;
          }
          return state.accessToken;
        }

        const tokens = loadTokens();
        if (tokens && tokens.accessToken && !isTokenExpired(tokens.expiresAt)) {
          const user = loadUser();
          if (user) {
            set({
              user,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken || null,
              tokenExpiresAt: tokens.expiresAt,
              isAuthenticated: true,
              isLoading: false,
              initialized: true,
            });
          }
          return tokens.accessToken;
        }

        return null;
      },

      openSignInModal: () => {
        set({ showSignInModal: true });
      },

      closeSignInModal: () => {
        set({ showSignInModal: false });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true,
    }
  )
);
