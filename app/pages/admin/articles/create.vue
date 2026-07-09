<script setup lang="ts">
  import { ArticleEditor } from '~articles/editor';
  import { ARTICLES_ADMIN_ROUTE } from '~articles/model';

  useSeoMeta({
    title: 'Создание записи',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Создание записи"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="tabler:x"
          variant="ghost"
          color="neutral"
          :to="ARTICLES_ADMIN_ROUTE"
          aria-label="Закрыть"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <ArticleEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
