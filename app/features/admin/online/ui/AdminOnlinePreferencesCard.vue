<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { AdminOnlineStatsResponse } from '../model';

  import {
    ADMIN_ONLINE_PREFERENCE_SECTIONS,
    ADMIN_ONLINE_PREFERENCES_DESCRIPTION,
    ADMIN_ONLINE_PREFERENCES_EMPTY_TEXT,
    ADMIN_ONLINE_PREFERENCES_TITLE,
    collectPreferencePeriods,
    createPreferenceRows,
    formatPreferencePeriod,
    sumPreferencePeriod,
  } from '../model';

  const props = defineProps<{
    hasError: boolean;
    isPending: boolean;
    stats: AdminOnlineStatsResponse | null;
  }>();

  const periods = computed(() =>
    collectPreferencePeriods(props.stats?.sites ?? []),
  );

  const selectedPeriod = ref<number | null>(null);

  // Пока период не выбран вручную, показываем самый короткий: «сегодня» отвечает
  // на вопрос «чем пользуются сейчас». Выбранный период пропал из ответа — тоже к нему.
  const activePeriod = computed(() =>
    selectedPeriod.value !== null
    && periods.value.includes(selectedPeriod.value)
      ? selectedPeriod.value
      : (periods.value[0] ?? null),
  );

  const periodTabs = computed<Array<TabsItem>>(() =>
    periods.value.map((days) => ({
      label: formatPreferencePeriod(days),
      value: String(days),
    })),
  );

  const activePeriodTab = computed(() =>
    activePeriod.value === null ? undefined : String(activePeriod.value),
  );

  const sections = computed(() => {
    const counts =
      activePeriod.value === null
        ? {}
        : sumPreferencePeriod(props.stats?.sites ?? [], activePeriod.value);

    return ADMIN_ONLINE_PREFERENCE_SECTIONS.map((section) => ({
      name: section.name,
      rows: createPreferenceRows(section, counts[section.name] ?? {}),
      title: section.title,
    }));
  });

  // Пустота — когда ответ пришёл, а срезов в нём нет. При ошибке тоже пусто: чисел не будет.
  const isEmpty = computed(
    () => !props.isPending && (props.hasError || !periods.value.length),
  );

  /**
   * Переключает период, за который показаны настройки.
   */
  function handlePeriodChange(value: string | number): void {
    const days = Number(value);

    if (Number.isInteger(days)) {
      selectedPeriod.value = days;
    }
  }
</script>

<template>
  <UCard variant="subtle">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h3 class="text-base font-semibold text-highlighted">
          {{ ADMIN_ONLINE_PREFERENCES_TITLE }}
        </h3>

        <p class="text-sm text-muted">
          {{ ADMIN_ONLINE_PREFERENCES_DESCRIPTION }}
        </p>
      </div>

      <UTabs
        v-if="periodTabs.length"
        :items="periodTabs"
        :model-value="activePeriodTab"
        :content="false"
        size="xs"
        @update:model-value="handlePeriodChange"
      />
    </div>

    <p
      v-if="isEmpty"
      class="mt-4 text-sm text-muted"
    >
      {{ ADMIN_ONLINE_PREFERENCES_EMPTY_TEXT }}
    </p>

    <div
      v-else
      class="mt-4 grid gap-6 sm:grid-cols-2"
    >
      <section
        v-for="section in sections"
        :key="section.name"
        class="space-y-3"
      >
        <h4 class="text-sm font-medium text-default">
          {{ section.title }}
        </h4>

        <div
          v-for="row in section.rows"
          :key="row.value"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="flex min-w-0 items-center gap-2 text-muted">
              <UIcon
                :name="row.icon"
                class="size-4 shrink-0"
              />

              <span class="truncate">{{ row.label }}</span>
            </span>

            <USkeleton
              v-if="isPending"
              class="h-5 w-16"
            />

            <span
              v-else
              class="shrink-0 font-medium text-default"
            >
              {{ row.count }}
              <span class="text-muted">{{ row.share }}</span>
            </span>
          </div>

          <UProgress
            :model-value="row.percent"
            size="xs"
          />
        </div>
      </section>
    </div>
  </UCard>
</template>
