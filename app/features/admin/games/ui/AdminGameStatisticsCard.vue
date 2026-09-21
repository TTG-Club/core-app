<script setup lang="ts">
  import type { AdminGameStatistics } from '../model';

  import {
    ADMIN_GAME_STATISTICS_COMPLETED_LABEL,
    ADMIN_GAME_STATISTICS_ERROR_TEXT,
    ADMIN_GAME_STATISTICS_NUMBER_FORMAT,
    ADMIN_GAME_STATISTICS_TITLE,
    ADMIN_GAME_STATISTICS_TOTAL_LABEL,
  } from '../model';

  const props = defineProps<{
    hasError: boolean;
    isLoading: boolean;
    statistics: AdminGameStatistics | null;
  }>();

  const isPending = computed(() => props.isLoading || !props.statistics);

  const completedLabel = computed(() =>
    props.statistics
      ? ADMIN_GAME_STATISTICS_NUMBER_FORMAT.format(props.statistics.completed)
      : '',
  );

  const totalLabel = computed(() =>
    props.statistics
      ? ADMIN_GAME_STATISTICS_NUMBER_FORMAT.format(props.statistics.total)
      : '',
  );
</script>

<template>
  <UCard variant="subtle">
    <h3 class="text-base font-semibold text-highlighted">
      {{ ADMIN_GAME_STATISTICS_TITLE }}
    </h3>

    <p
      v-if="hasError"
      class="mt-3 text-sm text-muted"
      role="status"
    >
      {{ ADMIN_GAME_STATISTICS_ERROR_TEXT }}
    </p>

    <dl
      v-else
      class="mt-3 space-y-3 text-sm"
      :aria-busy="isPending"
    >
      <div class="flex items-center justify-between gap-4">
        <dt class="text-muted">{{ ADMIN_GAME_STATISTICS_COMPLETED_LABEL }}</dt>

        <dd class="shrink-0 font-medium text-default tabular-nums">
          <USkeleton
            v-if="isPending"
            class="h-5 w-10"
          />

          <template v-else>{{ completedLabel }}</template>
        </dd>
      </div>

      <div
        class="flex items-center justify-between gap-4 border-t border-default pt-3"
      >
        <dt class="font-medium text-default">
          {{ ADMIN_GAME_STATISTICS_TOTAL_LABEL }}
        </dt>

        <dd class="shrink-0 text-lg font-semibold text-primary tabular-nums">
          <USkeleton
            v-if="isPending"
            class="h-7 w-12"
          />

          <template v-else>{{ totalLabel }}</template>
        </dd>
      </div>
    </dl>
  </UCard>
</template>
