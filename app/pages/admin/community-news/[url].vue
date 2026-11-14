<script setup lang="ts">
  import { CommunityNewsEditor } from '~community-news/editor';
  import {
    COMMUNITY_NEWS_ADMIN_ROUTE,
    COMMUNITY_NEWS_EDITOR_ROLES,
    COMMUNITY_NEWS_PAGE_TEXT,
  } from '~community-news/model';

  // Инструмент открыт не только админу: мета дочерней страницы перекрывает
  // роли родителя (admin.vue).
  definePageMeta({
    auth: { roles: [...COMMUNITY_NEWS_EDITOR_ROLES] },
  });

  useSeoMeta({
    title: COMMUNITY_NEWS_PAGE_TEXT.editTitle,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="COMMUNITY_NEWS_PAGE_TEXT.editTitle"
  >
    <template #actions>
      <UTooltip :text="COMMUNITY_NEWS_PAGE_TEXT.close">
        <UButton
          icon="tabler:x"
          variant="ghost"
          color="neutral"
          :to="COMMUNITY_NEWS_ADMIN_ROUTE"
          :aria-label="COMMUNITY_NEWS_PAGE_TEXT.close"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <CommunityNewsEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
