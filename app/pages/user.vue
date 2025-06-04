<script setup lang="ts">
  import { Role } from '~/shared/types';

  definePageMeta({
    auth: { roles: [Role.USER] },
  });
</script>

<template>
  <NuxtPage />
</template>
