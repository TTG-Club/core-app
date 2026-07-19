<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { MODERATION_PANEL_TITLE } from '~moderation/model';

  definePageMeta({
    auth: { roles: [Role.ADMIN, Role.MODERATOR] },
  });

  useSeoMeta({
    title: MODERATION_PANEL_TITLE,
  });
</script>

<template>
  <NuxtPage />
</template>
