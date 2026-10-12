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
  const route = useRoute();
  const router = useRouter();
  const { scrollToTop } = useAnchorScroll();

  /**
   * Разделы страницы по их якорям в адресе. Якорь — id раздела, а навигация
   * следит за его заголовком.
   */
  const sections = computed<Array<ClassNavigationLink>>(() => {
    const navigationSections: Array<ClassNavigationLink> = [
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
      navigationSections.push({
        id: CLASS_SECTION_ANCHOR.equipment,
        text: CLASS_SECTION_LABEL.equipment,
        depth: CLASS_NAVIGATION_LINK_DEPTH,
      });
    }

    navigationSections.push(
      ...features.map((feature) => ({
        id: feature.key,
        text: feature.name,
        depth: CLASS_NAVIGATION_LINK_DEPTH,
      })),
    );

    if (hasDescription) {
      navigationSections.push({
        id: CLASS_SECTION_ANCHOR.description,
        text: CLASS_SECTION_LABEL.description,
        depth: CLASS_NAVIGATION_LINK_DEPTH,
      });
    }

    return navigationSections;
  });

  const links = computed<Array<ClassNavigationLink>>(() =>
    sections.value.map((section) => ({
      ...section,
      id: getSectionHeadingId(section.id),
    })),
  );

  /**
   * Прокручивает ближайший прокручиваемый контейнер к заголовку раздела.
   *
   * @param sectionId Id раздела.
   * @param behavior Плавно при клике, сразу при открытии ссылки с якорем.
   */
  function scrollToSection(
    sectionId: string,
    behavior: 'smooth' | 'instant',
  ): void {
    const heading = document.getElementById(getSectionHeadingId(sectionId));

    if (!heading) {
      return;
    }

    // Над первым разделом стоит шапка страницы, поэтому «Основное» прокручивает
    // контейнер к самому началу, а не к разделу: иначе шапка остаётся срезанной.
    if (sectionId === CLASS_SECTION_ANCHOR.table) {
      scrollToTop({ behavior, offsetTop: 0 }, heading);

      return;
    }

    heading.scrollIntoView({ behavior, block: 'start' });
  }

  /**
   * Находит раздел страницы по якорю из адреса. Чужие якоря (например,
   * комментариев) не считаются разделами.
   *
   * @param hash Якорь адреса вместе с `#`, роутер отдаёт его раскодированным.
   */
  function findSectionByHash(hash: string): ClassNavigationLink | undefined {
    const sectionId = hash.slice(1);

    return sections.value.find((section) => section.id === sectionId);
  }

  /**
   * Открывает раздел из якоря ссылки, которой поделились.
   */
  function scrollToHashSection(): void {
    const section = findSectionByHash(route.hash);

    if (section) {
      scrollToSection(section.id, 'instant');
    }
  }

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
   * ближайший контейнер сами, а в адресе меняем только якорь: `detail` и
   * фильтры в query остаются как были.
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

    const headingId = decodeURIComponent(href.slice(1));

    const section = sections.value.find(
      (navigationSection) =>
        getSectionHeadingId(navigationSection.id) === headingId,
    );

    if (!section) {
      return;
    }

    scrollToSection(section.id, 'smooth');

    // Якорь меняем мимо роутера: на смену якоря он сам прокручивает окно к
    // разделу и перебивает нашу прокрутку, из-за чего «Основное» вставало
    // под шапку, а не к самому верху. Замена, а не новая запись истории:
    // «назад» уводит со страницы, а не перебирает разделы.
    const { href: sectionHref } = router.resolve({
      query: route.query,
      hash: `#${section.id}`,
    });

    window.history.replaceState(window.history.state, '', sectionHref);
  }

  onMounted(() => {
    refreshObservedSections();
    scrollToHashSection();
  });

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
