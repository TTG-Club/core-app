<script setup lang="ts">
  import { RecentChangeAction } from '~/shared/enums';

  const RECENT_CHANGES_LIMIT = 10;

  interface RecentChangeItem {
    url: string;
    updatedAt: string;
    action: {
      type: RecentChangeAction;
      name: string;
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

  const dayjs = useDayjs();

  const getActionColor = (
    action: RecentChangeAction | string,
  ):
    | 'success'
    | 'error'
    | 'info'
    | 'primary'
    | 'secondary'
    | 'warning'
    | 'neutral' => {
    if (action === RecentChangeAction.ADDED) {
      return 'success';
    }

    if (action === RecentChangeAction.UPDATED) {
      return 'info';
    }

    if (action === RecentChangeAction.DELETED) {
      return 'error';
    }

    return 'neutral';
  };

  const formatDateTime = (iso: string) => {
    const date = dayjs(iso);

    if (!date.isValid()) {
      return iso;
    }

    return date.local().format('DD.MM.YYYY, HH:mm');
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Произошла ошибка при загрузке данных';
  };

  const {
    data: updates,
    status,
    error,
    refresh,
  } = await useAsyncData<Array<RecentChangeItem>>(
    computed(() => `recent-changes-limit-${RECENT_CHANGES_LIMIT}`),
    () =>
      $fetch<Array<RecentChangeItem>>('/api/v2/last/update', {
        query: { top: RECENT_CHANGES_LIMIT },
      }),
    {
      dedupe: 'defer',
      default: () => [],
    },
  );
</script>

<template>
  <UCard
    class="border-border rounded-lg bg-muted shadow-lg"
    :ui="{
      header: 'py-3 px-3 sm:px-3',
      body: 'p-0 px-3 py-1 sm:p-0 sm:px-3 sm:py-1',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col gap-2">
          <h3 class="text-base leading-none font-medium">
            Обновления на сайте
          </h3>

          <div class="text-xs leading-none text-gray-500">
            Последние: {{ RECENT_CHANGES_LIMIT }}
          </div>
        </div>

        <UButton
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
      :description="getErrorMessage(error)"
    />

    <div
      v-else
      class="flex flex-col divide-y divide-default"
    >
      <div
        v-for="item in updates"
        :key="`${item.url}-${item.updatedAt}`"
        class="py-2"
      >
        <div class="flex items-start justify-between gap-1">
          <div class="flex min-w-0 flex-col">
            <NuxtLink
              :to="item.url"
              class="font-medium hover:underline"
            >
              {{ item.name.rus }}
            </NuxtLink>

            <span class="text-gray-500"> [{{ item.name.eng }}] </span>
          </div>

          <div class="flex shrink-0 flex-col items-end gap-2">
            <div class="flex flex-row items-center gap-2">
              <div
                v-if="item.source"
                class="text-xs text-gray-500"
              >
                {{ item.source.name.label }}
              </div>

              <UBadge
                size="sm"
                variant="soft"
                :color="getActionColor(item.action.type)"
              >
                {{ item.action.name }}
              </UBadge>
            </div>

            <div
              class="text-xs text-gray-500"
              :title="item.updatedAt"
            >
              {{ formatDateTime(item.updatedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
