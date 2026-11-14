<script setup lang="ts">
  import type { AdminOnlinePreferenceSummary } from '../model';

  import {
    ADMIN_DASHBOARD_HINT_ICON,
    ADMIN_DASHBOARD_TOOLTIP_UI,
  } from '~admin/dashboard/model';

  import {
    ADMIN_ONLINE_PREFERENCES_SHARE_MAX,
    ADMIN_ONLINE_STATS_TOTAL_LABEL,
  } from '../model';

  defineProps<{
    isPending: boolean;
    preferenceSummary: AdminOnlinePreferenceSummary;
  }>();
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2 px-4 py-3">
    <div class="flex items-baseline justify-between gap-3 text-xs">
      <span class="flex items-center gap-1 font-medium text-default">
        {{ preferenceSummary.title }}

        <UTooltip
          v-if="preferenceSummary.hint"
          :text="preferenceSummary.hint"
          :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
        >
          <UIcon
            :name="ADMIN_DASHBOARD_HINT_ICON"
            class="size-3.5 self-center text-dimmed"
          />
        </UTooltip>
      </span>

      <span class="text-muted">
        {{ ADMIN_ONLINE_STATS_TOTAL_LABEL }}
        <USkeleton
          v-if="isPending"
          class="inline-block h-3 w-6 align-middle"
        />

        <span
          v-else
          class="font-semibold text-highlighted tabular-nums"
        >
          {{ preferenceSummary.total }}
        </span>
      </span>
    </div>

    <dl
      class="grid grid-cols-[minmax(4rem,auto)_1fr_auto] items-center gap-x-3 gap-y-1.5 text-xs"
    >
      <template
        v-for="optionRow in preferenceSummary.rows"
        :key="optionRow.label"
      >
        <dt class="truncate text-muted">{{ optionRow.label }}</dt>

        <UProgress
          :model-value="optionRow.share"
          :max="ADMIN_ONLINE_PREFERENCES_SHARE_MAX"
          size="xs"
          :ui="{ base: 'bg-accented' }"
        />

        <dd class="text-right font-medium text-default tabular-nums">
          <USkeleton
            v-if="isPending"
            class="ml-auto h-3 w-10"
          />

          <template v-else>{{ optionRow.value }}</template>
        </dd>
      </template>
    </dl>
  </div>
</template>
