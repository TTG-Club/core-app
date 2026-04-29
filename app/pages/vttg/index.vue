<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { VTTG_SEO } from '~vttg/model';
  import { VttgLanding } from '~vttg/ui';

  definePageMeta({
    layout: 'vttg',
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: VTTG_SEO.title,
    description: VTTG_SEO.description,
  });
</script>

<template>
  <NuxtLayout>
    <VttgLanding />
  </NuxtLayout>
</template>
