<script setup lang="ts">
  import type {
    AdminOnlineCounters,
    AdminOnlineSiteCard,
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
    ADMIN_ONLINE_STATS_VTTG_GUESTS_LABEL,
    ADMIN_ONLINE_STATS_VTTG_SITE_ID,
    ADMIN_ONLINE_STATS_VTTG_SITE_LABEL,
    ADMIN_ONLINE_STATS_WINDOW_LABEL,
  } from '../model';

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
   * Собирает карточку площадки: VTTG — десктопное приложение со своей
   * аудиторией, поэтому у него подписи «Приложение» и «Игроков», у сайтов
   * остаются «Сайт» и «Гостей».
   */
  function createSiteCard(
    siteId: string,
    counters: AdminOnlineCounters | null,
  ): AdminOnlineSiteCard {
    const isApp = siteId === ADMIN_ONLINE_STATS_VTTG_SITE_ID;

    return {
      guests: formatCounter(counters?.guests),
      guestsLabel: isApp
        ? ADMIN_ONLINE_STATS_VTTG_GUESTS_LABEL
        : ADMIN_ONLINE_STATS_GUESTS_LABEL,
      registered: formatCounter(counters?.registered),
      siteId,
      siteLabel: isApp
        ? ADMIN_ONLINE_STATS_VTTG_SITE_LABEL
        : ADMIN_ONLINE_STATS_SITE_LABEL,
      total: formatCounter(counters?.total),
    };
  }

  // Без данных сетка не схлопывается: остаётся каркас из известных площадок, а
  // числа показываем скелетоном (ждём ответ) или прочерком (ответа не будет).
  const siteCards = computed<AdminOnlineSiteCard[]>(() =>
    props.stats
      ? props.stats.sites.map((siteStats) =>
          createSiteCard(siteStats.siteId, siteStats),
        )
      : ADMIN_ONLINE_STATS_PLACEHOLDER_SITE_IDS.map((siteId) =>
          createSiteCard(siteId, null),
        ),
  );

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

          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">{{ card.guestsLabel }}</dt>

            <dd class="font-medium text-default">
              <USkeleton
                v-if="isPending"
                class="h-5 w-10"
              />

              <template v-else>{{ card.guests }}</template>
            </dd>
          </div>

          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">
              {{ ADMIN_ONLINE_STATS_REGISTERED_LABEL }}
            </dt>

            <dd class="font-medium text-default">
              <USkeleton
                v-if="isPending"
                class="h-5 w-10"
              />

              <template v-else>{{ card.registered }}</template>
            </dd>
          </div>

          <div
            class="flex items-center justify-between gap-4 border-t border-default pt-3"
          >
            <dt class="font-medium text-default">
              {{ ADMIN_ONLINE_STATS_TOTAL_LABEL }}
            </dt>

            <dd class="text-lg font-semibold text-primary">
              <USkeleton
                v-if="isPending"
                class="h-7 w-12"
              />

              <template v-else>{{ card.total }}</template>
            </dd>
          </div>
        </dl>
      </UCard>

      <slot />
    </div>
  </section>
</template>
