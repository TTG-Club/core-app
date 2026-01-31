<script setup lang="ts">
  interface NavigationItem {
    label: string;
    icon: string;
    to: string;
  }

  const items: NavigationItem[] = [
    {
      label: 'Главная',
      icon: 'i-heroicons-home',
      to: '/admin-panel',
    },
    {
      label: 'Токенатор',
      icon: 'i-heroicons-photo',
      to: '/admin-panel/tokenator',
    },
  ];
</script>

<template>
  <div class="flex h-full w-64 flex-col border-r border-default p-4">
    <div class="mb-6 flex items-center gap-2 px-2">
      <UIcon
        name="i-ttg-menu-filled-workshop"
        class="h-6 w-6 text-primary"
      />

      <span class="text-lg font-bold">Админ-панель</span>
    </div>

    <nav class="flex flex-col gap-1">
      <UButton
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :icon="item.icon"
        variant="ghost"
        color="neutral"
        class="justify-start"
        active-class="bg-ui-active text-primary"
      >
        {{ item.label }}
      </UButton>
    </nav>
  </div>
</template>
