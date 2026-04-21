import { defineStore } from 'pinia';
import type { LoginResponse } from '@inventory/contracts';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  tenantId: string;
  tenantSlug: string;
  roles: string[];
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    refreshToken: null as string | null,
    user: null as AuthUser | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.roles.includes('admin') ?? false,
  },

  actions: {
    setSession(payload: LoginResponse) {
      this.token = payload.token;
      this.refreshToken = payload.refreshToken;
      this.user = payload.user as AuthUser;
      if (import.meta.client) {
        localStorage.setItem('auth.token', payload.token);
        localStorage.setItem('auth.refresh', payload.refreshToken);
        localStorage.setItem('auth.user', JSON.stringify(payload.user));
      }
    },

    restore() {
      if (!import.meta.client) return;
      this.token = localStorage.getItem('auth.token');
      this.refreshToken = localStorage.getItem('auth.refresh');
      const raw = localStorage.getItem('auth.user');
      if (raw) {
        try { this.user = JSON.parse(raw) as AuthUser; }
        catch { this.clear(); }
      }
    },

    clear() {
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      if (import.meta.client) {
        localStorage.removeItem('auth.token');
        localStorage.removeItem('auth.refresh');
        localStorage.removeItem('auth.user');
      }
    },
  },
});
