<script setup lang="ts">
  import type { ArticleDetailedResponse } from '../model';

  import { UiDrawer } from '~ui/drawer';

  import { ArticleBody } from '../body';
  import {
    ARTICLE_DATE_FORMAT,
    ARTICLES_ADMIN_ROUTE,
    ARTICLES_API_PATH,
    getArticleRoute,
  } from '../model';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { isAdmin } = useUserRoles();

  const { data: article, status } = await useAsyncData(
    computed(() => `article-drawer-${url}`),
    () => $fetch<ArticleDetailedResponse>(`${ARTICLES_API_PATH}/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');

  const urlForCopy = computed(() => `${getOrigin()}${getArticleRoute(url)}`);

  const editUrl = computed(() =>
    isAdmin.value ? `${ARTICLES_ADMIN_ROUTE}/${url}` : undefined,
  );
</script>

<template>
  <UiDrawer
    :title="article?.title"
    :date-time="article?.publishDateTime"
    :date-time-format="ARTICLE_DATE_FORMAT"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <ArticleBody
      v-if="article"
      :article
    />
  </UiDrawer>
</template>
