<script setup lang="ts">
  import { getVttgDocsIndexRoute, isVttgDocsDevChannel } from '#shared/utils';
  import { useVttgDocsChannel, useVttgDocsIndex } from '~vttg-docs/composables';
  import {
    fetchVttgDocsPage,
    formatVttgDocsSubtitle,
    getVttgDocsLoadFailure,
    getVttgDocsPageDataKey,
    toVttgDocsRouteParam,
    VTTG_DOCS_DATE_FORMAT,
    VTTG_DOCS_DEV_NOTICE,
    VTTG_DOCS_DEV_NOTICE_ICON,
    VTTG_DOCS_DEV_ROBOTS,
    VTTG_DOCS_SECTIONS_ICON,
    VTTG_DOCS_SECTIONS_LABEL,
    VTTG_DOCS_SEO_TITLE_SEPARATOR,
    VTTG_DOCS_SKELETON_COUNT,
    VTTG_DOCS_TITLE,
  } from '~vttg-docs/model';
  import {
    VttgDocsArticle,
    VttgDocsChannelSwitch,
    VttgDocsLoadResult,
    VttgDocsPager,
    VttgDocsSidebar,
    VttgDocsToc,
  } from '~vttg-docs/ui';

  const route = useRoute();
  const requestFetch = useRequestFetch();
  const { format } = useDayjs();
  const channel = useVttgDocsChannel();

  const groupSlug = computed(() => toVttgDocsRouteParam(route.params.group));
  const pageSlug = computed(() => toVttgDocsRouteParam(route.params.page));

  const { index, channels } = await useVttgDocsIndex(channel);

  const {
    data: page,
    status: pageStatus,
    error: pageError,
    refresh: refreshPage,
  } = await useAsyncData(
    () =>
      getVttgDocsPageDataKey(channel.value, groupSlug.value, pageSlug.value),
    () =>
      fetchVttgDocsPage(
        requestFetch,
        channel.value,
        groupSlug.value,
        pageSlug.value,
      ),
  );

  const isDevChannel = computed(() => isVttgDocsDevChannel(channel.value));
  const isLoading = computed(() => pageStatus.value === 'pending');
  const isSectionsOpen = ref(false);

  const failure = computed(() =>
    pageError.value ? getVttgDocsLoadFailure(pageError.value) : null,
  );

  /** Подсказку про dev-канал не показываем поверх заглушки «нет доступа». */
  const isDevNoticeShown = computed(() => isDevChannel.value && !failure.value);

  const subtitle = computed(() => {
    if (!page.value) {
      return undefined;
    }

    const { group, version, releaseDate } = page.value;

    return formatVttgDocsSubtitle({
      groupTitle: group.title,
      version,
      formattedReleaseDate: releaseDate
        ? format(releaseDate, VTTG_DOCS_DATE_FORMAT)
        : undefined,
    });
  });

  const backTo = computed(() => getVttgDocsIndexRoute(channel.value));

  useSeoMeta({
    title: () =>
      page.value
        ? `${page.value.page.title}${VTTG_DOCS_SEO_TITLE_SEPARATOR}${VTTG_DOCS_TITLE}`
        : VTTG_DOCS_TITLE,
    description: () => page.value?.page.description ?? undefined,
    robots: () => (isDevChannel.value ? VTTG_DOCS_DEV_ROBOTS : undefined),
  });

  // Выбор страницы в выезжающем меню на телефоне закрывает меню.
  watch([groupSlug, pageSlug], () => {
    isSectionsOpen.value = false;
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    wide
    :title="page?.page.title"
    :subtitle
    :back-to
  >
    <template #actions>
      <VttgDocsChannelSwitch
        :channels
        :channel
      />

      <USlideover
        v-if="index"
        v-model:open="isSectionsOpen"
        side="left"
        :title="VTTG_DOCS_SECTIONS_LABEL"
        :ui="{ content: 'max-w-xs' }"
      >
        <UButton
          class="lg:hidden"
          color="neutral"
          variant="subtle"
          size="sm"
          :icon="VTTG_DOCS_SECTIONS_ICON"
          :label="VTTG_DOCS_SECTIONS_LABEL"
        />

        <template #body>
          <VttgDocsSidebar
            :index
            :channel
            :active-group="groupSlug"
            :active-page="pageSlug"
          />
        </template>
      </USlideover>
    </template>

    <div
      class="grid grid-cols-1 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_14rem]"
    >
      <aside class="hidden lg:block">
        <div class="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <VttgDocsSidebar
            v-if="index"
            :index
            :channel
            :active-group="groupSlug"
            :active-page="pageSlug"
          />
        </div>
      </aside>

      <div class="flex min-w-0 flex-col gap-6">
        <UAlert
          v-if="isDevNoticeShown"
          color="warning"
          variant="subtle"
          :icon="VTTG_DOCS_DEV_NOTICE_ICON"
          :description="VTTG_DOCS_DEV_NOTICE"
        />

        <div
          v-if="isLoading"
          class="flex flex-col gap-3"
        >
          <USkeleton
            v-for="skeleton in VTTG_DOCS_SKELETON_COUNT"
            :key="skeleton"
            class="h-5 w-full"
          />
        </div>

        <VttgDocsLoadResult
          v-else-if="failure"
          :failure
          @retry="refreshPage()"
        />

        <template v-else-if="page">
          <VttgDocsArticle :html="page.html" />

          <VttgDocsPager
            :channel
            :previous="page.previous"
            :next="page.next"
          />
        </template>
      </div>

      <aside class="hidden xl:block">
        <div class="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <VttgDocsToc
            v-if="page"
            :headings="page.headings"
          />
        </div>
      </aside>
    </div>
  </NuxtLayout>
</template>
