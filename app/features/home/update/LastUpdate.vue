<script setup lang="ts">
  type LastUpdateAction = 'Добавлено' | 'Обновлено' | 'Удалено';

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
    action: LastUpdateAction | string;
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
    title = 'Обновления на сайте',
    showRefresh = true,
    showSource = true,
    showDate = true,
  } = defineProps<{
    top?: number;
    title?: string;
    showRefresh?: boolean;
    showSource?: boolean;
    showDate?: boolean;
  }>();

  const getActionColor = (action: LastUpdateAction | string): BadgeColor => {
    if (typeof action !== 'string') {
      return 'neutral';
    }

    const value = action.toLowerCase();

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
    class="border-border rounded-[10px] bg-muted shadow-lg"
    :ui="{
      header: 'py-3 px-3 sm:px-3',
      body: 'p-0 px-3 py-1 sm:p-0 sm:px-3 sm:py-1',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col gap-2">
          <h3 class="text-base leading-none font-medium">
            {{ title }}
          </h3>

          <div class="text-xs leading-none text-gray-500">
            Последние: {{ top }}
          </div>
        </div>

        <UButton
          v-if="showRefresh"
          size="sm"
          variant="soft"
          :loading="status === 'pending'"
          @click="refresh()"
        >
          Обновить
        </UButton>
      </div>
    </template>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить обновления"
      :description="error instanceof Error ? error.message : String(error)"
    />

    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="item in updates"
        :key="`${item.url}-${item.updatedAt}`"
        class="py-2"
      >
        <div class="flex items-start justify-between gap-1">
          <div class="flex min-w-0 flex-col">
            <NuxtLink
              :to="{ path: item.url }"
              class="font-medium hover:underline"
            >
              {{ item.name.rus }}
            </NuxtLink>

            <span class="text-gray-500"> [{{ item.name.eng }}] </span>
          </div>

          <div class="flex shrink-0 flex-col items-end gap-2">
            <div class="flex flex-row items-center gap-2">
              <div
                v-if="showSource && item.source"
                class="text-xs text-gray-500"
              >
                {{ item.source.name.label }}
              </div>

              <UBadge
                size="sm"
                variant="soft"
                :color="getActionColor(item.action)"
              >
                {{ item.action }}
              </UBadge>
            </div>

            <div
              v-if="showDate"
              class="text-xs text-gray-500"
              :title="item.updatedAt"
            >
              {{ formatDateTime(item.updatedAt) }}
            </div>
          </div>
        </div>
      </li>
    </ul>
  </UCard>
</template>
