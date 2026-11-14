<script setup lang="ts">
  import type { CommunityNewsShortResponse } from '../model';

  import {
    COMMUNITY_NEWS_ADMIN_TEXT,
    COMMUNITY_NEWS_DATETIME_FORMAT,
    COMMUNITY_NEWS_STATUS_COLORS,
    getCommunityNewsEditRoute,
  } from '../model';

  const {
    news,
    deleting = false,
    toggling = false,
  } = defineProps<{
    news: CommunityNewsShortResponse;
    deleting?: boolean;
    toggling?: boolean;
  }>();

  const emit = defineEmits<{
    'delete': [url: string];
    'toggle-active': [url: string, active: boolean];
  }>();

  const { format } = useDayjs();

  const formattedDate = computed(() =>
    news.publishDateTime
      ? format(news.publishDateTime, COMMUNITY_NEWS_DATETIME_FORMAT)
      : COMMUNITY_NEWS_ADMIN_TEXT.emptyDate,
  );

  const editUrl = computed(() => getCommunityNewsEditRoute(news.url));

  const toggleTooltip = computed(() =>
    news.active
      ? COMMUNITY_NEWS_ADMIN_TEXT.activeTooltip
      : COMMUNITY_NEWS_ADMIN_TEXT.inactiveTooltip,
  );

  const toggleLabel = computed(() =>
    news.active
      ? COMMUNITY_NEWS_ADMIN_TEXT.deactivate
      : COMMUNITY_NEWS_ADMIN_TEXT.activate,
  );

  /** Просит скрыть новость (подтверждение — на странице списка). */
  function handleDelete(): void {
    emit('delete', news.url);
  }

  /** Включает или снимает новость с публикации. */
  function handleToggleActive(value: boolean): void {
    emit('toggle-active', news.url, value);
  }
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-xl border border-default bg-elevated px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <NuxtLink
        :to="editUrl"
        class="flex min-w-0 items-center gap-1.5 font-medium text-highlighted hover:text-primary"
      >
        <UIcon
          v-if="news.videoUrl"
          name="tabler:video"
          class="size-4 shrink-0 text-muted"
        />

        <span class="truncate">{{ news.title }}</span>
      </NuxtLink>

      <span class="truncate text-xs text-muted">
        /{{ news.url }}
        <template v-if="news.authorName">· {{ news.authorName }}</template>
      </span>
    </div>

    <span class="shrink-0 text-sm text-secondary sm:w-40">
      {{ formattedDate }}
    </span>

    <UTooltip
      v-if="!news.draft"
      :text="toggleTooltip"
    >
      <USwitch
        :model-value="news.active"
        :loading="toggling"
        :disabled="toggling"
        size="sm"
        class="shrink-0"
        :aria-label="toggleLabel"
        @update:model-value="handleToggleActive"
      />
    </UTooltip>

    <UBadge
      :color="COMMUNITY_NEWS_STATUS_COLORS[news.status]"
      variant="subtle"
      size="sm"
      class="shrink-0"
    >
      {{ news.statusName }}
    </UBadge>

    <UTooltip
      v-if="!news.active && news.accessibleByLink"
      :text="COMMUNITY_NEWS_ADMIN_TEXT.accessibleByLink"
    >
      <UIcon
        name="tabler:link"
        class="size-4 shrink-0 text-muted"
      />
    </UTooltip>

    <div class="flex shrink-0 items-center gap-1">
      <UButton
        :to="editUrl"
        icon="tabler:pencil"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-label="COMMUNITY_NEWS_ADMIN_TEXT.edit"
      />

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="sm"
        :loading="deleting"
        :aria-label="COMMUNITY_NEWS_ADMIN_TEXT.hideNews"
        @click.left.exact.prevent="handleDelete"
      />
    </div>
  </div>
</template>
