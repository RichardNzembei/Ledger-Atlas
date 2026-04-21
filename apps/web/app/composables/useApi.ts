export function useApi() {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();

  const api = $fetch.create({
    baseURL: config.public.apiBase as string,
    onRequest({ options }) {
      if (authStore.token) {
        options.headers = new Headers({
          ...(options.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : (options.headers as Record<string, string>)),
          authorization: `Bearer ${authStore.token}`,
        });
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        authStore.clear();
        void navigateTo('/login');
      }
    },
  });

  return { api };
}
