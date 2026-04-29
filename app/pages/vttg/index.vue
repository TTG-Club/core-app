<script setup lang="ts">
  import { VTTG_SEO } from '~vttg/model';
  import { VttgLanding } from '~vttg/ui';

  definePageMeta({
    layout: 'vttg',
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
