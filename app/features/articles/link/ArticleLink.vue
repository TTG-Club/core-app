<script setup lang="ts">
  import type { ArticleShortResponse } from '../model';

  import { CardLink } from '~ui/link';

  import { ArticleDrawer } from '../drawer';
  import { ARTICLE_DATE_FORMAT, getArticleRoute } from '../model';

  const { article } = defineProps<{
    article: ArticleShortResponse;
  }>();

  const { format } = useDayjs();

  const { isDesktop } = useDevice();
  const { isSplitActive } = useLayoutWidth();

  const overlay = useOverlay();

  const drawer = overlay.create(ArticleDrawer, {
    props: {
      url: article.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  // Split-режим → выделение/детальная панель через ?detail; узкий режим → переход
  // на страницу чтения (CardLink сам навигирует). Паттерн как в SpeciesLink.
  const { isOpened, handleOpen } = useSectionLink(article.url, drawer.id, () =>
    drawer.open(),
  );

  const to = computed(() => getArticleRoute(article.url));

  // CardLink рассчитан на сущности с рус/англ названием; у записи одно название,
  // в подзаголовок кладём дату публикации.
  const name = computed(() => ({
    rus: article.title,
    eng: article.publishDateTime
      ? format(article.publishDateTime, ARTICLE_DATE_FORMAT)
      : '',
  }));
</script>

<template>
  <CardLink
    :to="to"
    :name="name"
    :image="article.previewImageUrl ?? undefined"
    :is-opened="isOpened"
    @open-drawer="handleOpen"
  >
    <!-- Кнопка открытия в дровере — как в SpeciesLink. В обычном режиме клик по
      карточке ведёт на страницу, поэтому даём отдельную кнопку «в панель»; в
      split-режиме её не показываем — там карточка сама открывает детальную панель. -->
    <template #actions>
      <UButton
        v-if="isDesktop && !isSplitActive"
        icon="tabler:layout-sidebar-right-expand"
        size="md"
        color="neutral"
        variant="soft"
        :aria-label="`Открыть «${article.title}» в панели`"
        @click.left.exact.prevent.stop="drawer.open()"
      />
    </template>
  </CardLink>
</template>
