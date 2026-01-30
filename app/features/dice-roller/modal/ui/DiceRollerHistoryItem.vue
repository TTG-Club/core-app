<script setup lang="ts">
  import type {
    CriticalType,
    DiceRollItem,
    HistoryEntry,
  } from '~dice-roller/types';

  const props = defineProps<{
    entry: HistoryEntry;
    formattedDateTime?: string;
  }>();

  type BadgeColor = 'success' | 'error' | 'neutral';

  interface EnrichedRoll extends DiceRollItem {
    badgeColor: BadgeColor;
    badgeClass: string[];
  }

  interface EnrichedDetail {
    id: string;
    rolls: EnrichedRoll[];
  }

  const criticalColorMap: Record<NonNullable<CriticalType>, BadgeColor> = {
    success: 'success',
    failure: 'error',
  };

  const enrichedDetails = computed<EnrichedDetail[]>(() => {
    if (!props.entry.structuredDetails?.length) {
      return [];
    }

    return props.entry.structuredDetails.map((detail) => ({
      id: detail.id,
      rolls: detail.rolls.map((roll) => ({
        ...roll,
        badgeColor: roll.critical ? criticalColorMap[roll.critical] : 'neutral',
        badgeClass: roll.valid
          ? ['min-w-6 justify-center']
          : ['min-w-6 justify-center', 'line-through', 'opacity-60'],
      })),
    }));
  });
</script>

<template>
  <li
    class="flex items-start gap-4 rounded-xl border border-default bg-elevated p-2 transition hover:border-primary"
  >
    <div
      class="flex min-w-8 shrink-0 flex-col items-center justify-center gap-1"
    >
      <span class="text-3xl leading-none font-bold tracking-tight text-primary">
        {{ entry.displayValue }}
      </span>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <p class="truncate font-medium text-default">
          {{ entry.formula }}
        </p>

        <NuxtTime
          :title="formattedDateTime"
          :datetime="entry.timestamp"
          class="shrink-0 text-xs text-muted"
          relative-style="long"
          locale="ru-RU"
          relative
        />
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
            :variant="roll.valid ? 'subtle' : 'outline'"
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
    </div>
  </li>
</template>
