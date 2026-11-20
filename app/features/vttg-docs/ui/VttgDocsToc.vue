<script setup lang="ts">
  import type { VttgDocsHeading } from '#shared/types';

  import { useVttgDocsActiveHeading } from '../composables';
  import {
    getVttgDocsTocLinkClass,
    VTTG_DOCS_ANCHOR_PREFIX,
    VTTG_DOCS_TOC_TITLE,
  } from '../model';

  /**
   * Оглавление текущей страницы: заголовки второго и третьего уровня, тот, что
   * сейчас читают, подсвечен.
   */
  const { headings } = defineProps<{
    headings: VttgDocsHeading[];
  }>();

  const { scrollToAnchor } = useAnchorScroll();
  const { activeHeadingId } = useVttgDocsActiveHeading(() => headings);

  const headingLinks = computed(() =>
    headings.map((heading) => ({
      ...heading,
      href: `${VTTG_DOCS_ANCHOR_PREFIX}${heading.id}`,
      class: getVttgDocsTocLinkClass(
        heading.depth,
        heading.id === activeHeadingId.value,
      ),
    })),
  );

  const hasHeadingLinks = computed(() => headingLinks.value.length > 0);

  /**
   * Прокручивает к заголовку и ставит хэш — ссылку на раздел можно
   * скопировать из адресной строки.
   *
   * @param href якорь заголовка
   */
  function scrollToHeading(href: string): void {
    history.replaceState(history.state, '', href);
    scrollToAnchor(href);
  }
</script>

<template>
  <nav
    v-if="hasHeadingLinks"
    class="flex flex-col gap-2"
  >
    <span class="text-xs font-semibold text-highlighted">
      {{ VTTG_DOCS_TOC_TITLE }}
    </span>

    <div class="flex flex-col border-l border-default">
      <a
        v-for="link in headingLinks"
        :key="link.id"
        :href="link.href"
        class="-ml-px border-l py-1 text-sm leading-5 transition-colors"
        :class="link.class"
        @click.left.exact.prevent="scrollToHeading(link.href)"
      >
        {{ link.text }}
      </a>
    </div>
  </nav>
</template>
