<script setup lang="ts">
  import type { ClassFeature } from '../../model';

  import {
    CLASS_NAVIGATION_LINK_DEPTH,
    CLASS_NAVIGATION_TITLE,
    CLASS_SECTION_ANCHOR,
    CLASS_SECTION_LABEL,
    getClassNavigationMarkerId,
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

  const sectionElements = shallowRef<Array<HTMLElement>>([]);
  const visibleSectionIds = new Set<string>();
  const activeSectionId = ref<string>();

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

    return sections;
  });

  /**
   * `UContentToc` подсвечивает все разделы, которые видны на экране, а нужен
   * один. Поэтому вместо разделов он следит за метками внутри навигации:
   * показана всегда только метка текущего раздела.
   */
  const markerLinks = computed<Array<ClassNavigationLink>>(() =>
    links.value.map((link) => ({
      ...link,
      id: getClassNavigationMarkerId(link.id),
    })),
  );

  /**
   * Пересобирает список отслеживаемых разделов.
   *
   * `UContentToc` ищет метки в DOM только по хукам смены страницы, а в
   * сплит-панели класс меняется без неё. Других слушателей у этого хука нет.
   */
  function refreshObservedSections(): void {
    visibleSectionIds.clear();

    sectionElements.value = links.value.flatMap((link) => {
      const element = document.getElementById(link.id);

      return element ? [element] : [];
    });

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
    const markerId = link?.getAttribute('href')?.slice(1);

    if (!markerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const section = links.value.find(
      (item) => getClassNavigationMarkerId(item.id) === markerId,
    );

    if (!section) {
      return;
    }

    document.getElementById(section.id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // Текущий раздел — верхний из видимых; если не виден ни один, остаётся прежний
  useIntersectionObserver(sectionElements, (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visibleSectionIds.add(entry.target.id);
      } else {
        visibleSectionIds.delete(entry.target.id);
      }
    }

    const topVisibleSection = links.value.find((link) =>
      visibleSectionIds.has(link.id),
    );

    if (topVisibleSection) {
      activeSectionId.value = topVisibleSection.id;
    }
  });

  onMounted(refreshObservedSections);

  watch(links, refreshObservedSections, { flush: 'post' });
</script>

<template>
  <!-- Липнет обёртка: внутри неё перехватываем клики до UContentToc -->
  <div
    class="sticky top-4"
    @click.capture="handleLinkClick"
  >
    <span
      v-for="link in links"
      v-show="link.id === activeSectionId"
      :id="getClassNavigationMarkerId(link.id)"
      :key="link.id"
      class="pointer-events-none absolute size-px"
      aria-hidden="true"
    />

    <UContentToc
      :links="markerLinks"
      :title="CLASS_NAVIGATION_TITLE"
      color="neutral"
      highlight
      highlight-variant="circuit"
      :ui="{
        root: 'static z-auto mx-0 px-0 sm:mx-0 sm:px-0 bg-transparent lg:bg-transparent backdrop-blur-none max-h-[calc(100dvh-2rem)]',
        container: 'p-0! border-0',
      }"
    />
  </div>
</template>
