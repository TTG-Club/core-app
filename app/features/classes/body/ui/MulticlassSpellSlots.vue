<script setup lang="ts">
  import type { Level } from '~/shared/types';

  import type { ClassInMulticlass } from '../../model';

  import { LEVELS } from '~/shared/consts';

  import {
    CasterType,
    getPactMagicLevel,
    getPactMagicRowLabel,
    getPactSpellSlotsByLevel,
    MULTICLASS_SPELL_SLOTS,
    SPELL_SLOT_LEVELS,
  } from '../../model';
  import {
    EMPTY_SPELL_SLOT_CELL,
    MULTICLASS_SPELL_SLOT_TABLE_LABELS,
    PACT_MAGIC_ROW_CLASS,
  } from './table/const';

  interface Props {
    casterType: CasterType;
    spellcastingLevel?: number;
    multiclass?: Array<ClassInMulticlass>;
  }

  /** Вид строки таблицы ячеек: общие ячейки заклинателя или ячейки договора. */
  type SpellSlotsRowKind = 'spellcasting' | 'pact-magic';

  /** Строка таблицы ячеек: подпись слева и ячейки по кругам. */
  interface SpellSlotsRow {
    key: SpellSlotsRowKind;
    label: string;
    slots: Array<number | string>;
    rowClass: string;
  }

  /** Уровень из ответа в уровень таблиц; ноль и выше двадцатого — нет уровня. */
  function toLevel(value: number | undefined): Level | undefined {
    return LEVELS.find((level) => level === value);
  }

  /** Ноль ячеек круга рисуется прочерком, как в таблице прогрессии класса. */
  function toSlotCell(slotCount: number): number | string {
    return slotCount > 0 ? slotCount : EMPTY_SPELL_SLOT_CELL;
  }

  const props = defineProps<Props>();

  const spellcastingLevel = computed(() => toLevel(props.spellcastingLevel));

  /**
   * Уровень Магии договора считается по отрезкам колдуна, а не по общему
   * уровню заклинателя: в него уровни колдуна не входят.
   */
  const pactMagicLevel = computed(() =>
    toLevel(getPactMagicLevel(props.multiclass)),
  );

  const rows = computed<Array<SpellSlotsRow>>(() => {
    const slotRows: Array<SpellSlotsRow> = [];

    if (
      props.casterType === CasterType.MULTICLASS
      && spellcastingLevel.value !== undefined
    ) {
      slotRows.push({
        key: 'spellcasting',
        label: String(spellcastingLevel.value),
        slots: MULTICLASS_SPELL_SLOTS[spellcastingLevel.value].map(toSlotCell),
        rowClass: '',
      });
    }

    if (pactMagicLevel.value !== undefined) {
      slotRows.push({
        key: 'pact-magic',
        label: getPactMagicRowLabel(props.multiclass),
        slots: getPactSpellSlotsByLevel(pactMagicLevel.value).map(toSlotCell),
        rowClass: PACT_MAGIC_ROW_CLASS,
      });
    }

    return slotRows;
  });
</script>

<template>
  <div
    v-if="rows.length > 0"
    class="flex w-full flex-col gap-1.5"
  >
    <div
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

        <tbody class="divide-y divide-default">
          <tr
            v-for="row in rows"
            :key="row.key"
            :class="row.rowClass"
          >
            <td class="px-2 py-1.5 text-left text-xs text-default">
              {{ row.label }}
            </td>

            <td
              v-for="(slotCount, slotIndex) in row.slots"
              :key="slotIndex"
              class="w-12 px-2 py-1.5 text-center text-xs text-default"
            >
              {{ slotCount }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p
      v-if="pactMagicLevel !== undefined"
      class="px-2 text-xs text-secondary"
    >
      {{ MULTICLASS_SPELL_SLOT_TABLE_LABELS.pactMagicNote }}
    </p>
  </div>
</template>
