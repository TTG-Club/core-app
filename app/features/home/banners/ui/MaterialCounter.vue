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
    class="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-default bg-muted p-4 text-default"
  >
    <!-- Заголовок с индикатором -->
    <div class="flex items-center gap-2">
      <div
        class="glow-indicator flex size-5 items-center justify-center rounded bg-linear-to-br from-(--color-success-500) to-(--color-success-600) shadow-[0_0_12px_var(--color-success-500)]"
      >
        <UIcon
          name="i-fluent-play-12-filled"
          class="size-2.5 text-white"
        />
      </div>

      <h3
        class="text-sm leading-tight font-semibold text-(--color-success-400)"
      >
        Статистика
      </h3>

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
    <p class="text-xs leading-normal text-default">
      TTG — справочник по настольным ролевым играм, созданный сообществом для
      сообщества!
    </p>

    <!-- Статистика в две колонки -->
    <div class="grid grid-cols-2 gap-4 border-t border-default pt-1">
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium tracking-[0.5px] text-muted uppercase">
          Материалов
        </span>

        <AnimatedNumber
          class="text-2xl leading-tight font-bold text-(--color-primary-400)"
          :value="materialsValue"
        />
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium tracking-[0.5px] text-muted uppercase">
          Посетителей
        </span>

        <AnimatedNumber
          class="text-2xl leading-tight font-bold text-(--color-primary-400)"
          :value="visitorsTotalValue"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .glow-indicator {
    animation: pulse-glow 2s ease-in-out infinite;
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
</style>
