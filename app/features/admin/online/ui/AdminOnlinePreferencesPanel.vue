<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    AdminOnlinePreferenceSummary,
    AdminOnlineStatsResponse,
  } from '../model';

  import { AdminDashboardPanel } from '~admin/dashboard/ui';

  import {
    ADMIN_ONLINE_PREFERENCE_SECTIONS,
    ADMIN_ONLINE_PREFERENCES_PERIOD_HINT,
    ADMIN_ONLINE_PREFERENCES_TITLE,
    collectPreferencePeriods,
    createPreferenceSummary,
    formatPreferencePeriod,
    sumPreferencePeriod,
  } from '../model';
  import AdminOnlinePreferenceBreakdown from './AdminOnlinePreferenceBreakdown.vue';

  const props = defineProps<{
    isPending: boolean;
    stats: AdminOnlineStatsResponse | null;
  }>();

  const preferencePeriods = computed(() =>
    collectPreferencePeriods(props.stats?.sites ?? []),
  );

  const selectedPreferencePeriod = ref<number | null>(null);

  // Пока период не выбран вручную, показываем самый короткий: «сегодня» ближе всего
  // к «чем пользуются сейчас». Выбранный период пропал из ответа — тоже к нему.
  const activePreferencePeriod = computed(() =>
    selectedPreferencePeriod.value !== null
    && preferencePeriods.value.includes(selectedPreferencePeriod.value)
      ? selectedPreferencePeriod.value
      : (preferencePeriods.value[0] ?? null),
  );

  const preferencePeriodTabs = computed<Array<TabsItem>>(() =>
    preferencePeriods.value.map((days) => ({
      label: formatPreferencePeriod(days),
      value: String(days),
    })),
  );

  const hasPreferencePeriodTabs = computed(
    () => !!preferencePeriodTabs.value.length,
  );

  const activePreferencePeriodTab = computed(() =>
    activePreferencePeriod.value === null
      ? undefined
      : String(activePreferencePeriod.value),
  );

  // Без срезов в ответе (ошибка, online-app не обновлён) — прочерки.
  const preferenceSummaries = computed<AdminOnlinePreferenceSummary[]>(() => {
    const counts =
      props.stats && activePreferencePeriod.value !== null
        ? sumPreferencePeriod(props.stats.sites, activePreferencePeriod.value)
        : null;

    return ADMIN_ONLINE_PREFERENCE_SECTIONS.map((section) =>
      createPreferenceSummary(
        section,
        counts ? (counts[section.name] ?? {}) : null,
      ),
    );
  });

  /**
   * Переключает период, за который показаны настройки отображения.
   */
  function handlePreferencePeriodChange(tabValue: string | number): void {
    const days = Number(tabValue);

    if (Number.isInteger(days)) {
      selectedPreferencePeriod.value = days;
    }
  }
</script>

<template>
  <AdminDashboardPanel
    :title="ADMIN_ONLINE_PREFERENCES_TITLE"
    :hint="ADMIN_ONLINE_PREFERENCES_PERIOD_HINT"
  >
    <template
      v-if="hasPreferencePeriodTabs"
      #meta
    >
      <UTabs
        :items="preferencePeriodTabs"
        :model-value="activePreferencePeriodTab"
        :content="false"
        size="xs"
        @update:model-value="handlePreferencePeriodChange"
      />
    </template>

    <div
      class="grid h-full divide-y divide-default sm:grid-cols-2 sm:divide-x sm:divide-y-0"
    >
      <AdminOnlinePreferenceBreakdown
        v-for="preferenceSummary in preferenceSummaries"
        :key="preferenceSummary.name"
        :preference-summary="preferenceSummary"
        :is-pending="isPending"
      />
    </div>
  </AdminDashboardPanel>
</template>
