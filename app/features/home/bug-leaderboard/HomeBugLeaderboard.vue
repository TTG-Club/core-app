<script setup lang="ts">
  import type {
    BugReportStatsResponse,
    BugReportStatus,
  } from '~bug-report/model';

  import { BUG_REPORT_STATS_API_URL } from '~bug-report/model';
  import { AnimatedNumber } from '~ui/animated-number';

  import {
    BUG_LEADERBOARD_DATA_KEY,
    BUG_LEADERBOARD_LABEL_FIXED,
    BUG_LEADERBOARD_LABEL_SENT,
    BUG_LEADERBOARD_LABEL_TOP,
    BUG_LEADERBOARD_REFRESH_INTERVAL_MS,
    BUG_LEADERBOARD_TITLE,
    BUG_LEADERBOARD_TOP_TOOLTIP,
    BUG_LEADERBOARD_TROPHY_COLOR,
  } from './model';

  const { isAdmin } = useUserRoles();
  const router = useRouter();

  /**
   * Переход в админку багов с фильтрацией по статусу.
   *
   * @param status Статус для фильтрации.
   */
  function handleCounterClick(status: BugReportStatus): void {
    if (!isAdmin.value) {
      return;
    }

    router.push({
      path: '/admin/bugs',
      query: { status },
    });
  }

  const {
    data: stats,
    refresh,
    status,
  } = await useAsyncData(BUG_LEADERBOARD_DATA_KEY, () =>
    $fetch<BugReportStatsResponse>(BUG_REPORT_STATS_API_URL),
  );

  const isLoading = computed(() => status.value === 'pending');

  const totalCount = computed(() => stats.value?.totalCount ?? 0);
  const fixedCount = computed(() => stats.value?.fixedCount ?? 0);
  const topFixers = computed(() => stats.value?.topFixers ?? []);

  /** Максимальное кол-во исправленных у первого в списке — для масштабирования полосок */
  const maxFixed = computed(() => topFixers.value[0]?.fixed ?? 1);

  /** Список лидеров с вычисленными стилями, классами и индексами */
  const decoratedTopFixers = computed(() => {
    const maxVal = maxFixed.value;

    return topFixers.value.map((fixer, index) => {
      const isTopThree = index < 3;

      return {
        ...fixer,
        isWinner: index === 0,
        displayIndex: index + 1,
        rowStyle: {
          animationDelay: `${index * 80}ms`,
        },
        barClass: isTopThree
          ? 'bg-(--color-success-500)/8'
          : 'bg-(--color-success-500)/4',
        barStyle: {
          width: `${(fixer.fixed / maxVal) * 100}%`,
          animationDelay: `${300 + index * 80}ms`,
        },
        badgeColor: isTopThree ? ('success' as const) : ('neutral' as const),
        textClass: isTopThree ? 'font-semibold text-default' : 'text-muted',
      };
    });
  });

  /** Автообновление статистики на клиенте */
  onMounted(() => {
    useIntervalFn(() => refresh(), BUG_LEADERBOARD_REFRESH_INTERVAL_MS);
  });
</script>

<template>
  <div
    class="bug-leaderboard relative flex flex-col gap-3 overflow-hidden rounded-xl border border-default bg-muted p-4 text-default"
  >
    <!-- Заголовок -->
    <div class="flex items-center gap-2">
      <div
        class="bug-glow-indicator flex size-5 items-center justify-center rounded bg-linear-to-br from-(--color-error-500) to-(--color-error-600) shadow-[0_0_12px_var(--color-error-500)]"
      >
        <UIcon
          name="tabler:bug"
          class="size-2.5 text-white"
        />
      </div>

      <h3 class="text-sm leading-tight font-semibold text-(--color-error-400)">
        {{ BUG_LEADERBOARD_TITLE }}
      </h3>

      <UButton
        v-if="isAdmin"
        :loading="isLoading"
        icon="tabler:refresh"
        variant="ghost"
        size="xs"
        class="ml-auto"
        @click.left.exact.prevent="refresh()"
      />
    </div>

    <!-- Счётчики -->
    <div class="grid grid-cols-2 gap-2">
      <div
        class="flex items-center gap-3 rounded-lg border border-default bg-default/50 px-3 py-2.5"
        :class="{
          'cursor-pointer transition-colors hover:bg-default/80': isAdmin,
        }"
        @click.left.exact.prevent="handleCounterClick('NEW')"
      >
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-md bg-(--color-primary-500)/10"
        >
          <UIcon
            name="tabler:send-2"
            class="size-4 text-(--color-primary-400)"
          />
        </div>

        <div class="flex flex-col">
          <span
            class="text-[10px] font-medium tracking-wider text-muted uppercase"
          >
            {{ BUG_LEADERBOARD_LABEL_SENT }}
          </span>

          <AnimatedNumber
            class="text-lg leading-tight font-bold text-(--color-primary-400)"
            :value="totalCount"
          />
        </div>
      </div>

      <div
        class="flex items-center gap-3 rounded-lg border border-default bg-default/50 px-3 py-2.5"
        :class="{
          'cursor-pointer transition-colors hover:bg-default/80': isAdmin,
        }"
        @click.left.exact.prevent="handleCounterClick('FIXED')"
      >
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-md bg-(--color-success-500)/10"
        >
          <UIcon
            name="tabler:check"
            class="size-4 text-(--color-success-400)"
          />
        </div>

        <div class="flex flex-col">
          <span
            class="text-[10px] font-medium tracking-wider text-muted uppercase"
          >
            {{ BUG_LEADERBOARD_LABEL_FIXED }}
          </span>

          <AnimatedNumber
            class="text-lg leading-tight font-bold text-(--color-success-400)"
            :value="fixedCount"
          />
        </div>
      </div>
    </div>

    <!-- Таблица лидеров -->
    <div
      v-if="decoratedTopFixers.length"
      class="flex flex-col gap-1 pt-1"
    >
      <div class="flex items-center gap-1 pb-1">
        <span class="text-xs font-medium tracking-[0.5px] text-muted uppercase">
          {{ BUG_LEADERBOARD_LABEL_TOP }}
        </span>

        <UTooltip :text="BUG_LEADERBOARD_TOP_TOOLTIP">
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
            :style="{ color: BUG_LEADERBOARD_TROPHY_COLOR }"
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
  .bug-glow-indicator {
    animation: bug-pulse-glow 2s ease-in-out infinite;
  }

  @keyframes bug-pulse-glow {
    0%,
    100% {
      box-shadow: 0 0 8px var(--color-error-500);
    }

    50% {
      box-shadow: 0 0 16px var(--color-error-400);
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
