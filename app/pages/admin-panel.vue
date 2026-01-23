<script setup lang="ts">
  import { Role } from '~/shared/types';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });
</script>

<template>
  <NuxtPage />
</template>
