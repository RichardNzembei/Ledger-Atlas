<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">{{ config.public.appName }}</h1>
          <p class="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>
      </template>

      <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
        <UFormGroup label="Workspace" name="tenantSlug">
          <UInput
            v-model="form.tenantSlug"
            placeholder="your-company"
            autocomplete="organization"
          />
        </UFormGroup>

        <UFormGroup label="Email" name="email">
          <UInput
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="admin@example.com"
          />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
          <UInput
            v-model="form.password"
            type="password"
            autocomplete="current-password"
          />
        </UFormGroup>

        <UAlert v-if="error" color="red" :description="error" icon="i-heroicons-exclamation-circle" />

        <UButton type="submit" block :loading="loading">
          Sign in
        </UButton>
      </UForm>
    </UCard>
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
