<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-950">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <span class="text-xl font-bold text-primary-600 dark:text-primary-400">
          {{ config.public.appName }}
        </span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="[
            $route.path.startsWith(item.to)
              ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
          ]"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- User footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-3">
          <UAvatar :alt="authStore.user?.displayName ?? '?'" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ authStore.user?.displayName }}</p>
            <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
          </div>
          <UButton icon="i-heroicons-arrow-right-on-rectangle" variant="ghost" size="xs" @click="logout" />
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4">
        <div class="flex-1" />
        <UButton
          :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          variant="ghost"
          size="sm"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        />
      </header>

      <div class="flex-1 overflow-y-auto p-6">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const authStore = useAuthStore();
const colorMode = useColorMode();
const { logout } = useAuth();

const navItems = [
  { to: '/admin/products', label: 'Products', icon: 'i-heroicons-cube' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'i-heroicons-building-storefront' },
  { to: '/admin/customers', label: 'Customers', icon: 'i-heroicons-users' },
  { to: '/admin/locations', label: 'Locations', icon: 'i-heroicons-map-pin' },
  { to: '/admin/assets', label: 'Assets', icon: 'i-heroicons-wrench-screwdriver' },
  { to: '/admin/rules', label: 'Rules', icon: 'i-heroicons-bolt' },
  { to: '/admin/fields', label: 'Custom Fields', icon: 'i-heroicons-adjustments-horizontal' },
  { to: '/admin/settings', label: 'Settings', icon: 'i-heroicons-cog-6-tooth' },
  { to: '/reports', label: 'Reports', icon: 'i-heroicons-chart-bar' },
];
</script>
