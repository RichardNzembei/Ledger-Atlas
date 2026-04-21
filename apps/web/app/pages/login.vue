<template>
  <div style="background:#0f0f0f;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <div style="width:100%;max-width:380px;margin:0 auto">
      <!-- Card -->
      <div style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden">
        <!-- Card header -->
        <div style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #1a1a1a">
          <h1 style="margin:0 0 6px;font-size:1.5rem;font-weight:800;color:#f97316;letter-spacing:-0.02em">
            {{ config.public.appName }}
          </h1>
          <p style="margin:0;font-size:0.875rem;color:#71717a">Sign in to your account</p>
        </div>

        <!-- Form -->
        <form style="padding:28px 32px 32px" @submit.prevent="onSubmit">
          <!-- Workspace -->
          <div style="margin-bottom:18px">
            <label style="display:block;font-size:0.8rem;font-weight:500;color:#a3a3a3;margin-bottom:6px">
              Workspace
            </label>
            <input
              v-model="form.tenantSlug"
              type="text"
              placeholder="your-company"
              autocomplete="organization"
              style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:9px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.15s"
              @focus="($event.target as HTMLInputElement).style.borderColor='#f97316'"
              @blur="($event.target as HTMLInputElement).style.borderColor='#2a2a2a'"
            />
          </div>

          <!-- Email -->
          <div style="margin-bottom:18px">
            <label style="display:block;font-size:0.8rem;font-weight:500;color:#a3a3a3;margin-bottom:6px">
              Email
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="admin@example.com"
              autocomplete="email"
              style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:9px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.15s"
              @focus="($event.target as HTMLInputElement).style.borderColor='#f97316'"
              @blur="($event.target as HTMLInputElement).style.borderColor='#2a2a2a'"
            />
          </div>

          <!-- Password -->
          <div style="margin-bottom:24px">
            <label style="display:block;font-size:0.8rem;font-weight:500;color:#a3a3a3;margin-bottom:6px">
              Password
            </label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:9px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.15s"
              @focus="($event.target as HTMLInputElement).style.borderColor='#f97316'"
              @blur="($event.target as HTMLInputElement).style.borderColor='#2a2a2a'"
            />
          </div>

          <!-- Error alert -->
          <div
            v-if="error"
            style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:10px 14px;margin-bottom:18px;display:flex;align-items:center;gap:8px"
          >
            <span style="color:#f87171;font-size:0.875rem">⚠</span>
            <p style="margin:0;font-size:0.875rem;color:#f87171">{{ error }}</p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            style="background:#f97316;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:0.875rem;font-weight:600;cursor:pointer;width:100%;transition:opacity 0.15s;letter-spacing:0.01em"
            :style="loading ? 'opacity:0.65;cursor:not-allowed' : ''"
            :disabled="loading"
          >
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import { LoginRequest } from '@inventory/contracts';

definePageMeta({ layout: 'default' });

const config = useRuntimeConfig();
const { login } = useAuth();
const route = useRoute();

const schema = LoginRequest;
const form = reactive({ tenantSlug: '', email: '', password: '' });
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    await login(form);
    const redirect = route.query['redirect'] as string | undefined;
    if (redirect) await navigateTo(decodeURIComponent(redirect));
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>
