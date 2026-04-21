const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return; // token lives in localStorage, not readable server-side
  if (PUBLIC_ROUTES.includes(to.path)) return;

  const auth = useAuthStore();
  if (!auth.isAuthenticated) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
