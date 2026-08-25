<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';

  import type { SpellDamageFormulaPart } from '../../model';

  import {
    DamageFormulaInput,
    isHealingDamageFormula,
  } from '~ui/damage-formula';

  import {
    isSpellDamageFormulaTarget,
    SPELL_DAMAGE_FORMULA_TARGET_OPTIONS,
    SPELL_DAMAGE_PART_LABELS,
    SPELL_DAMAGE_TYPE_TAGS,
  } from '../../model';

  const {
    index,
    damageTypeOptions,
    damageTypesPending = false,
  } = defineProps<{
    /** Порядковый номер части — идёт в подпись и в имя поля формы. */
    index: number;
    /** Типы урона справочника: подписи для вкладки «Тип урона». */
    damageTypeOptions: Array<SelectOption>;
    /** Справочник ещё грузится. */
    damageTypesPending?: boolean;
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  /** Часть урона: формула, цель и признак «только если нанесён урон». */
  const model = defineModel<SpellDamageFormulaPart>({ required: true });

  /**
   * Справочник отдаёт типы урона ключами сайта (`FIRE`), а формуле нужен токен
   * VTTG (`dmg.fire`) — перевод живёт здесь, у знающей оба словаря стороны.
   */
  const damageTypeTags = computed(() =>
    damageTypeOptions.map((damageType) => ({
      label: damageType.label,
      value: SPELL_DAMAGE_TYPE_TAGS[damageType.value] ?? damageType.value,
    })),
  );

  const formula = computed({
    get: () => model.value.formula,
    set: (value) => {
      model.value = { ...model.value, formula: value };
    },
  });

  /** Признак лечения — только по тегу формулы, как в VTTG. */
  const isHealing = computed(() => isHealingDamageFormula(model.value.formula));

  const requiresDamage = computed({
    get: () => model.value.requiresDamage,
    set: (value) => {
      model.value = { ...model.value, requiresDamage: value };
    },
  });

  function handleTargetInput(value: unknown) {
    if (!isSpellDamageFormulaTarget(value)) {
      return;
    }

    model.value = { ...model.value, target: value };
  }
</script>

<template>
  <!-- Заголовок и кнопка удаления живут ВНУТРИ рамки части, как секция формы
    в системе: снаружи остаётся только «Добавить часть» -->
  <div class="rounded-lg border border-muted/60 bg-elevated/20 px-3 pt-2 pb-3">
    <div class="mb-2 flex h-6 items-center justify-between gap-2">
      <span
        class="truncate text-xs font-semibold tracking-wide text-highlighted"
      >
        {{ SPELL_DAMAGE_PART_LABELS.partPrefix }}{{ index + 1 }}
      </span>

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="xs"
        :aria-label="SPELL_DAMAGE_PART_LABELS.remove"
        @click.left.exact.prevent="emit('remove')"
      />
    </div>

    <div class="flex flex-col gap-3">
      <DamageFormulaInput
        v-model="formula"
        :damage-type-options="damageTypeTags"
        :damage-types-pending="damageTypesPending"
      />

      <div class="grid grid-cols-24 items-end gap-3">
        <UFormField
          class="col-span-full md:col-span-12"
          :label="SPELL_DAMAGE_PART_LABELS.target"
          :name="`effect.damageFormulaTargets.${index}`"
        >
          <USelect
            :model-value="model.target"
            :items="SPELL_DAMAGE_FORMULA_TARGET_OPTIONS"
            class="w-full"
            @update:model-value="handleTargetInput"
          />
        </UFormField>

        <!-- Гейт по факту урона осмыслен только у лечащей части -->
        <UFormField
          v-if="isHealing"
          class="col-span-full flex items-center md:col-span-12"
          :name="`effect.damageFormulaRequiresDamage.${index}`"
        >
          <UCheckbox
            v-model="requiresDamage"
            :label="SPELL_DAMAGE_PART_LABELS.onlyIfDamaged"
            :description="SPELL_DAMAGE_PART_LABELS.onlyIfDamagedHint"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>
