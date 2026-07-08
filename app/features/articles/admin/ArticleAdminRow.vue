<script setup lang="ts">
  import type { ArticleShortResponse } from '../model';

  import {
    ARTICLE_DATETIME_FORMAT,
    ARTICLE_STATUS_COLORS,
    ARTICLES_ADMIN_ROUTE,
  } from '../model';

  const {
    article,
    deleting = false,
    toggling = false,
  } = defineProps<{
    article: ArticleShortResponse;
    deleting?: boolean;
    toggling?: boolean;
  }>();

  const emit = defineEmits<{
    'delete': [url: string];
    'toggle-active': [url: string, active: boolean];
  }>();

  const { format } = useDayjs();

  const formattedDate = computed(() =>
    article.publishDateTime
      ? format(article.publishDateTime, ARTICLE_DATETIME_FORMAT)
      : '—',
  );

  const editUrl = computed(() => `${ARTICLES_ADMIN_ROUTE}/${article.url}`);

  function handleDelete(): void {
    emit('delete', article.url);
  }

  function handleToggleActive(value: boolean): void {
    emit('toggle-active', article.url, value);
  }
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-xl border border-default bg-elevated px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <NuxtLink
        :to="editUrl"
        class="truncate font-medium text-highlighted hover:text-primary"
      >
        {{ article.title }}
      </NuxtLink>

      <span class="truncate text-xs text-muted">/{{ article.url }}</span>
    </div>

    <UBadge
      color="neutral"
      variant="subtle"
      size="sm"
      class="shrink-0"
    >
      {{ article.typeName }}
    </UBadge>

    <span class="shrink-0 text-sm text-secondary sm:w-40">
      {{ formattedDate }}
    </span>

    <UTooltip
      v-if="!article.draft"
      :text="
        article.active
          ? 'Активна — снять с публикации'
          : 'Неактивна — сделать активной'
      "
    >
      <USwitch
        :model-value="article.active"
        :loading="toggling"
        :disabled="toggling"
        size="sm"
        class="shrink-0"
        :aria-label="article.active ? 'Снять с публикации' : 'Сделать активной'"
        @update:model-value="handleToggleActive"
      />
    </UTooltip>

    <UBadge
      :color="ARTICLE_STATUS_COLORS[article.status]"
      variant="subtle"
      size="sm"
      class="shrink-0"
    >
      {{ article.statusName }}
    </UBadge>

    <UTooltip
      v-if="article.accessibleByLink"
      text="Доступна по прямой ссылке"
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
        aria-label="Редактировать"
      />

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="sm"
        :loading="deleting"
        aria-label="Скрыть запись"
        @click.left.exact.prevent="handleDelete"
      />
    </div>
  </div>
</template>
