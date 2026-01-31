<script setup lang="ts">
  import { AnimatedNumber } from '~ui/animated-number';

  interface OnlineCountResponse {
    total: number;
  }

  const { isAdmin } = useUserRoles();

  const {
    data: counter,
    refresh,
    status: counterStatus,
  } = await useAsyncData('material-counter', () =>
    $fetch<number>('/api/v2/statistics/count-all'),
  );

  const {
    data: visitorsCounter,
    refresh: refreshVisitors,
    status: visitorsCounterStatus,
  } = await useAsyncData('visitors-counter', () =>
    $fetch<OnlineCountResponse>('/api/v2/online/count'),
  );

  const { execute: reset, status: resetStatus } = await useAsyncData(
    'material-counter-reset-cache',
    () =>
      $fetch('/api/v2/cache/evict-all', {
        onResponse: ({ response }) => {
          if (!response.ok) {
            return;
          }

          refresh();
          refreshVisitors();
        },
      }),
    {
      immediate: false,
      server: false,
    },
  );

  const isLoading = computed(
    () =>
      counterStatus.value === 'pending' ||
      visitorsCounterStatus.value === 'pending' ||
      resetStatus.value === 'pending',
  );

  const materialsValue = computed(() => counter.value ?? 0);
  const visitorsTotalValue = computed(() => visitorsCounter.value?.total ?? 0);
</script>

<template>
  <div
    :class="$style.card"
    class="shadow-lg"
  >
    <div class="flex h-4 items-center justify-between gap-2">
      <h3 class="text-base leading-none font-medium">Статистика</h3>

      <UButton
        v-if="isAdmin"
        :loading="isLoading"
        icon="i-fluent-arrow-sync-16-regular"
        variant="ghost"
        size="sm"
        @click.left.exact.prevent="reset()"
      />
    </div>

    <div class="flex flex-col gap-4">
      <div>
        <p class="mb-2 text-sm text-gray-600">Количество материалов:</p>

        <AnimatedNumber
          :class="$style.stats"
          :value="materialsValue"
        />
      </div>

      <div>
        <p class="mb-2 text-sm text-gray-600">Текущих посетителей:</p>

        <AnimatedNumber
          :class="$style.stats"
          :value="visitorsTotalValue"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
  .card {
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 1 100%;
    flex-direction: column;
    gap: 12px;

    padding: 12px 12px;
    border: 1px solid var(--ui-border);
    border-radius: 10px;

    color: var(--ui-text);
    text-decoration: none;

    background: var(--ui-bg-muted);

    .stats {
      font-size: 32px;
      font-weight: 600;
      line-height: 32px;
      color: var(--color-primary);
    }
  }
</style>
