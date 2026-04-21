import type { LoginRequest, LoginResponse } from '@inventory/contracts';

export function useAuth() {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();

  async function login(credentials: LoginRequest) {
    const res = await $fetch<LoginResponse>(`${config.public.apiBase}/api/v1/auth/login`, {
      method: 'POST',
      body: credentials,
    });
    authStore.setSession(res);
    await navigateTo('/admin/products');
  }

  async function logout() {
    authStore.clear();
    await navigateTo('/login');
  }

  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isAdmin: computed(() => authStore.isAdmin),
    login,
    logout,
  };
}
