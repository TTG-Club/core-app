<script setup lang="ts">
  import type { CommunityNewsRequest } from '../model';

  import { UiDrawer } from '~ui/drawer';

  import { CommunityNewsBody } from '../body';
  import {
    COMMUNITY_NEWS_PREVIEW_PATH,
    getCommunityNewsMarkdown,
    parseCommunityNewsDetailed,
  } from '../model';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: CommunityNewsRequest;
  }>();

  const {
    data: news,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    async () =>
      parseCommunityNewsDetailed(
        await $fetch(COMMUNITY_NEWS_PREVIEW_PATH, {
          method: 'post',
          body: state,
        }),
      ),
    {
      lazy: true,
      server: false,
      immediate: false,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');

  const markdown = useEntityMarkdown(news, getCommunityNewsMarkdown);

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
    :title="news?.title"
    :is-loading
    :is-error
    :markdown
    width="100%"
    @close="opened = false"
  >
    <CommunityNewsBody
      v-if="news"
      :news
    />
  </UiDrawer>
</template>
