<script setup lang="ts">
  import type { DropdownMenuItem, TimelineItem } from '@nuxt/ui';

  import type { NameResponse, SourceResponse } from '~/shared/types';

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

  const LIMIT_VALUES = [5, 10, 20, 50, 100];
  const DEFAULT_LIMIT = 10;

  const selectedLimit = useLocalStorage('recent-changes-limit', DEFAULT_LIMIT, {
    initOnMounted: true,
  });

  const { format } = useDayjs();

  /**
   * Опции выпадающего списка для выбора лимита отображаемых записей
   *
   * @returns Массив опций с label, состоянием checked и обработчиком выбора
   */
  const limitOptions = computed<DropdownMenuItem[]>(() =>
    LIMIT_VALUES.map((value) => ({
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
   * @returns имя иконки из коллекции ttg или fluent
   */
  function getActionIcon(actionType: ActionType): string {
    switch (actionType) {
      case ActionType.ADDED:
        return 'i-ttg-plus';
      case ActionType.UPDATED:
        return 'i-fluent-arrow-sync-16-regular';
      case ActionType.DELETED:
        return 'i-ttg-remove';
      default:
        return 'i-fluent-circle-16-regular';
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
  <UCard
    :ui="{
      root: 'bg-muted',
      header: 'p-3 sm:p-3',
      body: 'p-0 sm:p-0',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col gap-2">
          <h3 class="text-base leading-none font-medium">
            Обновления на сайте
          </h3>

          <div class="text-xs leading-none text-muted">
            Последние: {{ selectedLimit }}
          </div>
        </div>

        <div class="flex gap-2">
          <UDropdownMenu
            :items="limitOptions"
            :ui="{ content: 'w-auto min-w-fit' }"
          >
            <template #default>
              <UButton
                variant="soft"
                size="sm"
                trailing-icon="i-fluent-chevron-down-16-regular"
              >
                {{ selectedLimit }}
              </UButton>
            </template>
          </UDropdownMenu>

          <UButton
            :loading="pending"
            variant="soft"
            size="sm"
            icon="i-fluent-arrow-sync-16-regular"
            @click.left.exact.prevent="refresh()"
          />
        </div>
      </div>
    </template>

    <UAlert
      v-if="status === 'error'"
      title="Не удалось загрузить обновления"
      description="Попробуйте обновить еще раз"
      class="rounded-none"
      variant="soft"
      color="error"
    />

    <UScrollArea
      v-else
      class="max-h-125 min-h-0"
      :ui="{
        viewport: 'p-3',
      }"
    >
      <div
        v-if="showSkeleton"
        class="flex flex-col gap-4"
      >
        <div
          v-for="i in 5"
          :key="i"
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
              variant="soft"
              size="sm"
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
  </UCard>
</template>
