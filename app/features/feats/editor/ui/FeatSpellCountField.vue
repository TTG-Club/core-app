<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type { FeatSpellCountKind } from '../../model';

  import { SelectAbilities } from '~ui/select';

  import {
    FEAT_ABILITY_FORMULA_ABBREVIATIONS,
    FEAT_ABILITY_MODIFIER_PREFIX,
    FEAT_EDITOR_LABELS,
    FEAT_PROFICIENCY_BONUS_FORMULA,
    FEAT_SPELL_COUNT_KIND_OPTIONS,
    getFeatSpellCountAbility,
    getFeatSpellCountKind,
  } from '../../model';

  /**
   * Сколько заклинаний игрок берёт из списка.
   *
   * Хранится одной формулой: число, `@prof`, `@mod.<abbr>`. Грамматика та же,
   * что у максимума ресурса и у активных эффектов, — её уже понимает лист
   * персонажа, и второй диалект того же смысла разошёлся бы с первым. Форма
   * лишь раскладывает формулу на понятный выбор.
   */
  const model = defineModel<string>({ required: true });

  /** Чем задано количество: по записанной формуле. */
  const kind = computed<FeatSpellCountKind>(() =>
    getFeatSpellCountKind(model.value),
  );

  /** Число из формулы; у остальных видов его нет. */
  const fixedCount = computed<number | undefined>(() => {
    const parsed = Number.parseInt(model.value.trim(), 10);

    return Number.isNaN(parsed) ? undefined : parsed;
  });

  /** Характеристика, чей модификатор задаёт количество. */
  const ability = computed<AbilityKey | undefined>(() =>
    getFeatSpellCountAbility(model.value),
  );

  /**
   * Смена вида переписывает формулу целиком: остатки прежней («@prof» в поле
   * числа) означали бы не то, что видит автор.
   *
   * @param next новый вид количества.
   */
  function setKind(next: FeatSpellCountKind) {
    if (next === 'ALL') {
      model.value = '';

      return;
    }

    if (next === 'PROFICIENCY_BONUS') {
      model.value = FEAT_PROFICIENCY_BONUS_FORMULA;

      return;
    }

    if (next === 'ABILITY_MODIFIER') {
      model.value = `${FEAT_ABILITY_MODIFIER_PREFIX}${FEAT_ABILITY_FORMULA_ABBREVIATIONS.CHARISMA}`;

      return;
    }

    model.value = next === 'FIXED' ? '1' : '';
  }

  /**
   * Записывает число.
   *
   * @param value количество заклинаний.
   */
  function setFixedCount(value: number | undefined) {
    model.value = value === undefined ? '' : String(value);
  }

  /**
   * Записывает характеристику, чей модификатор задаёт количество.
   *
   * @param value выбранная характеристика.
   */
  function setAbility(value: AbilityKey | Array<AbilityKey> | undefined) {
    const picked = Array.isArray(value) ? value[0] : value;

    if (picked) {
      model.value = `${FEAT_ABILITY_MODIFIER_PREFIX}${FEAT_ABILITY_FORMULA_ABBREVIATIONS[picked]}`;
    }
  }
</script>

<template>
  <div class="flex flex-wrap items-end gap-2">
    <UFormField
      class="w-56"
      :label="FEAT_EDITOR_LABELS.spellListCount"
    >
      <USelect
        :model-value="kind"
        :items="FEAT_SPELL_COUNT_KIND_OPTIONS"
        value-key="value"
        @update:model-value="setKind"
      />
    </UFormField>

    <UFormField
      v-if="kind === 'FIXED'"
      class="w-28"
      :label="FEAT_EDITOR_LABELS.spellListCountValue"
    >
      <UInputNumber
        :model-value="fixedCount"
        :min="1"
        :max="20"
        @update:model-value="setFixedCount"
      />
    </UFormField>

    <UFormField
      v-else-if="kind === 'ABILITY_MODIFIER'"
      class="w-56"
      :label="FEAT_EDITOR_LABELS.spellListCountAbility"
    >
      <SelectAbilities
        :model-value="ability"
        @update:model-value="setAbility"
      />
    </UFormField>

    <UFormField
      v-else-if="kind === 'FORMULA'"
      class="w-56"
      :label="FEAT_EDITOR_LABELS.spellListCountFormula"
    >
      <UInput
        v-model="model"
        :placeholder="FEAT_EDITOR_LABELS.spellListCountFormulaPlaceholder"
      />
    </UFormField>
  </div>
</template>
