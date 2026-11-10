<script setup lang="ts">
  import type { CommunityNewsShortResponse } from '../model';

  import { CardLink } from '~ui/link';
  import { getVideoPoster } from '~ui/video';

  import { CommunityNewsDrawer } from '../drawer';
  import {
    COMMUNITY_NEWS_DATE_FORMAT,
    getCommunityNewsOpenInPanelLabel,
    getCommunityNewsRoute,
  } from '../model';

  const { news } = defineProps<{
    news: CommunityNewsShortResponse;
  }>();

  const { format } = useDayjs();

  const { isDesktop } = useDevice();
  const { isSplitActive } = useLayoutWidth();

  const overlay = useOverlay();

  const drawer = overlay.create(CommunityNewsDrawer, {
    props: {
      url: news.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  // Split-режим → детальная панель через ?detail; узкий → переход на страницу
  // чтения (CardLink навигирует сам). Как у новостей сайта (ArticleLink).
  const { isOpened, handleOpen } = useSectionLink(news.url, drawer.id, () =>
    drawer.open(),
  );

  const to = computed(() => getCommunityNewsRoute(news.url));

  const openInPanelLabel = computed(() =>
    getCommunityNewsOpenInPanelLabel(news.title),
  );

  const image = computed(
    () => getVideoPoster(news.videoUrl, news.previewImageUrl) ?? undefined,
  );

  // CardLink рассчитан на рус/англ название: у новости одно, в подзаголовок —
  // автор и дата.
  const name = computed(() => ({
    rus: news.title,
    eng: [
      news.authorName,
      news.publishDateTime
        ? format(news.publishDateTime, COMMUNITY_NEWS_DATE_FORMAT)
        : '',
    ]
      .filter(Boolean)
      .join(' · '),
  }));
</script>

<template>
  <CardLink
    :to
    :name
    :image
    :is-opened="isOpened"
    @open-drawer="handleOpen"
  >
    <template #actions>
      <UButton
        v-if="isDesktop && !isSplitActive"
        icon="tabler:layout-sidebar-right-expand"
        size="md"
        color="neutral"
        variant="soft"
        :aria-label="openInPanelLabel"
        @click.left.exact.prevent.stop="drawer.open()"
      />
    </template>
  </CardLink>
</template>
