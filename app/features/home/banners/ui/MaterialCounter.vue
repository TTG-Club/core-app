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
  <div :class="$style.card">
    <!-- Заголовок с индикатором -->
    <div class="flex items-center gap-2">
      <div :class="$style.indicator">
        <UIcon
          name="i-fluent-play-12-filled"
          :class="$style.indicatorIcon"
        />
      </div>

      <h3 :class="$style.title">Статистика</h3>

      <UButton
        v-if="isAdmin"
        :loading="isLoading"
        icon="i-fluent-arrow-sync-16-regular"
        variant="ghost"
        size="xs"
        class="ml-auto"
        @click.left.exact.prevent="reset()"
      />
    </div>

    <!-- Описание -->
    <p :class="$style.description">
      TTG — справочник по настольным ролевым играм, созданный сообществом для
      сообщества!
    </p>

    <!-- Статистика в две колонки -->
    <div :class="$style.statsGrid">
      <div :class="$style.statItem">
        <span :class="$style.statLabel">Материалов</span>

        <AnimatedNumber
          :class="$style.statValue"
          :value="materialsValue"
        />
      </div>

      <div :class="$style.statItem">
        <span :class="$style.statLabel">Посетителей</span>

        <AnimatedNumber
          :class="$style.statValue"
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

    padding: 16px;
    border: 1px solid var(--ui-border);
    border-radius: 12px;

    color: var(--ui-text);

    background: var(--ui-bg-muted);
  }

  .indicator {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 20px;
    height: 20px;
    border-radius: 4px;

    background: linear-gradient(
      135deg,
      var(--color-success-500) 0%,
      var(--color-success-600) 100%
    );
    box-shadow: 0 0 12px var(--color-success-500);

    animation: pulse-glow 2s ease-in-out infinite;
  }

  .indicatorIcon {
    width: 10px;
    height: 10px;
    color: white;
  }

  @keyframes pulse-glow {
    0%,
    100% {
      box-shadow: 0 0 8px var(--color-success-500);
    }

    50% {
      box-shadow: 0 0 16px var(--color-success-400);
    }
  }

  .title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-success-400);
  }

  .description {
    font-size: 13px;
    line-height: 1.5;
    color: var(--ui-text);
  }

  .statsGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    padding-top: 4px;
    border-top: 1px solid var(--ui-border);
  }

  .statItem {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .statLabel {
    font-size: 12px;
    font-weight: 500;
    color: var(--ui-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .statValue {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-primary-400);
  }
</style>
