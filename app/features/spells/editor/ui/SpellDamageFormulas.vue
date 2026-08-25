<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';

  import type { SpellDamageFormulaPart } from '../../model';

  import { isEqual } from 'es-toolkit';

  import { createEmptySpellDamageFormulaPart } from '../../model';
  import SpellDamageFormulaRow from './SpellDamageFormulaRow.vue';

  const { damageTypeOptions, damageTypesPending = false } = defineProps<{
    /** Типы урона справочника — грузит редактор воздействия, один раз на форму. */
    damageTypeOptions: Array<SelectOption>;
    /** Справочник ещё грузится. */
    damageTypesPending?: boolean;
  }>();

  const model = defineModel<Array<SpellDamageFormulaPart>>({ required: true });

  const formulaRows = ref<Array<SpellDamageFormulaPart>>([
    createEmptySpellDamageFormulaPart(),
  ]);

  function normalizeFormulaRows(
    rows: Array<SpellDamageFormulaPart>,
  ): Array<SpellDamageFormulaPart> {
    return rows
      .map((row) => ({ ...row, formula: row.formula.trim() }))
      .filter((row) => row.formula);
  }

  watch(
    model,
    (damageFormulaParts) => {
      const normalizedRows = normalizeFormulaRows(formulaRows.value);

      // Цикл синхронизации завершается здесь: пустые локальные строки нужны только UI,
      // а модель хранит только непустые формулы.
      if (isEqual(normalizedRows, damageFormulaParts)) {
        return;
      }

      formulaRows.value = damageFormulaParts.length
        ? damageFormulaParts.map((part) => ({ ...part }))
        : [createEmptySpellDamageFormulaPart()];
    },
    { immediate: true },
  );

  function saveFormulaRows(rows: Array<SpellDamageFormulaPart>): void {
    formulaRows.value = rows.length
      ? rows
      : [createEmptySpellDamageFormulaPart()];

    model.value = normalizeFormulaRows(rows);
  }

  function updateFormulaRow(
    rowIndex: number,
    part: SpellDamageFormulaPart,
  ): void {
    const rows = [...formulaRows.value];

    rows[rowIndex] = part;
    saveFormulaRows(rows);
  }

  function addFormula(rowIndex: number): void {
    const rows = [...formulaRows.value];

    rows.splice(rowIndex + 1, 0, createEmptySpellDamageFormulaPart());
    saveFormulaRows(rows);
  }

  function clearFormula(rowIndex: number): void {
    const rows = [...formulaRows.value];

    rows[rowIndex] = createEmptySpellDamageFormulaPart();
    saveFormulaRows(rows);
  }

  function removeFormula(rowIndex: number): void {
    const rows = [...formulaRows.value];

    rows.splice(rowIndex, 1);
    saveFormulaRows(rows);
  }

  function isLastFormula(rowIndex: number): boolean {
    return rowIndex === formulaRows.value.length - 1;
  }
</script>

<template>
  <div class="col-span-full grid gap-3">
    <SpellDamageFormulaRow
      v-for="(row, rowIndex) in formulaRows"
      :key="rowIndex"
      :model-value="row"
      :index="rowIndex"
      :damage-type-options="damageTypeOptions"
      :damage-types-pending="damageTypesPending"
      :is-last="isLastFormula(rowIndex)"
      @update:model-value="updateFormulaRow(rowIndex, $event)"
      @add="addFormula(rowIndex)"
      @clear="clearFormula(rowIndex)"
      @remove="removeFormula(rowIndex)"
    />
  </div>
</template>
