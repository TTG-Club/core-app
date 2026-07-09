<script setup lang="ts">
  import type { ArticleDetailedResponse, ArticleRequest } from '../model';

  import { UiDrawer } from '~ui/drawer';

  import { ArticleBody } from '../body';
  import { ARTICLES_API_PATH } from '../model';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: ArticleRequest;
  }>();

  const {
    data: article,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<ArticleDetailedResponse>(`${ARTICLES_API_PATH}/preview`, {
        method: 'post',
        body: state,
      }),
    {
      lazy: true,
      server: false,
      immediate: false,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');

  whenever(opened, () => {
    clear();
    loadPreview();
  });
</script>

<template>
  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="article?.title"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <ArticleBody
      v-if="article"
      :article
    />
  </UiDrawer>
</template>
