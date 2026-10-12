<script setup lang="ts">
  import type { MarkupHeadingAnchor } from '~ui/markup';

  import { ARTICLE_TOC_INDENT, ARTICLE_TOC_TITLE } from '../model';

  const { headings } = defineProps<{
    headings: Array<MarkupHeadingAnchor>;
  }>();

  const links = computed(() =>
    headings.map((heading) => ({
      ...heading,
      href: `#${heading.id}`,
      indentClass: ARTICLE_TOC_INDENT[heading.level],
    })),
  );

  /**
   * Плавно прокручивает ближайший прокручиваемый контейнер к заголовку. Адрес
   * не трогаем: в дровере и предпросмотре редактора смена якоря в URL лишняя,
   * а `scrollIntoView` сам найдёт, что прокручивать — окно или панель.
   *
   * @param headingId - Id заголовка в тексте статьи
   */
  function scrollToHeading(headingId: string): void {
    document.getElementById(headingId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
</script>

<template>
  <nav
    class="flex w-full flex-col gap-2 rounded-md bg-hover p-4"
    :aria-label="ARTICLE_TOC_TITLE"
  >
    <span class="font-bold">{{ ARTICLE_TOC_TITLE }}</span>

    <ul class="flex flex-col gap-1.5 text-sm">
      <li
        v-for="link in links"
        :key="link.id"
        :class="link.indentClass"
      >
        <a
          :href="link.href"
          class="text-toned transition-colors hover:text-highlighted"
          @click.left.exact.prevent="scrollToHeading(link.id)"
        >
          {{ link.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>
