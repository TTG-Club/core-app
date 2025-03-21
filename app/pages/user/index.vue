<script setup lang="ts">
  import { PageContainer, PageHeader } from '~ui/page';

  useSeoMeta({
    title: 'Личный кабинет',
    ogTitle: 'Личный кабинет | TTG Club Онлайн-справочник',
    twitterTitle: 'Личный кабинет | TTG Club Онлайн-справочник',
  });
</script>

<template>
  <PageContainer>
    <template #header>
      <PageHeader title="Личный кабинет" />
    </template>
  </PageContainer>
</template>
