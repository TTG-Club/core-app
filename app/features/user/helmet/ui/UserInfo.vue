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
</template>
