<script setup lang="ts">
  import type { CriticalType, DiceRollItem, HistoryEntry } from '../../types';

  const { entry } = defineProps<{
    entry: HistoryEntry;
  }>();

  type BadgeColor = 'success' | 'error' | 'neutral';

  interface EnrichedRoll extends DiceRollItem {
    badgeColor: BadgeColor;
    badgeClass: string[];
    badgeVariant: 'subtle' | 'outline';
  }

  interface EnrichedDetail {
    id: string;
    rolls: EnrichedRoll[];
  }

  const dayjs = useDayjs();

  function formatDateTime(timestamp: number): string | undefined {
    const date = dayjs(timestamp);

    if (!date.isValid()) {
      return undefined;
    }

    return date.local().format('LLL');
  }

  const criticalColorMap: Record<NonNullable<CriticalType>, BadgeColor> = {
    success: 'success',
    failure: 'error',
  };

  const enrichedDetails = computed<EnrichedDetail[]>(() => {
    if (!entry.structuredDetails?.length) {
      return [];
    }

    return entry.structuredDetails.map((detail) => ({
      id: detail.id,
      rolls: detail.rolls.map((roll) => ({
        ...roll,
        badgeColor: roll.critical ? criticalColorMap[roll.critical] : 'neutral',
        badgeVariant: roll.valid ? 'subtle' : 'outline',
        badgeClass: roll.valid
          ? ['min-w-6 justify-center']
          : ['min-w-6 justify-center', 'line-through', 'opacity-60'],
      })),
    }));
  });
</script>

<template>
  <li
    class="flex flex-col gap-2 rounded-xl border border-default bg-elevated p-3 transition hover:border-primary"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col justify-center gap-1 overflow-hidden">
        <span
          class="text-base font-medium wrap-break-word text-primary"
          :class="{
            'text-error': entry.isError,
          }"
        >
          {{ entry.displayValue }}
        </span>
      </div>

      <NuxtTime
        :title="formatDateTime(entry.timestamp)"
        :datetime="entry.timestamp"
        class="shrink-0 text-xs text-muted"
        relative-style="long"
        locale="ru-RU"
        relative
      />
    </div>

    <div class="w-full">
      <p class="text-sm font-medium wrap-break-word text-default">
        {{ entry.formula }}
      </p>
    </div>

    <div
      v-if="enrichedDetails.length"
      class="flex flex-col gap-2"
    >
      <div
        v-for="detail in enrichedDetails"
        :key="detail.id"
        class="flex flex-wrap gap-1"
      >
        <UBadge
          v-for="roll in detail.rolls"
          :key="roll.id"
          :color="roll.badgeColor"
          :variant="roll.badgeVariant"
          :class="roll.badgeClass"
        >
          {{ roll.value }}
        </UBadge>
      </div>
    </div>

    <p
      v-else-if="entry.detail"
      class="text-xs text-muted"
    >
      {{ entry.detail }}
    </p>
  </li>
</template>
