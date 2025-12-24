<script setup lang="ts">
  type LastUpdateAction = 'Добавлено' | 'Обновлено' | 'Удалено' | string;

  type BadgeColor =
    | 'success'
    | 'error'
    | 'info'
    | 'primary'
    | 'secondary'
    | 'warning'
    | 'neutral';

  interface LastUpdateItem {
    url: string;
    updatedAt: string;
    action: LastUpdateAction;
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

  const {
    top = 10,
    title = 'Последние обновления',
    showRefresh = true,
    showSource = true,
    showDate = true,
    dense = false,
  } = defineProps<{
    top?: number;
    title?: string;
    showRefresh?: boolean;
    showSource?: boolean;
    showDate?: boolean;
    dense?: boolean;
  }>();

  const getActionColor = (action: LastUpdateAction): BadgeColor => {
    const value = action?.toLowerCase?.() ?? '';

    if (value.includes('добав')) {
      return 'success';
    }

    if (value.includes('обнов')) {
      return 'info';
    }

    if (value.includes('удал')) {
      return 'error';
    }

    return 'neutral';
  };

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
      return iso;
    }

    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const {
    data: updates,
    status,
    error,
    refresh,
  } = await useAsyncData<Array<LastUpdateItem>>(
    () => `last-updates-top-${top}`,
    () =>
      $fetch<Array<LastUpdateItem>>('/api/v2/last/update', {
        query: { top },
      }),
    {
      dedupe: 'defer',
      default: () => [],
    },
  );
</script>

<template>
  <UCard
    :ui="{
      body: dense ? 'p-3 sm:p-3' : 'p-4 sm:p-4',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-base font-semibold">
            {{ title }}
          </div>

          <div class="text-xs text-gray-500">Топ: {{ top }}</div>
        </div>

        <UButton
          v-if="showRefresh"
          size="xs"
          variant="soft"
          :loading="status === 'pending'"
          @click="refresh()"
        >
          Обновить
        </UButton>
      </div>
    </template>

    <div v-if="status === 'pending' && updates.length === 0">
      <div class="space-y-2">
        <USkeleton class="h-5 w-3/4" />

        <USkeleton class="h-5 w-2/3" />

        <USkeleton class="h-5 w-4/5" />
      </div>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить обновления"
      :description="String(error)"
    />

    <ul
      v-else
      class="divide-y divide-gray-200 dark:divide-gray-800"
    >
      <li
        v-for="item in updates"
        :key="`${item.url}-${item.updatedAt}`"
        class="py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                size="xs"
                variant="soft"
                :color="getActionColor(item.action)"
              >
                {{ item.action }}
              </UBadge>

              <NuxtLink
                :to="{ path: item.url }"
                class="font-medium hover:underline"
              >
                {{ item.name.rus }}
              </NuxtLink>

              <span class="text-xs text-gray-500"> [{{ item.name.eng }}] </span>
            </div>

            <div
              v-if="showSource && item.source"
              class="mt-1 text-xs text-gray-500"
            >
              Источник:
              <span class="font-medium">
                {{ item.source.name.label }}
              </span>
              — {{ item.source.name.rus }}
              <span v-if="item.source.page">
                , стр. {{ item.source.page }}
              </span>
            </div>
          </div>

          <div
            v-if="showDate"
            class="shrink-0 text-xs text-gray-500"
            :title="item.updatedAt"
          >
            {{ formatDateTime(item.updatedAt) }}
          </div>
        </div>
      </li>
    </ul>
  </UCard>
</template>
