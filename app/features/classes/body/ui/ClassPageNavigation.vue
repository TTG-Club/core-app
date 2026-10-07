<script setup lang="ts">
  import type { ClassFeature } from '../../model';

  import {
    CLASS_NAVIGATION_LINK_DEPTH,
    CLASS_NAVIGATION_TITLE,
    CLASS_SECTION_ANCHOR,
    CLASS_SECTION_LABEL,
    getSectionHeadingId,
  } from './constants';

  interface ClassNavigationLink {
    id: string;
    text: string;
    depth: number;
  }

  const {
    features,
    hasEquipment = false,
    hasDescription = false,
  } = defineProps<{
    features: Array<ClassFeature>;
    hasEquipment?: boolean;
    hasDescription?: boolean;
  }>();

  const nuxtApp = useNuxtApp();

  const links = computed<Array<ClassNavigationLink>>(() => {
    const sections: Array<ClassNavigationLink> = [
      {
        id: CLASS_SECTION_ANCHOR.table,
        text: CLASS_SECTION_LABEL.table,
        depth: CLASS_NAVIGATION_LINK_DEPTH,
      },
      {
        id: CLASS_SECTION_ANCHOR.proficiency,
        text: CLASS_SECTION_LABEL.proficiency,
        depth: CLASS_NAVIGATION_LINK_DEPTH,
      },
    ];

    if (hasEquipment) {
      sections.push({
        id: CLASS_SECTION_ANCHOR.equipment,
        text: CLASS_SECTION_LABEL.equipment,
        depth: CLASS_NAVIGATION_LINK_DEPTH,
      });
    }

    sections.push(
      ...features.map((feature) => ({
        id: feature.key,
        text: feature.name,
        depth: CLASS_NAVIGATION_LINK_DEPTH,
      })),
    );

    if (hasDescription) {
      sections.push({
        id: CLASS_SECTION_ANCHOR.description,
        text: CLASS_SECTION_LABEL.description,
        depth: CLASS_NAVIGATION_LINK_DEPTH,
      });
    }

    return sections.map((section) => ({
      ...section,
      id: getSectionHeadingId(section.id),
    }));
  });

  /**
   * Пересобирает список отслеживаемых разделов.
   *
   * `UContentToc` ищет разделы в DOM только по хукам смены страницы, а в
   * сплит-панели класс меняется без неё. Других слушателей у этого хука нет.
   */
  function refreshObservedSections(): void {
    nuxtApp.callHook('page:transition:finish');
  }

  /**
   * Перехватывает клик по пункту до `UContentToc`: тот делает
   * `router.push('#якорь')`, что в сплит-панели теряет `?detail=` и закрывает
   * класс, а прокручивает окно, хотя скроллится панель. Поэтому прокручиваем
   * ближайший контейнер сами и URL не трогаем.
   *
   * @param event Клик внутри навигации.
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

    document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  onMounted(refreshObservedSections);

  watch(links, refreshObservedSections, { flush: 'post' });
</script>

<template>
  <!-- Липнет обёртка: внутри неё перехватываем клики до UContentToc -->
  <div
    class="sticky top-0"
    @click.capture="handleLinkClick"
  >
    <UContentToc
      :links
      :title="CLASS_NAVIGATION_TITLE"
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
