<script setup lang="ts">
  import type { MarkupHeadingAnchor } from '~ui/markup';

  import { ARTICLE_TOC_TITLE, buildArticleTocLinks } from '../model';

  const { headings } = defineProps<{
    headings: Array<MarkupHeadingAnchor>;
  }>();

  const nuxtApp = useNuxtApp();
  const route = useRoute();
  const router = useRouter();

  const links = computed(() => buildArticleTocLinks(headings));

  /**
   * Прокручивает ближайший прокручиваемый контейнер к заголовку статьи.
   *
   * @param headingId - Id заголовка в тексте статьи
   * @param behavior - Плавно при клике, сразу при открытии ссылки с якорем
   */
  function scrollToHeading(
    headingId: string,
    behavior: 'smooth' | 'instant',
  ): void {
    document.getElementById(headingId)?.scrollIntoView({
      behavior,
      block: 'start',
    });
  }

  /**
   * Находит заголовок статьи по якорю из адреса. Чужие якоря (например,
   * комментариев) заголовками не считаются.
   *
   * @param hash - Якорь адреса вместе с `#`, роутер отдаёт его раскодированным
   * @returns Заголовок или `undefined`
   */
  function findHeadingByHash(hash: string): MarkupHeadingAnchor | undefined {
    const headingId = hash.slice(1);

    return headings.find((heading) => heading.id === headingId);
  }

  /**
   * Пересобирает список отслеживаемых заголовков для подсветки.
   *
   * `UContentToc` ищет заголовки в DOM только по хукам смены страницы, а текст
   * статьи рисуется на клиенте (`MarkupRender` в `ClientOnly`) и меняется в
   * предпросмотре редактора без смены страницы. Других слушателей у хука нет.
   */
  function refreshObservedHeadings(): void {
    nuxtApp.callHook('page:transition:finish');
  }

  /**
   * Перехватывает клик по пункту до `UContentToc`: тот делает
   * `router.push('#якорь')`, что добавляет запись в историю, теряет query и
   * прокручивает окно, хотя статья может скроллиться в панели. Поэтому
   * прокручиваем ближайший контейнер сами, а в адресе меняем только якорь.
   *
   * @param event - Клик внутри содержания
   */
  function handleLinkClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) {
      return;
    }

    const link = event.target.closest('a[data-slot="link"]');
    const href = link?.getAttribute('href');

    if (!href) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const heading = findHeadingByHash(decodeURIComponent(href));

    if (!heading) {
      return;
    }

    scrollToHeading(heading.id, 'smooth');

    // Замена, а не новая запись истории: «назад» уводит со страницы, а не
    // перебирает заголовки.
    router.replace({ query: route.query, hash: `#${heading.id}` });
  }

  onMounted(() => {
    // Текст статьи появляется следующим рендером: ClientOnly у MarkupRender
    // включается в том же onMounted-проходе, поэтому заголовков в DOM ещё нет.
    nextTick(() => {
      refreshObservedHeadings();

      const heading = findHeadingByHash(route.hash);

      if (heading) {
        scrollToHeading(heading.id, 'instant');
      }
    });
  });

  watch(links, refreshObservedHeadings, { flush: 'post' });
</script>

<template>
  <!--
    Обёртка перехватывает клики до UContentToc. Липнет не она, а колонка в
    ArticleBody — вместе с тегами под содержанием.
  -->
  <div @click.capture="handleLinkClick">
    <UContentToc
      :links
      :title="ARTICLE_TOC_TITLE"
      color="neutral"
      highlight
      highlight-variant="circuit"
      :ui="{
        root: 'static z-auto mx-0 px-0 sm:mx-0 sm:px-0 bg-transparent lg:bg-transparent backdrop-blur-none max-h-[calc(100dvh-2rem)]',
        container: 'p-0 sm:p-0 lg:p-0 border-0',
      }"
    />
  </div>
</template>
