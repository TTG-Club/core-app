<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';

  import { CommunityNewsBody } from '../body';
  import {
    COMMUNITY_NEWS_API_PATH,
    COMMUNITY_NEWS_DATE_FORMAT,
    getCommunityNewsEditRoute,
    getCommunityNewsMarkdown,
    getCommunityNewsRoute,
    parseCommunityNewsDetailed,
  } from '../model';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { canPublishCommunityNews } = useUserRoles();

  const { data: news, status } = await useAsyncData(
    computed(() => `community-news-drawer-${url}`),
    async () =>
      parseCommunityNewsDetailed(
        await $fetch(`${COMMUNITY_NEWS_API_PATH}/${url}`),
      ),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');

  const urlForCopy = computed(
    () => `${getOrigin()}${getCommunityNewsRoute(url)}`,
  );

  const editUrl = computed(() =>
    canPublishCommunityNews.value ? getCommunityNewsEditRoute(url) : undefined,
  );

  const markdown = useEntityMarkdown(news, getCommunityNewsMarkdown);
</script>

<template>
  <UiDrawer
    :title="news?.title"
    :date-time="news?.publishDateTime"
    :date-time-format="COMMUNITY_NEWS_DATE_FORMAT"
    :url="urlForCopy"
    :edit-url="editUrl"
    :markdown
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <CommunityNewsBody
      v-if="news"
      :news
    />
  </UiDrawer>
</template>
