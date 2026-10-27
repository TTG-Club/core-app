<script setup lang="ts">
  import { Role } from '~/shared/types';

  // Мастерская открыта модераторам (см. workshop.vue), но источники в core-api
  // правит только ADMIN. Мета дочерней страницы перекрывает роли родителя.
  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });
</script>

<template>
  <NuxtPage />
</template>
