<script setup lang="ts">
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
