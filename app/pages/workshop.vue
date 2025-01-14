<script setup lang="ts">
  definePageMeta({
    auth: { roles: [ROLE.USER] },
  });

  useSeoMeta({
    title: 'Мастерская',
  });
</script>

<template>
  <NuxtPage />
</template>
