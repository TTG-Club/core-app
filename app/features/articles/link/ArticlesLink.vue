<script setup lang="ts">
  import { ArticlesDrawer } from '../drawer';
  import { SmallLink } from '~ui/link';

  import type { ArticlesLinkResponse } from '../types/link';

  const { articles } = defineProps<{
    articles: ArticlesLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(ArticlesDrawer, {
    props: {
      url: articles.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'articles-url', params: { url: articles.url } }"
    :title="`${articles.name.rus} [${articles.name.eng}]`"
    :group="articles.source?.group"
    :is-opened
    @open-drawer="drawer.open()"
  >
    <template #default>
      {{ articles.name.rus }}
    </template>

    <template #english>
      {{ articles.name.eng }}
    </template>

    <template #caption>
      <span>
        {{ articles.categories ?? '—' }}
      </span>
    </template>
  </SmallLink>
</template>
