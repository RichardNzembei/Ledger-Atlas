<template>
  <div class="h-screen flex flex-col bg-gray-100 dark:bg-gray-950 overflow-hidden">
    <!-- POS Header -->
    <header class="h-14 bg-primary-700 dark:bg-primary-900 flex items-center px-4 gap-4 shrink-0">
      <span class="text-white font-bold text-lg">POS</span>
      <div class="flex-1" />
      <span class="text-primary-200 text-sm">{{ authStore.user?.displayName }}</span>
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="white"
        size="sm"
        to="/admin/products"
        label="Back to admin"
      />
    </header>

    <div class="flex-1 overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
</script>
