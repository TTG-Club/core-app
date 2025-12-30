<script setup lang="ts">
  const RECENT_CHANGES_LIMIT = 10;

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

  const dayjs = useDayjs();

  const formatDateTime = (iso: string) => {
    const date = dayjs(iso);

    if (!date.isValid()) {
      return iso;
    }

    return date.local().format('LLL');
  };

  const {
    data: updates,
    status,
    pending,
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
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
          :loading="pending"
          variant="soft"
          size="sm"
          @click="refresh()"
        >
          Обновить
        </UButton>
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

    <div
      v-else
      class="flex flex-col divide-y divide-default"
    >
      <div
        v-for="update in updates"
        :key="`${update.url}-${update.updatedAt}`"
        class="px-4 py-2 sm:px-6"
      >
        <div class="flex items-start justify-between gap-1">
          <div class="flex min-w-0 flex-col">
            <NuxtLink
              :to="update.url"
              class="font-medium hover:underline"
            >
              {{ update.name.rus }}
            </NuxtLink>

            <span class="text-gray-500"> [{{ update.name.eng }}] </span>
          </div>

          <div class="flex shrink-0 flex-col items-end gap-2">
            <div class="flex flex-row items-center gap-2">
              <UBadge
                v-if="update.source"
                color="neutral"
                variant="soft"
                size="sm"
              >
                {{ update.source.name.label }}
              </UBadge>

              <UBadge
                size="sm"
                variant="soft"
                :color="update.action.color || 'neutral'"
              >
                {{ update.action.name }}
              </UBadge>
            </div>

            <div
              class="text-xs text-gray-500"
              :title="update.updatedAt"
            >
              {{ formatDateTime(update.updatedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
