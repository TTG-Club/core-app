<script setup lang="ts">
  import type {
    BugReportStatsResponse,
    BugReportStatus,
  } from '~bug-report/model';

  import {
    ADMIN_SHEET_STATS_API_URL,
    parseAdminCharacterSheetStats,
  } from '~admin/character-sheets/model';
  import { ADMIN_DASHBOARD_ROUTE } from '~admin/navigation/model';
  import { BUG_REPORT_STATS_API_URL } from '~bug-report/model';
  import { COMMUNITY_BUG_STATS_DATA_KEY } from '~home/community/model';
  import { MODERATION_BUGS_ROUTE } from '~moderation/model';
  import { AnimatedNumber } from '~ui/animated-number';

  import {
    MATERIAL_COUNTER_API_URL,
    MATERIAL_COUNTER_CACHE_API_URL,
    MATERIAL_COUNTER_DATA_KEY,
    MATERIAL_COUNTER_ICON_FIXED,
    MATERIAL_COUNTER_ICON_MATERIALS,
    MATERIAL_COUNTER_ICON_SHEETS,
    MATERIAL_COUNTER_LABEL_FIXED,
    MATERIAL_COUNTER_LABEL_MATERIALS,
    MATERIAL_COUNTER_LABEL_SHEETS,
    MATERIAL_COUNTER_REFRESH_INTERVAL_MS,
    MATERIAL_COUNTER_REFRESH_LABEL,
    MATERIAL_COUNTER_RESET_DATA_KEY,
    SHEET_COUNTER_DATA_KEY,
  } from './model';

  /** Куда ведёт клик по показателю (только у ролей, которым это доступно) */
  type CounterAction = 'sheets' | 'bugs';

  interface HomeCounterItem {
    key: string;
    icon: string;
    label: string;
    value: number;
    isLoading: boolean;
    isInteractive: boolean;
    action?: CounterAction;
  }

  const { isAdmin, canManageBugReports } = useUserRoles();
  const router = useRouter();
  const requestFetch = useRequestFetch();

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

  // Листы персонажей всех пользователей: та же ручка, что у карточки в
  // админ-дашборде; показываем total — все созданные листы, включая удалённые,
  // а не только активные.
  // requestFetch, а не $fetch: на SSR он пробрасывает cookie входящего запроса,
  // иначе серверный запрос уходит без авторизации и ответ на странице не появится.
  const {
    data: sheetStats,
    refresh: refreshSheetStats,
    status: sheetStatsStatus,
  } = await useAsyncData(SHEET_COUNTER_DATA_KEY, async () =>
    parseAdminCharacterSheetStats(
      await requestFetch<unknown>(ADMIN_SHEET_STATS_API_URL),
    ),
  );

  // Статистику баг-репортов рядом читает и рейтинг охотников (HomeCommunity) по
  // тому же ключу. dedupe: 'defer' — иначе второй потребитель ключа отменяет
  // запрос первого вместо того, чтобы дождаться общего.
  const {
    data: bugStats,
    refresh: refreshBugStats,
    status: bugStatsStatus,
  } = await useAsyncData(
    COMMUNITY_BUG_STATS_DATA_KEY,
    () => $fetch<BugReportStatsResponse>(BUG_REPORT_STATS_API_URL),
    { dedupe: 'defer' },
  );

  const isRefreshing = computed(
    () =>
      materialsStatus.value === 'pending'
      || resetStatus.value === 'pending'
      || sheetStatsStatus.value === 'pending'
      || bugStatsStatus.value === 'pending',
  );

  // Значение ещё не получено или запрос упал — показываем скелетон, а не «0».
  // В Nuxt 4 data у useAsyncData до ответа и после ошибки = undefined (не null).
  const counters = computed<Array<HomeCounterItem>>(() => [
    {
      key: 'materials',
      icon: MATERIAL_COUNTER_ICON_MATERIALS,
      label: MATERIAL_COUNTER_LABEL_MATERIALS,
      value: materialsCounter.value ?? 0,
      isLoading: materialsCounter.value === undefined,
      isInteractive: false,
    },
    {
      key: 'sheets',
      icon: MATERIAL_COUNTER_ICON_SHEETS,
      label: MATERIAL_COUNTER_LABEL_SHEETS,
      value: sheetStats.value?.total ?? 0,
      isLoading: sheetStats.value === undefined,
      isInteractive: isAdmin.value,
      action: 'sheets',
    },
    {
      key: 'fixed',
      icon: MATERIAL_COUNTER_ICON_FIXED,
      label: MATERIAL_COUNTER_LABEL_FIXED,
      value: bugStats.value?.fixedCount ?? 0,
      isLoading: bugStats.value === undefined,
      isInteractive: canManageBugReports.value,
      action: 'bugs',
    },
  ]);

  /**
   * Переход по клику на показатель: админа — в дашборд со статистикой листов,
   * модератора — к свежим баг-репортам. Остальным показатель некликабелен.
   * @param item - показатель, по которому кликнули
   */
  function handleSelect(item: HomeCounterItem): void {
    if (!item.isInteractive) {
      return;
    }

    if (item.action === 'sheets') {
      router.push(ADMIN_DASHBOARD_ROUTE);

      return;
    }

    if (item.action === 'bugs') {
      const status: BugReportStatus = 'NEW';

      router.push({ path: MODERATION_BUGS_ROUTE, query: { status } });
    }
  }

  /**
   * Живые показатели: листы и баг-репорты бэк не кэширует, их можно опрашивать
   * регулярно. Материалы кэшируются на бэке, их обновляет только сброс кеша.
   */
  function refreshLiveStats(): void {
    refreshSheetStats();
    refreshBugStats();
  }

  /** Сброс кеша материалов и обновление всей статистики (для админа) */
  function handleRefresh(): void {
    resetCache();
    refreshLiveStats();
  }

  onMounted(() => {
    useIntervalFn(refreshLiveStats, MATERIAL_COUNTER_REFRESH_INTERVAL_MS);
  });
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6"
  >
    <component
      :is="item.isInteractive ? 'button' : 'div'"
      v-for="item in counters"
      :key="item.key"
      :type="item.isInteractive ? 'button' : undefined"
      class="group flex items-center gap-2"
      :class="{ 'cursor-pointer': item.isInteractive }"
      @click.left.exact.prevent="handleSelect(item)"
    >
      <UIcon
        :name="item.icon"
        class="size-4 shrink-0 text-dimmed transition-colors group-hover:text-primary"
      />

      <USkeleton
        v-if="item.isLoading"
        class="h-4 w-10 rounded"
      />

      <AnimatedNumber
        v-else
        class="font-mono text-sm leading-none font-semibold text-highlighted sm:text-base"
        :value="item.value"
      />

      <span
        class="font-mono text-[10px] leading-none tracking-[0.16em] text-dimmed uppercase sm:text-[11px]"
      >
        {{ item.label }}
      </span>
    </component>

    <UButton
      v-if="isAdmin"
      :loading="isRefreshing"
      icon="tabler:refresh"
      variant="ghost"
      color="neutral"
      size="xs"
      :aria-label="MATERIAL_COUNTER_REFRESH_LABEL"
      @click.left.exact.prevent="handleRefresh"
    />
  </div>
</template>
