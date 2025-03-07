<script setup lang="ts">
  import { ROLE } from '~/shared/types';

  definePageMeta({
    auth: { roles: [ROLE.USER] },
  });
</script>

<template>
  <NuxtPage />
</template>
