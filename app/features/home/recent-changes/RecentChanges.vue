<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';

  interface RecentChangeItem {
    url: string;
    updatedAt: string;
    action: {
      name: string;
      color?: 'success' | 'error' | 'info';
    };
    name: {
      rus: string;
      eng: string;
    };
    source?: {
      name: {
        label: string;
        rus: string;
        eng: string;
      };
      page?: number;
    };
  }

  type TimelineItem = RecentChangeItem & {
    date: string;
    title: string;
    description: string;
    icon: string;
    value: string;
    tooltip: string;
  };

  const STORAGE_KEY = 'recent-changes-limit';
  const DEFAULT_LIMIT = 10;

  const selectedLimit = ref<number>(DEFAULT_LIMIT);
  const isDropdownOpen = ref(false);

  const limitValues = [5, 10, 20, 50, 100];

  const dayjs = useDayjs();

  function getSavedLimit(): number | null {
    if (!import.meta.client) {
      return null;
    }

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return null;
    }

    const parsed = Number.parseInt(saved, 10);

    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  }

  const limitOptions = computed(() =>
    limitValues.map((value) => ({
      label: String(value),
      checked: selectedLimit.value === value,
      type: 'checkbox' as const,
      onSelect: () => {
        selectedLimit.value = value;
      },
    })),
  );

  function formatDateTime(iso: string): string {
    const date = dayjs(iso);

    return date.isValid() ? date.local().format('LLL') : iso;
  }

  function getActionType(actionName: string): 'added' | 'updated' | 'default' {
    const name = actionName.toLowerCase();

    if (
      name.includes('добавлен') ||
      name.includes('создан') ||
      name.includes('добав')
    ) {
      return 'added';
    }

    if (
      name.includes('обновлен') ||
      name.includes('изменен') ||
      name.includes('обнов')
    ) {
      return 'updated';
    }

    return 'default';
  }

  function getActionIcon(actionName: string): string {
    const type = getActionType(actionName);

    switch (type) {
      case 'added':
        return 'i-ttg-plus';
      case 'updated':
        return 'i-fluent-arrow-sync-16-regular';
      default:
        return 'i-lucide-circle';
    }
  }

  function getActionTooltip(actionName: string): string {
    const type = getActionType(actionName);

    switch (type) {
      case 'added':
        return 'Добавлено';
      case 'updated':
        return 'Обновлено';
      default:
        return '';
    }
  }

  const {
    data: updates,
    status,
    pending,
    refresh,
  } = await useAsyncData<Array<RecentChangeItem>>(
    () => `recent-changes-limit-${selectedLimit.value}`,
    () =>
      $fetch<Array<RecentChangeItem>>('/api/v2/last/update', {
        query: { top: selectedLimit.value },
      }),
    {
      dedupe: 'defer',
      default: () => [],
    },
  );

  const timelineItems = computed<Array<TimelineItem>>(() => {
    return updates.value.map((update) => ({
      ...update,
      date: formatDateTime(update.updatedAt),
      title: update.name.rus,
      description: '',
      icon: getActionIcon(update.action.name),
      tooltip: getActionTooltip(update.action.name),
      value: `${update.url}-${update.updatedAt}`,
    }));
  });

  watch(
    selectedLimit,
    async (newLimit) => {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, String(newLimit));
      }

      await refresh();
    },
    { flush: 'post' },
  );

  onMounted(() => {
    const savedLimit = getSavedLimit();

    if (savedLimit !== null && savedLimit !== selectedLimit.value) {
      selectedLimit.value = savedLimit;
    }
  });
</script>

<template>
  <UCard :ui="{ root: 'bg-muted', header: 'p-3 sm:p-3', body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col gap-2">
          <h3 class="text-base leading-none font-medium">
            Обновления на сайте
          </h3>

          <div class="text-xs leading-none text-gray-500">
            Последние: {{ selectedLimit }}
          </div>
        </div>

        <div class="flex gap-2">
          <UDropdownMenu
            v-model:open="isDropdownOpen"
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
            @click="refresh()"
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
      class="max-h-[500px]"
      :ui="{
        viewport: 'p-3',
      }"
    >
      <UTimeline
        :items="timelineItems"
        color="primary"
        :ui="{
          indicator: 'bg-border',
          separator: 'border-l-2 border-default',
        }"
      >
        <template #indicator="{ item }">
          <UTooltip :text="item.tooltip">
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
            {{ item.title }}

            <span
              v-if="item.name.eng"
              class="text-gray-500"
            >
              [{{ item.name.eng }}]
            </span>
          </NuxtLink>
        </template>
      </UTimeline>
    </UScrollArea>
  </UCard>
</template>
