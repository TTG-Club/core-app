<script setup lang="ts">
  import { ROLE } from '~/shared/types';

  definePageMeta({
    auth: { roles: [ROLE.ADMIN] },
  });

  useSeoMeta({
    title: 'Мастерская',
  });
</script>

<template>
  <NuxtPage />
</template>
