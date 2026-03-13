<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  defineProps<{
    user: UserProfile;
  }>();
</script>

<template>
  <div class="flex min-h-20 items-center gap-3 p-4">
    <div class="flex min-w-0 flex-1 flex-col">
      <div
        class="mb-1 overflow-hidden text-2xl font-semibold text-ellipsis whitespace-nowrap"
      >
        {{ user.username }}
      </div>

      <div
        class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-secondary"
      >
        {{ user.email }}
      </div>
    </div>

    <UAvatar
      :alt="user.username"
      size="3xl"
      :ui="{ fallback: 'uppercase' }"
    />
  </div>

  <div class="-mt-2 px-4 pb-3">
    <USeparator class="mb-2">
      <span class="text-sm font-medium">Статистика</span>
    </USeparator>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between text-sm">
        <span>Скоро будет</span>

        <span class="text-sm font-semibold">∞</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span>Скоро будет</span>

        <span class="text-sm font-semibold">∞</span>
      </div>
    </div>
  </div>
</template>
