<script setup lang="ts">
  import type { FeatDefences, SpeedUnit } from '../../model';

  import { SHEET_DEFENCES_LABELS, SPEED_UNIT_SHORT_LABELS } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const { defences, unit } = defineProps<{
    defences: FeatDefences;

    /** Единица расстояния листа: в ней показывается дальность телепатии. */
    unit: SpeedUnit;
  }>();

  interface DefenceGroup {
    key: string;
    title: string;
    items: string[];
  }

  /**
   * Группы защит: пустые не показываются вовсе — панель и целиком появляется
   * только тогда, когда черта хоть что-то дала.
   */
  const groups = computed<DefenceGroup[]>(() =>
    [
      {
        key: 'resistances',
        title: SHEET_DEFENCES_LABELS.resistances,
        items: defences.resistances,
      },
      {
        key: 'immunities',
        title: SHEET_DEFENCES_LABELS.immunities,
        items: defences.immunities,
      },
      {
        key: 'vulnerabilities',
        title: SHEET_DEFENCES_LABELS.vulnerabilities,
        items: defences.vulnerabilities,
      },
      {
        key: 'conditionImmunities',
        title: SHEET_DEFENCES_LABELS.conditionImmunities,
        items: defences.conditionImmunities,
      },
      {
        key: 'creatureType',
        title: SHEET_DEFENCES_LABELS.creatureType,
        items: defences.creatureType ? [defences.creatureType] : [],
      },
      {
        key: 'telepathy',
        title: SHEET_DEFENCES_LABELS.telepathy,
        items: defences.telepathyRange
          ? [`${defences.telepathyRange} ${SPEED_UNIT_SHORT_LABELS[unit]}`]
          : [],
      },
    ].filter((group) => group.items.length > 0),
  );
</script>

<template>
  <SheetPanel>
    <!-- pt-2 добирает верхний отступ панели (pt-1) до бокового px-3 -->
    <div class="flex flex-col gap-4 pt-2">
      <div
        v-for="group in groups"
        :key="group.key"
        class="flex flex-col gap-2"
      >
        <h4
          class="rounded-md bg-elevated text-[11px] font-bold tracking-wider text-highlighted uppercase"
        >
          <span class="flex items-center px-3 py-1.5 leading-none">
            {{ group.title }}
          </span>
        </h4>

        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="item in group.items"
            :key="item"
            :label="item"
            color="neutral"
            variant="subtle"
            size="sm"
          />
        </div>
      </div>
    </div>
  </SheetPanel>
</template>
