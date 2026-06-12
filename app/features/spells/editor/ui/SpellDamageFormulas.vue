<script setup lang="ts">
  import { isEqual } from 'es-toolkit';

  import { DictionaryService } from '~/shared/api';

  import {
    appendSpellDamageFormulaModifier,
    appendSpellDamageFormulaTag,
    DEFAULT_SPELL_DAMAGE_FORMULA_TARGET,
    DEFAULT_SPELL_DAMAGE_FORMULA_TOOL,
    incrementSpellDamageFormulaDice,
    SPELL_DAMAGE_FORMULA_CONDITION_TAGS,
    SPELL_DAMAGE_FORMULA_DICE,
    SPELL_DAMAGE_FORMULA_HEALING_TAGS,
    SPELL_DAMAGE_FORMULA_MODIFIER_TAGS,
    SPELL_DAMAGE_FORMULA_TARGET_OPTIONS,
    SPELL_DAMAGE_FORMULA_TOOLS,
    SPELL_DAMAGE_TYPE_TAGS,
  } from '../../model';

  const DAMAGE_TARGET_TAG_PATTERN = /@target\.(self|separate)\b/g;

  const model = defineModel<Array<string>>({ required: true });
  const formulaRows = ref<Array<string>>(['']);
  const activeToolByRow = ref<Record<number, string>>({});

  const { data: damageTypes, status } = await useAsyncData(
    'dictionaries-damage-types',
    () => DictionaryService.damageTypes(),
    { dedupe: 'defer' },
  );

  const damageTypeItems = computed(() => damageTypes.value ?? []);

  function normalizeFormulaRows(rows: Array<string>): Array<string> {
    return rows.map((row) => row.trim()).filter(Boolean);
  }

  watch(
    model,
    (damageFormulas) => {
      const normalizedRows = normalizeFormulaRows(formulaRows.value);

      // Цикл синхронизации завершается здесь: пустые локальные строки нужны только UI,
      // а модель хранит только непустые формулы.
      if (isEqual(normalizedRows, damageFormulas)) {
        return;
      }

      formulaRows.value = damageFormulas.length ? [...damageFormulas] : [''];
    },
    { immediate: true },
  );

  function getDamageTypeTag(damageType: string): string {
    return SPELL_DAMAGE_TYPE_TAGS[damageType] ?? damageType;
  }

  function getActiveTool(rowIndex: number): string {
    return activeToolByRow.value[rowIndex] ?? DEFAULT_SPELL_DAMAGE_FORMULA_TOOL;
  }

  function saveFormulaRows(rows: Array<string>): void {
    formulaRows.value = rows.length ? rows : [''];
    model.value = normalizeFormulaRows(rows);
  }

  function updateFormulaRow(
    rowIndex: number,
    updateFormula: (formula: string) => string,
  ): void {
    const rows = [...formulaRows.value];
    const formula = rows[rowIndex] ?? '';

    rows[rowIndex] = updateFormula(formula);
    saveFormulaRows(rows);
  }

  function updateFormula(rowIndex: number, formula: string): void {
    updateFormulaRow(rowIndex, () => formula);
  }

  function handleFormulaInput(rowIndex: number, modelValue: unknown): void {
    updateFormula(rowIndex, typeof modelValue === 'string' ? modelValue : '');
  }

  function getDamageTarget(formula: string): string {
    if (formula.includes('@target.self')) {
      return 'target.self';
    }

    if (formula.includes('@target.separate')) {
      return 'target.separate';
    }

    return DEFAULT_SPELL_DAMAGE_FORMULA_TARGET;
  }

  function updateDamageTarget(rowIndex: number, target: string): void {
    const rows = [...formulaRows.value];
    const formula = rows[rowIndex] ?? '';

    const formulaWithoutTarget = formula
      .replace(DAMAGE_TARGET_TAG_PATTERN, '')
      .trim();

    rows[rowIndex] =
      target === DEFAULT_SPELL_DAMAGE_FORMULA_TARGET
        ? formulaWithoutTarget
        : `${formulaWithoutTarget}@${target}`.trim();

    saveFormulaRows(rows);
  }

  function handleDamageTargetInput(
    rowIndex: number,
    modelValue: unknown,
  ): void {
    if (typeof modelValue !== 'string') {
      return;
    }

    updateDamageTarget(rowIndex, modelValue);
  }

  function appendDamageType(rowIndex: number, damageType: string): void {
    appendFormulaTag(rowIndex, getDamageTypeTag(damageType));
  }

  function incrementDice(rowIndex: number, diceValue: number): void {
    updateFormulaRow(rowIndex, (formula) =>
      incrementSpellDamageFormulaDice(formula, diceValue),
    );
  }

  function appendFormulaTag(rowIndex: number, tag: string): void {
    updateFormulaRow(rowIndex, (formula) =>
      appendSpellDamageFormulaTag(formula, tag),
    );
  }

  function appendFormulaModifier(rowIndex: number, modifier: string): void {
    updateFormulaRow(rowIndex, (formula) =>
      appendSpellDamageFormulaModifier(formula, modifier),
    );
  }

  function addFormula(rowIndex: number): void {
    const rows = [...formulaRows.value];

    rows.splice(rowIndex + 1, 0, '');
    saveFormulaRows(rows);
  }

  function clearFormula(rowIndex: number): void {
    const rows = [...formulaRows.value];

    rows[rowIndex] = '';
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

  function setActiveTool(rowIndex: number, tool: string): void {
    activeToolByRow.value = {
      ...activeToolByRow.value,
      [rowIndex]: tool,
    };
  }
</script>

<template>
  <div class="col-span-full grid gap-3">
    <UFormField
      v-for="(formula, rowIndex) in formulaRows"
      :key="rowIndex"
      :label="`Урон, часть ${rowIndex + 1}`"
      :name="`effect.damageFormulas.${rowIndex}`"
    >
      <div class="rounded-lg border border-default bg-muted p-3">
        <div class="flex flex-col gap-3">
          <UInput
            :model-value="formula"
            placeholder="Например: 8d6@dmg.fire"
            @update:model-value="handleFormulaInput(rowIndex, $event)"
          />

          <div class="flex flex-wrap gap-2 border-b border-default pb-2">
            <UButton
              v-for="tool in SPELL_DAMAGE_FORMULA_TOOLS"
              :key="tool.value"
              size="xs"
              :variant="
                getActiveTool(rowIndex) === tool.value ? 'solid' : 'ghost'
              "
              @click.left.exact.prevent="setActiveTool(rowIndex, tool.value)"
            >
              {{ tool.label }}
            </UButton>
          </div>

          <div class="flex flex-wrap gap-2">
            <template v-if="getActiveTool(rowIndex) === 'damage-type'">
              <UButton
                v-for="damageType in damageTypeItems"
                :key="damageType.value"
                size="xs"
                variant="subtle"
                :loading="status === 'pending'"
                @click.left.exact.prevent="
                  appendDamageType(rowIndex, damageType.value)
                "
              >
                {{ damageType.label }}
              </UButton>
            </template>

            <template v-else-if="getActiveTool(rowIndex) === 'dice'">
              <UButton
                v-for="dice in SPELL_DAMAGE_FORMULA_DICE"
                :key="dice.value"
                size="xs"
                variant="subtle"
                @click.left.exact.prevent="incrementDice(rowIndex, dice.value)"
              >
                {{ dice.label }}
              </UButton>
            </template>

            <template v-else-if="getActiveTool(rowIndex) === 'healing'">
              <UButton
                v-for="healingType in SPELL_DAMAGE_FORMULA_HEALING_TAGS"
                :key="healingType.value"
                size="xs"
                variant="subtle"
                @click.left.exact.prevent="
                  appendFormulaTag(rowIndex, healingType.value)
                "
              >
                {{ healingType.label }} (@{{ healingType.value }})
              </UButton>
            </template>

            <template v-else-if="getActiveTool(rowIndex) === 'condition'">
              <UButton
                v-for="condition in SPELL_DAMAGE_FORMULA_CONDITION_TAGS"
                :key="condition.value"
                size="xs"
                variant="subtle"
                @click.left.exact.prevent="
                  appendFormulaTag(rowIndex, condition.value)
                "
              >
                {{ condition.label }} (@{{ condition.value }})
              </UButton>
            </template>

            <template v-else>
              <UButton
                v-for="modifier in SPELL_DAMAGE_FORMULA_MODIFIER_TAGS"
                :key="modifier.value"
                size="xs"
                variant="subtle"
                @click.left.exact.prevent="
                  appendFormulaModifier(rowIndex, modifier.value)
                "
              >
                {{ modifier.label }} (@{{ modifier.value }})
              </UButton>
            </template>
          </div>

          <UFormField
            label="Цель"
            :name="`effect.damageFormulaTargets.${rowIndex}`"
          >
            <USelect
              :model-value="getDamageTarget(formula)"
              :items="SPELL_DAMAGE_FORMULA_TARGET_OPTIONS"
              @update:model-value="handleDamageTargetInput(rowIndex, $event)"
            />
          </UFormField>

          <div class="flex flex-wrap gap-2">
            <UButton
              icon="tabler:plus"
              size="xs"
              variant="subtle"
              @click.left.exact.prevent="addFormula(rowIndex)"
            >
              Добавить часть
            </UButton>

            <UButton
              v-if="isLastFormula(rowIndex)"
              icon="tabler:eraser"
              size="xs"
              variant="subtle"
              color="error"
              :disabled="!formula"
              @click.left.exact.prevent="clearFormula(rowIndex)"
            >
              Очистить
            </UButton>

            <UButton
              v-else
              icon="tabler:trash"
              size="xs"
              variant="subtle"
              color="error"
              @click.left.exact.prevent="removeFormula(rowIndex)"
            >
              Удалить
            </UButton>
          </div>
        </div>
      </div>
    </UFormField>
  </div>
</template>
