<script setup lang="ts">
  import { PageContainer, PageHeader } from '~ui/page';

  useSeoMeta({
    title: 'Личный кабинет',
  });
</script>

<template>
  <PageContainer>
    <template #header>
      <PageHeader title="Личный кабинет" />
    </template>
  </PageContainer>
</template>
