<script setup lang="ts">
  import type {
    BugReportStatsResponse,
    BugReportStatus,
  } from '~bug-report/model';

  import type { CommunityRatingPeriod } from './model';

  import {
    ADMIN_SHEET_STATS_API_URL,
    parseAdminCharacterSheetStats,
  } from '~admin/character-sheets/model';
  import { ADMIN_DASHBOARD_ROUTE } from '~admin/navigation/model';
  import { BUG_REPORT_STATS_API_URL } from '~bug-report/model';
  import {
    MATERIAL_COUNTER_API_URL,
    MATERIAL_COUNTER_CACHE_API_URL,
    MATERIAL_COUNTER_DATA_KEY,
    MATERIAL_COUNTER_DESCRIPTION,
    MATERIAL_COUNTER_LABEL_MATERIALS,
    MATERIAL_COUNTER_LABEL_SHEETS,
    MATERIAL_COUNTER_RESET_DATA_KEY,
    MATERIAL_COUNTER_TITLE,
    SHEET_COUNTER_DATA_KEY,
  } from '~home/counters/model';
  import { MODERATION_BUGS_ROUTE } from '~moderation/model';
  import { AnimatedNumber } from '~ui/animated-number';

  import {
    COMMUNITY_BUG_STATS_DATA_KEY,
    COMMUNITY_EMPTY_MONTH_TEXT,
    COMMUNITY_EMPTY_SLOT_TEXTS,
    COMMUNITY_LABEL_FIXED,
    COMMUNITY_PERIOD_DEFAULT,
    COMMUNITY_PERIOD_OPTIONS,
    COMMUNITY_REFRESH_INTERVAL_MS,
    COMMUNITY_ROW_STAGGER_MS,
    COMMUNITY_TOP_LABEL,
    COMMUNITY_TOP_SIZE,
    COMMUNITY_TOP_TOOLTIP,
    COMMUNITY_TROPHY_COLOR,
  } from './model';

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
  // админ-дашборде; на главной показываем total — все созданные листы, включая
  // удалённые, а не только активные.
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
      || sheetStatsStatus.value === 'pending'
      || bugStatsStatus.value === 'pending',
  );

  const materialsValue = computed(() => materialsCounter.value ?? 0);
  const sheetsValue = computed(() => sheetStats.value?.total ?? 0);

  // Значение ещё не получено или запрос упал — показываем скелетон, а не «0».
  // В Nuxt 4 data у useAsyncData до ответа и после ошибки = undefined (не null).
  const isMaterialsLoading = computed(
    () => materialsCounter.value === undefined,
  );

  const isSheetsLoading = computed(() => sheetStats.value === undefined);
  const isFixedLoading = computed(() => bugStats.value === undefined);
  const fixedCount = computed(() => bugStats.value?.fixedCount ?? 0);
  const topFixers = computed(() => bugStats.value?.topFixers ?? []);

  const topFixersThisMonth = computed(
    () => bugStats.value?.topFixersThisMonth ?? [],
  );

  /** Выбранный период рейтинга: за всё время / за месяц */
  const selectedPeriod = ref<CommunityRatingPeriod>(COMMUNITY_PERIOD_DEFAULT);

  /** Список лидеров активного периода (бэк уже отсортировал и обрезал до топ-10) */
  const activeFixers = computed(() =>
    selectedPeriod.value === 'month'
      ? topFixersThisMonth.value
      : topFixers.value,
  );

  /** Есть ли данные хотя бы за один период — иначе блок рейтинга скрыт целиком */
  const hasAnyFixers = computed(
    () => topFixers.value.length > 0 || topFixersThisMonth.value.length > 0,
  );

  /** Максимальное кол-во исправленных у первого в списке — для масштабирования полосок */
  const maxFixed = computed(() => activeFixers.value[0]?.fixed ?? 1);

  /** Список лидеров с вычисленными стилями, классами и индексами */
  const decoratedTopFixers = computed(() => {
    const maxValue = maxFixed.value;

    return activeFixers.value.map((fixer, index) => {
      const isTopThree = index < 3;

      return {
        ...fixer,
        isWinner: index === 0,
        displayIndex: index + 1,
        rowStyle: {
          animationDelay: `${index * COMMUNITY_ROW_STAGGER_MS}ms`,
        },
        barClass: isTopThree ? 'bg-success-500/8' : 'bg-success-500/4',
        barStyle: {
          width: `${(fixer.fixed / maxValue) * 100}%`,
          animationDelay: `${300 + index * COMMUNITY_ROW_STAGGER_MS}ms`,
        },
        badgeColor: isTopThree ? ('success' as const) : ('neutral' as const),
        textClass: isTopThree ? 'font-semibold text-default' : 'text-muted',
      };
    });
  });

  /**
   * Свободные позиции рейтинга: в начале месяца охотников меньше десяти,
   * и хвост списка дорисовывается заглушками, чтобы блок не выглядел пустым.
   * Подпись берётся по порядку среди пустых строк, задержка анимации
   * продолжает лесенку настоящих строк.
   */
  const emptySlots = computed(() => {
    const filledCount = activeFixers.value.length;

    const slots: Array<{
      displayIndex: number;
      label: string;
      rowStyle: { animationDelay: string };
    }> = [];

    for (let i = filledCount; i < COMMUNITY_TOP_SIZE; i++) {
      const emptyOffset = i - filledCount;

      slots.push({
        displayIndex: i + 1,
        label:
          COMMUNITY_EMPTY_SLOT_TEXTS[
            emptyOffset % COMMUNITY_EMPTY_SLOT_TEXTS.length
          ] ?? '',
        rowStyle: { animationDelay: `${i * COMMUNITY_ROW_STAGGER_MS}ms` },
      });
    }

    return slots;
  });

  /** Классы кликабельного стата исправленных багов (для админа/модератора) */
  const fixedTileClass = computed(() => ({
    'cursor-pointer transition-colors hover:bg-default/80':
      canManageBugReports.value,
  }));

  /** Классы кликабельного стата листов персонажей (для админа) */
  const sheetsTileClass = computed(() => ({
    'cursor-pointer transition-colors hover:bg-default/80': isAdmin.value,
  }));

  /**
   * Переход в админ-дашборд (для админа) — там та же статистика листов
   * с разбивкой на активные и всего.
   */
  function handleSheetsClick(): void {
    if (!isAdmin.value) {
      return;
    }

    router.push(ADMIN_DASHBOARD_ROUTE);
  }

  /**
   * Переход к баг-репортам с фильтром по новым (для админа/модератора).
   * Удобный шорткат для быстрой обработки свежих репортов.
   */
  function handleNewBugsClick(): void {
    if (!canManageBugReports.value) {
      return;
    }

    const status: BugReportStatus = 'NEW';

    router.push({
      path: MODERATION_BUGS_ROUTE,
      query: { status },
    });
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

  /** Автообновление живых показателей на клиенте */
  onMounted(() => {
    useIntervalFn(refreshLiveStats, COMMUNITY_REFRESH_INTERVAL_MS);
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

    <!-- Ключевые показатели проекта. < 420px — в столбец, чтобы подписи не жались -->
    <div class="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
      <div
        class="flex flex-col rounded-lg border border-default bg-default/50 px-3 py-2.5"
        :class="sheetsTileClass"
        @click.left.exact.prevent="handleSheetsClick"
      >
        <span
          class="text-[10px] font-medium tracking-wider text-muted uppercase"
        >
          {{ MATERIAL_COUNTER_LABEL_SHEETS }}
        </span>

        <USkeleton
          v-if="isSheetsLoading"
          class="mt-0.5 h-5 w-10"
        />

        <AnimatedNumber
          v-else
          class="text-lg leading-tight font-bold text-success-400"
          :value="sheetsValue"
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
      v-if="hasAnyFixers"
      class="flex flex-col gap-2"
    >
      <div class="flex items-center gap-1">
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

      <!-- Переключатель периода: за текущий месяц / за всё время.
           :content="false" — используем табы только как переключатель,
           панели-контент рисуем сами ниже.
           :ui — возвращаем прежний вид кнопок: активная = приглушённый
           полупрозрачный зелёный фон + текст success-400, вместо дефолтной
           сплошной заливки со светлым текстом. Длинный in-[…]-модификатор
           переопределяет SSR-заглушку: до гидрации reka не рисует бегунок и
           подсвечивает активную вкладку через before:bg-success — без этого
           на первом рендере мелькала бы сплошная зелёная заливка. -->
      <UTabs
        v-model="selectedPeriod"
        :items="COMMUNITY_PERIOD_OPTIONS"
        :content="false"
        color="success"
        size="xs"
        :ui="{
          trigger:
            'flex-1 data-[state=active]:text-success-400 in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-success-500/15',
          indicator: 'bg-success-500/15 shadow-none',
        }"
      />

      <!-- Список лидеров активного периода.
           :key по периоду — чтобы при переключении список пересоздавался
           целиком и анимация появления отрабатывала для всех строк, а не
           только для новых логинов (иначе общие для обоих периодов логины
           переиспользуются Vue и «проскакивают» анимацию). -->
      <div
        v-if="decoratedTopFixers.length"
        :key="selectedPeriod"
        class="flex flex-col gap-1"
      >
        <div
          v-for="fixer in decoratedTopFixers"
          :key="fixer.name"
          class="fixer-row group relative flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-1.5"
          :style="fixer.rowStyle"
        >
          <!-- Полоска прогресса на фоне строки -->
          <div
            class="fixer-bar absolute inset-y-0 left-0 rounded-lg"
            :class="fixer.barClass"
            :style="fixer.barStyle"
          />

          <!-- Позиция / Кубок -->
          <div
            class="relative z-1 flex w-5 shrink-0 items-center justify-center"
          >
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

          <!-- Имя охотника (логин, если имя не задано) -->
          <span
            class="relative z-1 flex-1 truncate text-sm"
            :class="fixer.textClass"
          >
            {{ fixer.name }}
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

        <!-- Свободные позиции до полного топ-10. Пунктир — принятый в проекте
             язык «места пока нет»; рамка прозрачна у настоящих строк, чтобы
             высота заглушки совпадала с ними. -->
        <div
          v-for="slot in emptySlots"
          :key="slot.displayIndex"
          class="fixer-row flex items-center gap-2 rounded-lg border border-dashed border-default px-2.5 py-1.5"
          :style="slot.rowStyle"
        >
          <div class="flex w-5 shrink-0 items-center justify-center">
            <span class="text-xs font-semibold text-dimmed tabular-nums">
              {{ slot.displayIndex }}
            </span>
          </div>

          <span class="flex-1 truncate text-sm text-dimmed italic">
            {{ slot.label }}
          </span>
        </div>
      </div>

      <!-- Заглушка: за выбранный период ещё нет исправленных багов -->
      <p
        v-else
        class="rounded-lg border border-dashed border-default px-3 py-4 text-center text-xs text-muted"
      >
        {{ COMMUNITY_EMPTY_MONTH_TEXT }}
      </p>
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
