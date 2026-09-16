<script setup lang="ts">
  import type { DropdownMenuItem, TimelineItem } from '@nuxt/ui';

  import type { NameResponse, SourceResponse } from '~/shared/types';

  import {
    RECENT_CHANGES_DEFAULT_LIMIT,
    RECENT_CHANGES_ERROR_DESCRIPTION,
    RECENT_CHANGES_ERROR_TITLE,
    RECENT_CHANGES_LIMIT_LABEL,
    RECENT_CHANGES_LIMIT_STORAGE_KEY,
    RECENT_CHANGES_LIMIT_VALUES,
    RECENT_CHANGES_REFRESH_LABEL,
  } from './model';

  enum ActionType {
    ADDED = 'ADDED',
    UPDATED = 'UPDATED',
    DELETED = 'DELETED',
  }

  interface RecentChangeItem {
    url: string;
    updatedAt: string;
    action: {
      name: string;
      type: ActionType;
      color: 'success' | 'error' | 'info';
    };
    name: NameResponse;
    source?: SourceResponse;
  }

  const selectedLimit = useLocalStorage(
    RECENT_CHANGES_LIMIT_STORAGE_KEY,
    RECENT_CHANGES_DEFAULT_LIMIT,
    { initOnMounted: true },
  );

  const { format } = useDayjs();

  /**
   * Опции выпадающего списка для выбора лимита отображаемых записей
   *
   * @returns Массив опций с label, состоянием checked и обработчиком выбора
   */
  const limitOptions = computed<DropdownMenuItem[]>(() =>
    RECENT_CHANGES_LIMIT_VALUES.map((value) => ({
      label: String(value),
      checked: selectedLimit.value === value,
      type: 'checkbox' as const,
      onSelect: () => {
        selectedLimit.value = value;
      },
    })),
  );

  /**
   * Возвращает иконку для типа действия
   *
   * @param actionType - название действия
   * @returns имя иконки из коллекции ttg или tabler
   */
  function getActionIcon(actionType: ActionType): string {
    switch (actionType) {
      case ActionType.ADDED:
        return 'tabler:plus';
      case ActionType.UPDATED:
        return 'tabler:refresh';
      case ActionType.DELETED:
        return 'tabler:trash';
      default:
        return 'tabler:circle';
    }
  }

  const {
    data: updates,
    status,
    pending,
    refresh,
  } = await useAsyncData<Array<RecentChangeItem>>(
    'recent-changes',
    () =>
      $fetch<Array<RecentChangeItem>>('/api/v2/last/update', {
        query: { top: selectedLimit.value },
      }),
    {
      dedupe: 'defer',
      default: () => [],
      lazy: true,
      server: false,
      immediate: false,
      watch: [selectedLimit],
    },
  );

  onMounted(() => {
    refresh();
  });

  const timelineItems = computed<Array<TimelineItem & RecentChangeItem>>(() =>
    updates.value.map((update) => ({
      ...update,
      date: format(update.updatedAt),
      icon: getActionIcon(update.action.type),
    })),
  );

  const showSkeleton = computed(
    () =>
      (status.value === 'idle' || pending.value) && !timelineItems.value.length,
  );
</script>

<template>
  <!-- Лента без собственной оправы: панель и переключатель вкладок держит
    HomeActivity. Управление лимитом и обновлением переехало из шапки панели
    в тело — шапку занял переключатель. -->
  <div class="flex min-h-0 flex-col xl:h-full">
    <div
      class="flex shrink-0 items-center justify-end gap-1 border-b border-default px-2 py-1.5"
    >
      <UDropdownMenu
        :items="limitOptions"
        :ui="{ content: 'w-auto min-w-fit' }"
      >
        <UButton
          trailing-icon="tabler:chevron-down"
          color="neutral"
          variant="ghost"
          size="xs"
          class="font-mono"
          :aria-label="RECENT_CHANGES_LIMIT_LABEL"
        >
          {{ selectedLimit }}
        </UButton>
      </UDropdownMenu>

      <UButton
        :loading="pending"
        variant="ghost"
        color="neutral"
        size="xs"
        icon="tabler:refresh"
        :aria-label="RECENT_CHANGES_REFRESH_LABEL"
        @click.left.exact.prevent="refresh()"
      />
    </div>

    <UAlert
      v-if="status === 'error'"
      :title="RECENT_CHANGES_ERROR_TITLE"
      :description="RECENT_CHANGES_ERROR_DESCRIPTION"
      class="rounded-none"
      variant="soft"
      color="error"
    />

    <UScrollArea
      v-else
      class="max-h-150 min-h-0 xl:max-h-none xl:flex-1"
      :ui="{ viewport: 'p-3' }"
    >
      <div
        v-if="showSkeleton"
        class="flex flex-col gap-4"
      >
        <div
          v-for="index in RECENT_CHANGES_DEFAULT_LIMIT"
          :key="index"
          class="flex gap-4"
        >
          <div class="flex flex-col items-center gap-2">
            <USkeleton class="size-4 rounded-full" />

            <USkeleton class="h-full w-0.5" />
          </div>

          <div class="flex flex-1 flex-col gap-2 pb-4">
            <USkeleton class="h-4 w-24" />

            <USkeleton class="h-5 w-3/4" />
          </div>
        </div>
      </div>

      <UTimeline
        v-else
        :items="timelineItems"
        color="primary"
        :ui="{
          indicator: 'bg-border',
          separator: 'border-l-2 border-default',
          item: 'last:*:data-[slot=wrapper]:pb-1.5',
          date: 'font-mono text-[11px] tracking-wide uppercase',
        }"
      >
        <template #indicator="{ item }">
          <UTooltip :text="item.action.name">
            <div class="flex size-full items-center justify-center">
              <UIcon
                :name="item.icon"
                class="size-4"
              />
            </div>
          </UTooltip>
        </template>

        <template #date="{ item }">
          <div class="flex items-center gap-2">
            <span>{{ item.date }}</span>

            <UBadge
              v-if="item.source"
              color="neutral"
              variant="subtle"
              size="sm"
              class="normal-case"
            >
              {{ item.source.name.label }}
            </UBadge>
          </div>
        </template>

        <template #title="{ item }">
          <NuxtLink
            :to="item.url"
            class="font-medium hover:underline"
          >
            {{ item.name.rus }}

            <span
              v-if="item.name.eng"
              class="text-muted"
            >
              [{{ item.name.eng }}]
            </span>
          </NuxtLink>
        </template>
      </UTimeline>
    </UScrollArea>
  </div>
</template>
