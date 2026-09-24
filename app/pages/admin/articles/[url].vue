<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { ArticleEditor, useArticleEditorCloseRoute } from '~articles/editor';

  // Править записи может и модератор (создание и список — только админу, см.
  // admin.vue). Мета дочерней страницы перекрывает роли родителя.
  definePageMeta({
    auth: { roles: [Role.ADMIN, Role.MODERATOR] },
  });

  const closeRoute = useArticleEditorCloseRoute();

  useSeoMeta({
    title: 'Редактирование записи',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Редактирование записи"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="tabler:x"
          variant="ghost"
          color="neutral"
          :to="closeRoute"
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
