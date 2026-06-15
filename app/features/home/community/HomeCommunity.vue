<script setup lang="ts">
  import type {
    BugReportStatsResponse,
    BugReportStatus,
  } from '~bug-report/model';

  import { BUG_REPORT_STATS_API_URL } from '~bug-report/model';
  import {
    MATERIAL_COUNTER_API_URL,
    MATERIAL_COUNTER_CACHE_API_URL,
    MATERIAL_COUNTER_DATA_KEY,
    MATERIAL_COUNTER_DESCRIPTION,
    MATERIAL_COUNTER_LABEL_MATERIALS,
    MATERIAL_COUNTER_LABEL_VISITORS,
    MATERIAL_COUNTER_RESET_DATA_KEY,
    MATERIAL_COUNTER_TITLE,
    ONLINE_COUNTER_DATA_KEY,
  } from '~home/counters/model';
  import { AnimatedNumber } from '~ui/animated-number';

  import {
    COMMUNITY_BUG_STATS_DATA_KEY,
    COMMUNITY_LABEL_FIXED,
    COMMUNITY_REFRESH_INTERVAL_MS,
    COMMUNITY_TOP_LABEL,
    COMMUNITY_TOP_TOOLTIP,
    COMMUNITY_TROPHY_COLOR,
  } from './model';

  const { isAdmin } = useUserRoles();
  const router = useRouter();

  // Материалы и сброс кеша
  const {
    data: materialsCounter,
    refresh: refreshMaterials,
    status: materialsStatus,
  } = await useAsyncData(MATERIAL_COUNTER_DATA_KEY, () =>
    $fetch<number>(MATERIAL_COUNTER_API_URL),
  );

  const { execute: resetCache, status: resetStatus } = await useAsyncData(
    MATERIAL_COUNTER_RESET_DATA_KEY,
    () =>
      $fetch(MATERIAL_COUNTER_CACHE_API_URL, {
        onResponse: ({ response }) => {
          if (!response.ok) {
            return;
          }

          refreshMaterials();
        },
      }),
    {
      immediate: false,
      server: false,
    },
  );

  // Онлайн-счётчик пишется плагином online-heartbeat, здесь только читаем
  const visitorsCounter = useState<number | null>(
    ONLINE_COUNTER_DATA_KEY,
    () => null,
  );

  // Статистика баг-репортов и топ охотников
  const {
    data: bugStats,
    refresh: refreshBugStats,
    status: bugStatsStatus,
  } = await useAsyncData(COMMUNITY_BUG_STATS_DATA_KEY, () =>
    $fetch<BugReportStatsResponse>(BUG_REPORT_STATS_API_URL),
  );

  const isLoading = computed(
    () =>
      materialsStatus.value === 'pending'
      || resetStatus.value === 'pending'
      || bugStatsStatus.value === 'pending',
  );

  const materialsValue = computed(() => materialsCounter.value ?? 0);
  const visitorsValue = computed(() => visitorsCounter.value ?? 0);

  // Значения ещё не получены с бэка (null) — показываем загрузку, а не «0»
  const isMaterialsLoading = computed(() => materialsCounter.value === null);
  const isVisitorsLoading = computed(() => visitorsCounter.value === null);
  const isFixedLoading = computed(() => bugStats.value === null);
  const fixedCount = computed(() => bugStats.value?.fixedCount ?? 0);
  const topFixers = computed(() => bugStats.value?.topFixers ?? []);

  /** Максимальное кол-во исправленных у первого в списке — для масштабирования полосок */
  const maxFixed = computed(() => topFixers.value[0]?.fixed ?? 1);

  /** Список лидеров с вычисленными стилями, классами и индексами */
  const decoratedTopFixers = computed(() => {
    const maxValue = maxFixed.value;

    return topFixers.value.map((fixer, index) => {
      const isTopThree = index < 3;

      return {
        ...fixer,
        isWinner: index === 0,
        displayIndex: index + 1,
        rowStyle: {
          animationDelay: `${index * 80}ms`,
        },
        barClass: isTopThree ? 'bg-success-500/8' : 'bg-success-500/4',
        barStyle: {
          width: `${(fixer.fixed / maxValue) * 100}%`,
          animationDelay: `${300 + index * 80}ms`,
        },
        badgeColor: isTopThree ? ('success' as const) : ('neutral' as const),
        textClass: isTopThree ? 'font-semibold text-default' : 'text-muted',
      };
    });
  });

  /** Классы кликабельного стата исправленных багов (для админа) */
  const fixedTileClass = computed(() => ({
    'cursor-pointer transition-colors hover:bg-default/80': isAdmin.value,
  }));

  /**
   * Переход в админку багов с фильтром по новым (только для админа).
   * Удобный шорткат для быстрой обработки свежих репортов.
   */
  function handleNewBugsClick(): void {
    if (!isAdmin.value) {
      return;
    }

    const status: BugReportStatus = 'NEW';

    router.push({
      path: '/admin/bugs',
      query: { status },
    });
  }

  /** Сброс кеша материалов и обновление всей статистики (для админа) */
  function handleRefresh(): void {
    resetCache();
    refreshBugStats();
  }

  /** Автообновление статистики на клиенте */
  onMounted(() => {
    useIntervalFn(() => refreshBugStats(), COMMUNITY_REFRESH_INTERVAL_MS);
  });
</script>

<template>
  <div
    class="home-community relative flex flex-col gap-3 overflow-hidden rounded-xl border border-default bg-muted p-4 text-default"
  >
    <!-- Заголовок с live-индикатором -->
    <div class="flex items-center gap-2">
      <div
        class="community-glow flex size-5 items-center justify-center rounded bg-linear-to-br from-success-500 to-success-600 shadow-[0_0_12px_var(--color-success-500)]"
      >
        <UIcon
          name="tabler:player-play-filled"
          class="size-2.5 text-white"
        />
      </div>

      <h3 class="text-sm leading-tight font-semibold text-success-400">
        {{ MATERIAL_COUNTER_TITLE }}
      </h3>

      <UButton
        v-if="isAdmin"
        :loading="isLoading"
        icon="tabler:refresh"
        variant="ghost"
        size="xs"
        class="ml-auto"
        @click.left.exact.prevent="handleRefresh"
      />
    </div>

    <!-- Тэглайн проекта -->
    <p class="text-xs leading-normal text-default">
      {{ MATERIAL_COUNTER_DESCRIPTION }}
    </p>

    <!-- Ключевые показатели проекта -->
    <div class="grid grid-cols-3 gap-2">
      <div
        class="flex flex-col rounded-lg border border-default bg-default/50 px-3 py-2.5"
      >
        <span
          class="text-[10px] font-medium tracking-wider text-muted uppercase"
        >
          {{ MATERIAL_COUNTER_LABEL_VISITORS }}
        </span>

        <USkeleton
          v-if="isVisitorsLoading"
          class="mt-0.5 h-5 w-10"
        />

        <AnimatedNumber
          v-else
          class="text-lg leading-tight font-bold text-success-400"
          :value="visitorsValue"
        />
      </div>

      <div
        class="flex flex-col rounded-lg border border-default bg-default/50 px-3 py-2.5"
      >
        <span
          class="text-[10px] font-medium tracking-wider text-muted uppercase"
        >
          {{ MATERIAL_COUNTER_LABEL_MATERIALS }}
        </span>

        <USkeleton
          v-if="isMaterialsLoading"
          class="mt-0.5 h-5 w-10"
        />

        <AnimatedNumber
          v-else
          class="text-lg leading-tight font-bold text-primary-400"
          :value="materialsValue"
        />
      </div>

      <div
        class="flex flex-col rounded-lg border border-default bg-default/50 px-3 py-2.5"
        :class="fixedTileClass"
        @click.left.exact.prevent="handleNewBugsClick"
      >
        <span
          class="text-[10px] font-medium tracking-wider text-muted uppercase"
        >
          {{ COMMUNITY_LABEL_FIXED }}
        </span>

        <USkeleton
          v-if="isFixedLoading"
          class="mt-0.5 h-5 w-10"
        />

        <AnimatedNumber
          v-else
          class="text-lg leading-tight font-bold text-warning-400"
          :value="fixedCount"
        />
      </div>
    </div>

    <!-- Рейтинг охотников за багами -->
    <div
      v-if="decoratedTopFixers.length"
      class="flex flex-col gap-1 border-t border-default pt-3"
    >
      <div class="flex items-center gap-1 pb-1">
        <span class="text-xs font-medium tracking-[0.5px] text-muted uppercase">
          {{ COMMUNITY_TOP_LABEL }}
        </span>

        <UTooltip :text="COMMUNITY_TOP_TOOLTIP">
          <UIcon
            name="tabler:help-circle-filled"
            class="size-3.5 cursor-help text-muted transition-colors hover:text-default"
          />
        </UTooltip>
      </div>

      <div
        v-for="fixer in decoratedTopFixers"
        :key="fixer.login"
        class="fixer-row group relative flex items-center gap-2 rounded-lg px-2.5 py-1.5"
        :style="fixer.rowStyle"
      >
        <!-- Полоска прогресса на фоне строки -->
        <div
          class="fixer-bar absolute inset-y-0 left-0 rounded-lg"
          :class="fixer.barClass"
          :style="fixer.barStyle"
        />

        <!-- Позиция / Кубок -->
        <div class="relative z-1 flex w-5 shrink-0 items-center justify-center">
          <UIcon
            v-if="fixer.isWinner"
            name="tabler:trophy-filled"
            class="size-4.5"
            :style="{ color: COMMUNITY_TROPHY_COLOR }"
          />

          <span
            v-else
            class="text-xs font-semibold text-muted tabular-nums"
          >
            {{ fixer.displayIndex }}
          </span>
        </div>

        <!-- Логин -->
        <span
          class="relative z-1 flex-1 truncate text-sm"
          :class="fixer.textClass"
        >
          {{ fixer.login }}
        </span>

        <!-- Количество в бейдже -->
        <UBadge
          :label="String(fixer.fixed)"
          :color="fixer.badgeColor"
          variant="subtle"
          size="sm"
          class="relative z-1 tabular-nums"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .community-glow {
    animation: community-pulse-glow 2s ease-in-out infinite;
  }

  @keyframes community-pulse-glow {
    0%,
    100% {
      box-shadow: 0 0 8px var(--color-success-500);
    }

    50% {
      box-shadow: 0 0 16px var(--color-success-400);
    }
  }

  /* Анимация появления строк */
  .fixer-row {
    animation: fixer-slide-in 0.4s ease-out both;
  }

  @keyframes fixer-slide-in {
    from {
      transform: translateX(-8px);
      opacity: 0;
    }

    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Анимация полоски прогресса */
  .fixer-bar {
    animation: bar-grow 0.6s ease-out both;
  }

  @keyframes bar-grow {
    from {
      width: 0 !important;
    }
  }
</style>
