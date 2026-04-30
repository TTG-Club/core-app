<script setup lang="ts">
  import type { Level } from '~/shared/types';

  import { computed } from 'vue';

  import { LEVELS } from '~/shared/consts';

  import { CasterType } from '../../model';
  import {
    MULTICLASS_SPELL_SLOT_TABLE_LABELS,
    MULTICLASS_SPELL_SLOTS,
    PACT_CASTER_SPELL_SLOTS_COUNT,
    PACT_CASTER_SPELL_SLOTS_LEVEL,
    SPELL_SLOT_LEVELS,
  } from './table/const';

  interface Props {
    casterType: CasterType;
    spellcastingLevel?: number;
  }

  const props = defineProps<Props>();

  const normalizedSpellcastingLevel = computed<Level | undefined>(() => {
    if (props.spellcastingLevel === undefined) {
      return undefined;
    }

    return LEVELS.find((level) => level === props.spellcastingLevel);
  });

  const shouldShowMulticlassSlots = computed(
    () =>
      props.casterType === CasterType.MULTICLASS
      && normalizedSpellcastingLevel.value !== undefined,
  );

  const shouldShowPactSlots = computed(
    () =>
      props.casterType === CasterType.PACT
      && normalizedSpellcastingLevel.value !== undefined,
  );

  const multiclassSpellSlots = computed(() => {
    if (normalizedSpellcastingLevel.value === undefined) {
      return [];
    }

    return MULTICLASS_SPELL_SLOTS[normalizedSpellcastingLevel.value].map(
      (slotCount) => (slotCount > 0 ? slotCount : '—'),
    );
  });

  const pactSlotsCount = computed(() => {
    if (normalizedSpellcastingLevel.value === undefined) {
      return undefined;
    }

    return PACT_CASTER_SPELL_SLOTS_COUNT[normalizedSpellcastingLevel.value];
  });

  const pactSlotsLevel = computed(() => {
    if (normalizedSpellcastingLevel.value === undefined) {
      return undefined;
    }

    return PACT_CASTER_SPELL_SLOTS_LEVEL[normalizedSpellcastingLevel.value];
  });
</script>

<template>
  <div
    v-if="shouldShowMulticlassSlots"
    class="w-full overflow-x-auto rounded-lg border border-default bg-muted"
  >
    <table class="min-w-full border-collapse">
      <thead class="bg-elevated">
        <tr>
          <th class="min-w-44 px-2 py-1.5 text-left text-xs text-highlighted">
            {{ MULTICLASS_SPELL_SLOT_TABLE_LABELS.spellcasterLevel }}
          </th>

          <th
            v-for="spellSlotLevel in SPELL_SLOT_LEVELS"
            :key="spellSlotLevel"
            class="w-12 px-2 py-1.5 text-center text-xs text-highlighted"
          >
            {{ spellSlotLevel }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td class="px-2 py-1.5 text-left text-xs text-default">
            {{ normalizedSpellcastingLevel }}
          </td>

          <td
            v-for="(slotCount, slotIndex) in multiclassSpellSlots"
            :key="slotIndex"
            class="w-12 px-2 py-1.5 text-center text-xs text-default"
          >
            {{ slotCount }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    v-else-if="shouldShowPactSlots"
    class="w-full overflow-x-auto rounded-lg border border-default bg-muted"
  >
    <table class="min-w-full border-collapse">
      <thead class="bg-elevated">
        <tr>
          <th class="px-2 py-1.5 text-left text-xs text-highlighted">
            {{ MULTICLASS_SPELL_SLOT_TABLE_LABELS.spellcasterLevel }}
          </th>

          <th class="px-2 py-1.5 text-center text-xs text-highlighted">
            {{ MULTICLASS_SPELL_SLOT_TABLE_LABELS.pactSlotsCount }}
          </th>

          <th class="px-2 py-1.5 text-center text-xs text-highlighted">
            {{ MULTICLASS_SPELL_SLOT_TABLE_LABELS.pactSlotLevel }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td class="px-2 py-1.5 text-left text-xs text-default">
            {{ normalizedSpellcastingLevel }}
          </td>

          <td class="px-2 py-1.5 text-center text-xs text-default">
            {{ pactSlotsCount }}
          </td>

          <td class="px-2 py-1.5 text-center text-xs text-default">
            {{ pactSlotsLevel }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
