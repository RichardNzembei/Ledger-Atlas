const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;
  if (PUBLIC_ROUTES.includes(to.path)) return;

  const auth = useAuthStore();

  // If store not yet hydrated, try restoring from localStorage directly
  if (!auth.isAuthenticated && import.meta.client) {
    const token = localStorage.getItem('auth.token');
    if (token) {
      auth.restore();
    }
  }

  if (!auth.isAuthenticated) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
