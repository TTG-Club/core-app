<script setup lang="ts">
  import { ROLE } from '~/shared/types';

  definePageMeta({
    auth: { roles: [ROLE.ADMIN] },
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
