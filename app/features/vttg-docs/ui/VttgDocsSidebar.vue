<script setup lang="ts">
  import type { NavigationMenuItem } from '@nuxt/ui';

  import type { VttgDocsChannel } from '#shared/consts';
  import type { VttgDocsIndex } from '#shared/types';

  import { getVttgDocsPageRoute } from '#shared/utils';

  import { VTTG_DOCS_SIDEBAR_ACTIVE_CLASS } from '../model';

  /**
   * Оглавление канала: группы подписями, страницы ссылками. Открытая страница
   * выделена основным цветом.
   */
  const {
    index,
    channel,
    activeGroup = undefined,
    activePage = undefined,
  } = defineProps<{
    index: VttgDocsIndex;
    channel: VttgDocsChannel;
    activeGroup?: string;
    activePage?: string;
  }>();

  const navigationGroups = computed<NavigationMenuItem[][]>(() =>
    index.groups.map((group) => [
      { label: group.title, type: 'label' },
      ...group.pages.map<NavigationMenuItem>((page) => {
        const isActive = group.slug === activeGroup && page.slug === activePage;

        return {
          label: page.title,
          to: getVttgDocsPageRoute(channel, {
            groupSlug: group.slug,
            pageSlug: page.slug,
          }),
          active: isActive,
          class: isActive ? VTTG_DOCS_SIDEBAR_ACTIVE_CLASS : undefined,
        };
      }),
    ]),
  );
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    color="primary"
    :highlight="false"
    :items="navigationGroups"
    class="w-full"
    :ui="{ link: 'text-sm', label: 'pt-3 first:pt-1' }"
  />
</template>
