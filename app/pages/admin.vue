<script setup lang="ts">
  import { Role } from '~/shared/types';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: 'Панель администрирования',
  });
</script>

<template>
  <NuxtPage />
</template>
