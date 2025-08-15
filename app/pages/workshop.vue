<script setup lang="ts">
  import { Role } from '~/shared/types';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: 'Мастерская',
    ogTitle: 'Мастерская | TTG Club Онлайн-справочник',
    twitterTitle: 'Мастерская | TTG Club Онлайн-справочник',
  });
</script>

<template>
  <NuxtPage />
</template>
