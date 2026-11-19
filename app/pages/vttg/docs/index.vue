<script setup lang="ts">
  import { getVttgDocsPageRoute, isVttgDocsDevChannel } from '#shared/utils';
  import { UiResult } from '~ui/result';
  import { useVttgDocsChannel, useVttgDocsIndex } from '~vttg-docs/composables';
  import {
    formatVttgDocsSubtitle,
    VTTG_DOCS_DATE_FORMAT,
    VTTG_DOCS_DESCRIPTION,
    VTTG_DOCS_DEV_NOTICE,
    VTTG_DOCS_DEV_NOTICE_ICON,
    VTTG_DOCS_EMPTY_DESCRIPTION,
    VTTG_DOCS_EMPTY_TITLE,
    VTTG_DOCS_PRIVATE_ROBOTS,
    VTTG_DOCS_SKELETON_COUNT,
    VTTG_DOCS_TITLE,
  } from '~vttg-docs/model';
  import { VttgDocsChannelSwitch, VttgDocsLoadResult } from '~vttg-docs/ui';

  const { format } = useDayjs();
  const channel = useVttgDocsChannel();

  const { index, channels, isPublic, failure, isLoading, refresh } =
    await useVttgDocsIndex(channel);

  const isDevChannel = computed(() => isVttgDocsDevChannel(channel.value));

  /** Подсказку про dev-канал не показываем поверх заглушки «нет доступа». */
  const isDevNoticeShown = computed(() => isDevChannel.value && !failure.value);

  useSeoMeta({
    title: VTTG_DOCS_TITLE,
    description: VTTG_DOCS_DESCRIPTION,
    robots: () => (isPublic.value ? undefined : VTTG_DOCS_PRIVATE_ROBOTS),
  });

  const versionLabel = computed(() => {
    if (!index.value) {
      return undefined;
    }

    const { version, releaseDate } = index.value;

    return formatVttgDocsSubtitle({
      version,
      formattedReleaseDate: releaseDate
        ? format(releaseDate, VTTG_DOCS_DATE_FORMAT)
        : undefined,
    });
  });

  /** Группы с готовыми адресами страниц. */
  const groups = computed(() =>
    (index.value?.groups ?? []).map((group) => ({
      ...group,
      pages: group.pages.map((page) => ({
        ...page,
        to: getVttgDocsPageRoute(channel.value, {
          groupSlug: group.slug,
          pageSlug: page.slug,
        }),
      })),
    })),
  );

  const hasGroups = computed(() => groups.value.length > 0);
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="VTTG_DOCS_TITLE"
    :subtitle="versionLabel"
  >
    <template #actions>
      <VttgDocsChannelSwitch
        :channels
        :channel
      />
    </template>

    <div class="flex flex-col gap-4">
      <p class="text-sm leading-6 text-toned">
        {{ VTTG_DOCS_DESCRIPTION }}
      </p>

      <UAlert
        v-if="isDevNoticeShown"
        color="warning"
        variant="subtle"
        :icon="VTTG_DOCS_DEV_NOTICE_ICON"
        :description="VTTG_DOCS_DEV_NOTICE"
      />

      <div
        v-if="isLoading"
        class="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <USkeleton
          v-for="skeleton in VTTG_DOCS_SKELETON_COUNT"
          :key="skeleton"
          class="h-40 w-full"
        />
      </div>

      <VttgDocsLoadResult
        v-else-if="failure"
        :failure
        @retry="refresh()"
      />

      <UiResult
        v-else-if="!hasGroups"
        status="info"
        :title="VTTG_DOCS_EMPTY_TITLE"
        :sub-title="VTTG_DOCS_EMPTY_DESCRIPTION"
      />

      <div
        v-else
        class="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <UCard
          v-for="group in groups"
          :key="group.slug"
          variant="subtle"
        >
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <h3 class="text-lg font-semibold text-highlighted">
                {{ group.title }}
              </h3>

              <p
                v-if="group.description"
                class="text-sm text-muted"
              >
                {{ group.description }}
              </p>
            </div>

            <ul class="flex flex-col gap-2">
              <li
                v-for="page in group.pages"
                :key="page.slug"
              >
                <ULink
                  :to="page.to"
                  class="flex flex-col"
                >
                  <span class="text-sm font-medium text-primary">
                    {{ page.title }}
                  </span>

                  <span
                    v-if="page.description"
                    class="text-xs text-muted"
                  >
                    {{ page.description }}
                  </span>
                </ULink>
              </li>
            </ul>
          </div>
        </UCard>
      </div>
    </div>
  </NuxtLayout>
</template>
