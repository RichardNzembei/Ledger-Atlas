<template>
  <div class="min-h-screen flex" style="background:#0f0f0f">
    <!-- Sidebar -->
    <aside class="w-56 flex flex-col flex-shrink-0" style="background:#111111;border-right:1px solid #222">
      <!-- Logo -->
      <div class="h-14 flex items-center px-5" style="border-bottom:1px solid #222">
        <span class="text-base font-bold tracking-tight" style="color:#f97316">
          {{ config.public.appName }}
        </span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group"
          :class="[
            $route.path.startsWith(item.to)
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-200',
          ]"
          :style="$route.path.startsWith(item.to) ? 'background:rgba(249,115,22,0.12)' : ''"
        >
          <UIcon
            :name="item.icon"
            class="w-4 h-4 flex-shrink-0 transition-colors"
            :style="$route.path.startsWith(item.to) ? 'color:#f97316' : ''"
          />
          <span>{{ item.label }}</span>
          <span
            v-if="$route.path.startsWith(item.to)"
            class="ml-auto w-1 h-4 rounded-full"
            style="background:#f97316"
          />
        </NuxtLink>
      </nav>

      <!-- User footer -->
      <div class="p-3" style="border-top:1px solid #222">
        <div class="flex items-center gap-2.5">
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style="background:#f97316;color:#fff"
          >
            {{ (authStore.user?.displayName ?? '?').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold truncate" style="color:#e5e5e5">{{ authStore.user?.displayName }}</p>
            <p class="text-xs truncate" style="color:#555">{{ authStore.user?.email }}</p>
          </div>
          <button
            class="p-1 rounded transition-colors hover:bg-zinc-800"
            style="color:#555"
            title="Sign out"
            @click="logout"
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Topbar -->
      <header class="h-14 flex items-center px-6 gap-4 flex-shrink-0" style="background:#111111;border-bottom:1px solid #222">
        <div class="flex-1" />
        <NuxtLink
          to="/pos"
          class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style="background:rgba(249,115,22,0.12);color:#f97316;border:1px solid rgba(249,115,22,0.2)"
        >
          <UIcon name="i-heroicons-shopping-cart" class="w-3.5 h-3.5" />
          POS
        </NuxtLink>
        <button
          class="p-1.5 rounded-lg transition-colors hover:bg-zinc-800"
          style="color:#555"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        >
          <UIcon
            :name="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
            class="w-4 h-4"
          />
        </button>
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
];
</script>
