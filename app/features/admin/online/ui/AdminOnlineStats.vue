<script setup lang="ts">
  import type {
    AdminOnlineCounters,
    AdminOnlineSiteCard,
    AdminOnlineSiteCardRow,
    AdminOnlineStatsResponse,
  } from '../model';

  import {
    ADMIN_ONLINE_STATS_DESCRIPTION,
    ADMIN_ONLINE_STATS_EMPTY_TEXT,
    ADMIN_ONLINE_STATS_EMPTY_VALUE,
    ADMIN_ONLINE_STATS_GUESTS_LABEL,
    ADMIN_ONLINE_STATS_MINUTES_LABEL,
    ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS,
    ADMIN_ONLINE_STATS_REFRESH_LABEL,
    ADMIN_ONLINE_STATS_REGISTERED_LABEL,
    ADMIN_ONLINE_STATS_SITE_LABEL,
    ADMIN_ONLINE_STATS_SUMMARY_LABEL,
    ADMIN_ONLINE_STATS_TITLE,
    ADMIN_ONLINE_STATS_TOTAL_LABEL,
    ADMIN_ONLINE_STATS_VTTG_APPS_LABEL,
    ADMIN_ONLINE_STATS_VTTG_IDLE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL,
    ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL,
    ADMIN_ONLINE_STATS_VTTG_SITE_ID,
    ADMIN_ONLINE_STATS_VTTG_SITE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL,
    ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
    ADMIN_ONLINE_STATS_VTTG_TOTAL_LABEL,
    ADMIN_ONLINE_STATS_WINDOW_LABEL,
  } from '../model';
  import AdminOnlineStatsRow from './AdminOnlineStatsRow.vue';

  const props = defineProps<{
    hasError: boolean;
    isLoading: boolean;
    stats: AdminOnlineStatsResponse | null;
  }>();

  const emit = defineEmits<{
    refresh: [];
  }>();

  const slots = useSlots();

  // Скелетон только пока ответа ждём: после ошибки ждать нечего — там прочерки.
  const isPending = computed(
    () => props.isLoading || (!props.hasError && !props.stats),
  );

  /**
   * Приводит счётчик к строке: без данных ставим прочерк, ноль остаётся нулём.
   */
  function formatCounter(value: number | undefined): string {
    return typeof value === 'number'
      ? String(value)
      : ADMIN_ONLINE_STATS_EMPTY_VALUE;
  }

  /**
   * Считает, сколько осталось за вычетом доли. Нет одного из чисел — нет и разности:
   * прочерк честнее выдуманного нуля.
   */
  function formatRemainder(
    total: number | undefined,
    part: number | undefined,
  ): string {
    return typeof total === 'number' && typeof part === 'number'
      ? String(total - part)
      : ADMIN_ONLINE_STATS_EMPTY_VALUE;
  }

  /**
   * Складывает две аудитории в общее число людей. Одной из них нет — итога тоже нет.
   */
  function formatSum(
    first: number | undefined,
    second: number | undefined,
  ): string {
    return typeof first === 'number' && typeof second === 'number'
      ? String(first + second)
      : ADMIN_ONLINE_STATS_EMPTY_VALUE;
  }

  /**
   * Собирает строки карточки сайта: гости и вошедшие в аккаунт — непересекающиеся
   * наборы ключей, поэтому итог внизу и есть их сумма.
   */
  function createSiteRows(
    counters: AdminOnlineCounters | null,
  ): AdminOnlineSiteCardRow[] {
    return [
      {
        divider: 'none',
        isTotal: false,
        label: ADMIN_ONLINE_STATS_GUESTS_LABEL,
        value: formatCounter(counters?.guests),
      },
      {
        divider: 'none',
        isTotal: false,
        label: ADMIN_ONLINE_STATS_REGISTERED_LABEL,
        value: formatCounter(counters?.registered),
      },
      {
        divider: 'above',
        isTotal: true,
        label: ADMIN_ONLINE_STATS_TOTAL_LABEL,
        value: formatCounter(counters?.total),
      },
    ];
  }

  /**
   * Собирает строки карточки VTTG. Аудиторий у приложения две, и это разные люди:
   * владельцы с запущенным приложением и те, кто пришёл за чужой стол по ссылке.
   * Складываются они только в самом низу, а три строки «Из них» — доли первой строки,
   * а не слагаемые: играющий под аккаунтом попадает и в «играют», и в «вошли в аккаунт».
   */
  function createVttgRows(
    appCounters: AdminOnlineCounters | null,
    tableCounters: AdminOnlineCounters | null,
  ): AdminOnlineSiteCardRow[] {
    return [
      {
        divider: 'below',
        isTotal: true,
        label: ADMIN_ONLINE_STATS_VTTG_APPS_LABEL,
        value: formatCounter(appCounters?.total),
      },
      {
        divider: 'none',
        isTotal: false,
        label: ADMIN_ONLINE_STATS_VTTG_PLAYERS_LABEL,
        value: formatCounter(appCounters?.players),
      },
      {
        divider: 'none',
        isTotal: false,
        label: ADMIN_ONLINE_STATS_VTTG_IDLE_LABEL,
        value: formatRemainder(appCounters?.total, appCounters?.players),
      },
      {
        divider: 'none',
        isTotal: false,
        label: ADMIN_ONLINE_STATS_VTTG_REGISTERED_LABEL,
        value: formatCounter(appCounters?.registered),
      },
      {
        divider: 'above',
        isTotal: false,
        label: ADMIN_ONLINE_STATS_VTTG_TABLE_LABEL,
        value: formatCounter(tableCounters?.total),
      },
      {
        divider: 'above',
        isTotal: true,
        label: ADMIN_ONLINE_STATS_VTTG_TOTAL_LABEL,
        value: formatSum(appCounters?.total, tableCounters?.total),
      },
    ];
  }

  /**
   * Собирает карточку VTTG: обе его аудитории живут в одной карточке, потому что в
   * отрыве друг от друга не значат ничего — столы без приложений и приложения без столов.
   *
   * Про столы сервис онлайна может ещё не знать — тогда в двух нижних строках прочерк,
   * как и в любом другом месте, где числа у нас нет. Строки при этом остаются: карточка
   * не должна менять форму от того, обновлён сервис или ещё нет.
   */
  function createVttgCard(
    appCounters: AdminOnlineCounters | null,
    tableCounters: AdminOnlineCounters | null,
  ): AdminOnlineSiteCard {
    return {
      rows: createVttgRows(appCounters, tableCounters),
      siteId: ADMIN_ONLINE_STATS_VTTG_SITE_ID,
      siteLabel: ADMIN_ONLINE_STATS_VTTG_SITE_LABEL,
    };
  }

  /**
   * Собирает карточку обычного сайта.
   */
  function createSiteCard(
    siteId: string,
    counters: AdminOnlineCounters | null,
  ): AdminOnlineSiteCard {
    return {
      rows: createSiteRows(counters),
      siteId,
      siteLabel: ADMIN_ONLINE_STATS_SITE_LABEL,
    };
  }

  // Без данных сетка не схлопывается: остаётся каркас из известных площадок, а
  // числа показываем скелетоном (ждём ответ) или прочерком (ответа не будет).
  const siteCards = computed<AdminOnlineSiteCard[]>(() => {
    if (!props.stats) {
      return ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS.map((siteId) =>
        siteId === ADMIN_ONLINE_STATS_VTTG_SITE_ID
          ? createVttgCard(null, null)
          : createSiteCard(siteId, null),
      );
    }

    const tableCounters = props.stats.sites.find(
      (siteStats) => siteStats.siteId === ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
    );

    // Столы своей карточки не получают — они уходят строками в карточку приложения.
    return props.stats.sites
      .filter(
        (siteStats) =>
          siteStats.siteId !== ADMIN_ONLINE_STATS_VTTG_TABLE_SITE_ID,
      )
      .map((siteStats) =>
        siteStats.siteId === ADMIN_ONLINE_STATS_VTTG_SITE_ID
          ? createVttgCard(siteStats, tableCounters ?? null)
          : createSiteCard(siteStats.siteId, siteStats),
      );
  });

  const summaryTotal = computed(() => formatCounter(props.stats?.total.total));

  // Сетку карточек держим отдельно от ответа online-app: в неё через слот
  // добавляются карточки другой статистики (листы персонажа), и падение
  // online-app не должно их прятать.
  const hasCards = computed(() => !!siteCards.value.length || !!slots.default);

  // Сообщение показываем, когда online-app ответил без сайтов, — даже если сетка
  // рендерится ради карточек из слота, иначе пропажу online-данных не заметить.
  // При ошибке и загрузке говорить «сайтов нет» рано: там каркас с прочерками.
  const hasEmptySites = computed(
    () => !props.hasError && !!props.stats && !props.stats.sites.length,
  );

  /**
   * Запрашивает актуальные данные online-статистики.
   */
  function handleRefresh(): void {
    emit('refresh');
  }
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ ADMIN_ONLINE_STATS_TITLE }}
        </h2>

        <p class="text-sm text-muted">
          {{ ADMIN_ONLINE_STATS_DESCRIPTION }}
        </p>
      </div>

      <UButton
        icon="tabler:refresh"
        variant="subtle"
        size="sm"
        :loading="isLoading"
        @click.left.exact.prevent="handleRefresh"
      >
        {{ ADMIN_ONLINE_STATS_REFRESH_LABEL }}
      </UButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 text-sm text-muted">
      <USkeleton
        v-if="isPending"
        class="h-5 w-28 rounded-full"
      />

      <UBadge
        v-else-if="stats"
        color="neutral"
        variant="subtle"
      >
        {{ ADMIN_ONLINE_STATS_WINDOW_LABEL }}:
        {{ stats.windowMinutes }}
        {{ ADMIN_ONLINE_STATS_MINUTES_LABEL }}
      </UBadge>

      <USkeleton
        v-if="isPending"
        class="h-5 w-24"
      />

      <span v-else>
        {{ ADMIN_ONLINE_STATS_SUMMARY_LABEL }}:
        {{ summaryTotal }}
      </span>
    </div>

    <div
      v-if="hasEmptySites"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted"
    >
      {{ ADMIN_ONLINE_STATS_EMPTY_TEXT }}
    </div>

    <div
      v-if="hasCards"
      class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
    >
      <UCard
        v-for="card in siteCards"
        :key="card.siteId"
        variant="subtle"
      >
        <dl class="space-y-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">{{ card.siteLabel }}</dt>

            <dd class="font-semibold text-highlighted">
              {{ card.siteId }}
            </dd>
          </div>

          <AdminOnlineStatsRow
            v-for="row in card.rows"
            :key="row.label"
            :is-pending="isPending"
            :row="row"
          />
        </dl>
      </UCard>

      <slot />
    </div>
  </section>
</template>
