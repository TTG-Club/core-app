<script setup lang="ts">
  import { Role } from '~/shared/types';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: 'Админка',
    ogTitle: 'Админка',
  });
</script>

<template>
  <NuxtPage />
</template>
