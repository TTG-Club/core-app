<script setup lang="ts">
  import { Role } from '~/shared/types';

  definePageMeta({
    auth: { roles: [Role.ADMIN, Role.MODERATOR] },
  });

  useSeoMeta({
    title: 'Мастерская',
  });
</script>

<template>
  <NuxtPage />
</template>
