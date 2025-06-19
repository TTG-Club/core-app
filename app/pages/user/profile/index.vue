<script setup lang="ts">
  import type { UserProfile } from '~/shared/types';

  const { data } = await useAsyncData(
    'user-profile',
    () => $fetch<UserProfile>('/api/user/profile'),
    { dedupe: 'defer' },
  );

  useSeoMeta({
    title: 'Профиль пользователя',
  });
</script>

<template>
  <NuxtLayout>
    <div class="flex flex-col gap-4">
      <h1 class="text-3xl">Профиль пользователя</h1>

      <div class="flex gap-2">
        <strong>Имя пользователя: </strong>

        <span v-if="data?.username">{{ data.username }}</span>

        <USkeleton
          v-else
          class="w-48"
        />
      </div>
    </div>
  </NuxtLayout>
</template>
