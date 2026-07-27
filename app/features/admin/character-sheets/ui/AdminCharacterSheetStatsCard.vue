<script setup lang="ts">
  import type { AdminCharacterSheetStats } from '../model';

  import {
    ADMIN_SHEET_STATS_ACTIVE_LABEL,
    ADMIN_SHEET_STATS_ERROR_TEXT,
    ADMIN_SHEET_STATS_SITE_LABEL,
    ADMIN_SHEET_STATS_SITE_VALUE,
    ADMIN_SHEET_STATS_TITLE,
    ADMIN_SHEET_STATS_TOTAL_LABEL,
  } from '../model';

  const props = defineProps<{
    hasError: boolean;
    isLoading: boolean;
    stats: AdminCharacterSheetStats | null;
  }>();

  // Данных ещё нет — значит запрос впереди или в пути (на сервере и в первом
  // клиентском рендере статус useAsyncData ещё 'idle'), показывать нечего.
  const isPending = computed(() => props.isLoading || !props.stats);

  const activeCount = computed(() => props.stats?.active ?? 0);

  const totalCount = computed(() => props.stats?.total ?? 0);
</script>

<template>
  <UCard variant="subtle">
    <h3 class="text-base font-semibold text-highlighted">
      {{ ADMIN_SHEET_STATS_TITLE }}
    </h3>

    <p
      v-if="hasError"
      class="mt-3 text-sm text-muted"
    >
      {{ ADMIN_SHEET_STATS_ERROR_TEXT }}
    </p>

    <dl
      v-else
      class="mt-3 space-y-3 text-sm"
    >
      <div class="flex items-center justify-between gap-4">
        <dt class="text-muted">{{ ADMIN_SHEET_STATS_SITE_LABEL }}</dt>

        <dd class="font-semibold text-highlighted">
          {{ ADMIN_SHEET_STATS_SITE_VALUE }}
        </dd>
      </div>

      <div class="flex items-center justify-between gap-4">
        <dt class="text-muted">{{ ADMIN_SHEET_STATS_ACTIVE_LABEL }}</dt>

        <dd class="font-medium text-default">
          <USkeleton
            v-if="isPending"
            class="h-5 w-10"
          />

          <template v-else>{{ activeCount }}</template>
        </dd>
      </div>

      <div
        class="flex items-center justify-between gap-4 border-t border-default pt-3"
      >
        <dt class="font-medium text-default">
          {{ ADMIN_SHEET_STATS_TOTAL_LABEL }}
        </dt>

        <dd class="text-lg font-semibold text-primary">
          <USkeleton
            v-if="isPending"
            class="h-7 w-12"
          />

          <template v-else>{{ totalCount }}</template>
        </dd>
      </div>
    </dl>
  </UCard>
</template>
