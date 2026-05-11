<script setup lang="ts">
  import { AnimatedNumber } from '~ui/animated-number';

  import {
    MATERIAL_COUNTER_API_URL,
    MATERIAL_COUNTER_CACHE_API_URL,
    MATERIAL_COUNTER_DATA_KEY,
    MATERIAL_COUNTER_RESET_DATA_KEY,
    ONLINE_COUNTER_DATA_KEY,
  } from '../model';

  const { isAdmin } = useUserRoles();

  const {
    data: counter,
    refresh,
    status: counterStatus,
  } = await useAsyncData(MATERIAL_COUNTER_DATA_KEY, () =>
    $fetch<number>(MATERIAL_COUNTER_API_URL),
  );

  const visitorsCounter = useState<number | null>(
    ONLINE_COUNTER_DATA_KEY,
    () => null,
  );

  const { execute: reset, status: resetStatus } = await useAsyncData(
    MATERIAL_COUNTER_RESET_DATA_KEY,
    () =>
      $fetch(MATERIAL_COUNTER_CACHE_API_URL, {
        onResponse: ({ response }) => {
          if (!response.ok) {
            return;
          }

          refresh();
        },
      }),
    {
      immediate: false,
      server: false,
    },
  );

  const isLoading = computed(
    () => counterStatus.value === 'pending' || resetStatus.value === 'pending',
  );

  const materialsValue = computed(() => counter.value ?? 0);
  const visitorsTotalValue = computed(() => visitorsCounter.value ?? 0);
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
          name="tabler:player-play-filled"
          class="size-2.5 text-white"
        />
      </div>

      <h3
        class="text-sm leading-tight font-semibold text-(--color-success-400)"
      >
        Статистика онлайн
      </h3>

      <UButton
        v-if="isAdmin"
        :loading="isLoading"
        icon="tabler:refresh"
        variant="ghost"
        size="xs"
        class="ml-auto"
        @click.left.exact.prevent="reset()"
      />
    </div>

    <!-- Описание -->
    <p class="text-xs leading-normal text-default">
      TTG — твой проводник в мир Dungeons & Dragons, созданный сообществом для
      сообщества!
    </p>

    <!-- Статистика в две колонки -->
    <div class="flex justify-evenly gap-4 pt-2">
      <div class="flex flex-col items-center gap-1">
        <span class="text-xs font-medium tracking-[0.5px] text-muted uppercase">
          Материалов
        </span>

        <AnimatedNumber
          class="text-2xl leading-tight font-bold text-(--color-primary-400)"
          :value="materialsValue"
        />
      </div>

      <USeparator orientation="vertical" />

      <div class="flex flex-col items-center gap-1">
        <span class="text-xs font-medium tracking-[0.5px] text-muted uppercase">
          Авантюристов
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
