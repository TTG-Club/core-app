<script setup lang="ts">
  import type { BugReportStatsResponse } from '~bug-report/model';

  import type { CommunityRatingPeriod } from './model';

  import { BUG_REPORT_STATS_API_URL } from '~bug-report/model';
  import { HomePanel } from '~home/ui-kit';

  import {
    COMMUNITY_BUG_STATS_DATA_KEY,
    COMMUNITY_EMPTY_MONTH_TEXT,
    COMMUNITY_EMPTY_SLOT_TEXTS,
    COMMUNITY_EMPTY_TEXT,
    COMMUNITY_ICON,
    COMMUNITY_LABEL,
    COMMUNITY_PERIOD_DEFAULT,
    COMMUNITY_PERIOD_OPTIONS,
    COMMUNITY_ROW_STAGGER_MS,
    COMMUNITY_TOP_SIZE,
    COMMUNITY_TOP_TOOLTIP,
    COMMUNITY_TROPHY_COLOR,
  } from './model';

  // Ту же статистику по тому же ключу читает строка счётчиков в шапке
  // (HomeCounters). dedupe: 'defer' — иначе второй потребитель ключа отменяет
  // запрос первого вместо того, чтобы дождаться общего.
  const { data: bugStats } = await useAsyncData(
    COMMUNITY_BUG_STATS_DATA_KEY,
    () => $fetch<BugReportStatsResponse>(BUG_REPORT_STATS_API_URL),
    { dedupe: 'defer' },
  );

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
</script>

<template>
  <HomePanel
    :label="COMMUNITY_LABEL"
    :icon="COMMUNITY_ICON"
    body-class="flex flex-col gap-2 p-3"
  >
    <!-- Подсказка про зачёт багов стоит в шапке панели: отдельного
      подзаголовка у рейтинга больше нет, панель целиком про охотников -->
    <template #actions>
      <UTooltip :text="COMMUNITY_TOP_TOOLTIP">
        <UIcon
          name="tabler:help-circle-filled"
          class="size-3.5 cursor-help text-dimmed transition-colors hover:text-default"
        />
      </UTooltip>
    </template>

    <template v-if="hasAnyFixers">
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
              class="font-mono text-xs font-semibold text-dimmed tabular-nums"
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
            class="relative z-1 font-mono tabular-nums"
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
            <span
              class="font-mono text-xs font-semibold text-dimmed tabular-nums"
            >
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
    </template>

    <!-- Рейтинга нет ни за один период (или статистика не пришла) — панель без
      тэглайна осталась бы пустой, поэтому показываем заглушку -->
    <p
      v-else
      class="rounded-lg border border-dashed border-default px-3 py-4 text-center text-xs text-muted"
    >
      {{ COMMUNITY_EMPTY_TEXT }}
    </p>
  </HomePanel>
</template>

<style scoped>
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

  @media (prefers-reduced-motion: reduce) {
    .fixer-row,
    .fixer-bar {
      animation: none;
    }
  }
</style>
