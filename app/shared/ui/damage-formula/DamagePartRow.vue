<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';

  import type { DamageFormulaPart } from './part';

  import {
    DAMAGE_FORMULA_TARGET_OPTIONS,
    DAMAGE_PART_LABELS,
    DAMAGE_TYPE_TAGS,
  } from './constants';
  import DamageFormulaInput from './DamageFormulaInput.vue';
  import { isHealingDamageFormula } from './formula';
  import { isDamageFormulaTarget } from './part';

  const {
    index,
    damageTypeOptions,
    damageTypesPending = false,
    fieldNamePrefix = 'damageParts',
    showVersatile = false,
    hideModifiers = false,
  } = defineProps<{
    /** Порядковый номер части — идёт в подпись и в имя поля формы. */
    index: number;
    /** Типы урона справочника: подписи для вкладки «Тип урона». */
    damageTypeOptions: Array<SelectOption>;
    /** Справочник ещё грузится. */
    damageTypesPending?: boolean;
    /** Приставка имени поля формы, например `effect.damageFormulaTargets`. */
    fieldNamePrefix?: string;
    /** Показать формулу двуручного хвата (свойство «Универсальное» у оружия). */
    showVersatile?: boolean;
    /** Скрыть вкладку модификаторов там, где модификатор добавляется сам. */
    hideModifiers?: boolean;
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  /** Часть урона: формула, цель и признак «только если нанесён урон». */
  const model = defineModel<DamageFormulaPart>({ required: true });

  /**
   * Справочник отдаёт типы урона ключами сайта (`FIRE`), а формуле нужен токен
   * VTTG (`dmg.fire`) — перевод живёт здесь, у знающей оба словаря стороны.
   */
  const damageTypeTags = computed(() =>
    damageTypeOptions.map((damageType) => ({
      label: damageType.label,
      value: DAMAGE_TYPE_TAGS[damageType.value] ?? damageType.value,
    })),
  );

  const formula = computed({
    get: () => model.value.formula,
    set: (value) => {
      model.value = { ...model.value, formula: value };
    },
  });

  const versatileFormula = computed({
    get: () => model.value.versatileFormula ?? '',
    set: (value) => {
      model.value = { ...model.value, versatileFormula: value };
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
    if (!isDamageFormulaTarget(value)) {
      return;
    }

    model.value = { ...model.value, target: value };
  }
</script>

<template>
  <!-- Заголовок и кнопка удаления живут ВНУТРИ рамки части, как секция формы
    в системе: снаружи остаётся только «Добавить часть» -->
  <div class="rounded-lg border border-default bg-elevated/20 px-3 pt-2 pb-3">
    <div class="mb-2 flex h-6 items-center justify-between gap-2">
      <span
        class="truncate text-xs font-semibold tracking-wide text-highlighted"
      >
        {{ DAMAGE_PART_LABELS.partPrefix }}{{ index + 1 }}
      </span>

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="xs"
        :aria-label="DAMAGE_PART_LABELS.remove"
        @click.left.exact.prevent="emit('remove')"
      />
    </div>

    <div class="flex flex-col gap-3">
      <DamageFormulaInput
        v-model="formula"
        :damage-type-options="damageTypeTags"
        :damage-types-pending="damageTypesPending"
        :hide-modifiers="hideModifiers"
      />

      <DamageFormulaInput
        v-if="showVersatile"
        v-model="versatileFormula"
        :damage-type-options="damageTypeTags"
        :damage-types-pending="damageTypesPending"
        :hide-modifiers="hideModifiers"
        :label="DAMAGE_PART_LABELS.versatile"
      />

      <p
        v-if="showVersatile"
        class="text-xs text-dimmed"
      >
        {{ DAMAGE_PART_LABELS.versatileHint }}
      </p>

      <div class="grid grid-cols-24 items-end gap-3">
        <UFormField
          class="col-span-full md:col-span-12"
          :label="DAMAGE_PART_LABELS.target"
          :name="`${fieldNamePrefix}.${index}`"
        >
          <USelect
            :model-value="model.target"
            :items="DAMAGE_FORMULA_TARGET_OPTIONS"
            class="w-full"
            @update:model-value="handleTargetInput"
          />
        </UFormField>

        <!-- Гейт по факту урона осмыслен только у лечащей части -->
        <UFormField
          v-if="isHealing"
          class="col-span-full flex items-center md:col-span-12"
          :name="`${fieldNamePrefix}.${index}.requiresDamage`"
        >
          <UCheckbox
            v-model="requiresDamage"
            :label="DAMAGE_PART_LABELS.onlyIfDamaged"
            :description="DAMAGE_PART_LABELS.onlyIfDamagedHint"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>
