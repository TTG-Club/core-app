<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type {
    FeatCounterMaxKind,
    FeatEditorLabelOverrides,
  } from '../../model';

  import { SelectAbilities } from '~ui/select';

  import {
    COUNTER_COUNT_MAX,
    COUNTER_COUNT_MIN,
    COUNTER_MAX_DEFAULT_ABILITY,
    COUNTER_MAX_MULTIPLIER_MAX,
    COUNTER_MAX_MULTIPLIER_MIN,
    COUNTER_MAX_NO_OFFSET,
    COUNTER_MAX_OFFSET_MAX,
    COUNTER_MAX_OFFSET_MIN,
    COUNTER_MINIMUM_MAX,
    COUNTER_MINIMUM_MIN,
    FEAT_COUNTER_MAX_KIND_OPTIONS,
    getCounterMaxKind,
    getFeatEditorLabels,
    parseCounterMaxFormula,
    switchCounterMaxKind,
    updateCounterMaxRule,
  } from '../../model';

  /**
   * Откуда берётся максимум ресурса.
   *
   * Хранится ОДНОЙ формулой — ту же грамматику понимают лист, система D&D
   * виртуального стола и эффекты. Поле лишь раскладывает её на понятный выбор:
   * бонус мастерства, модификатор характеристики, уровень, своё число. Формулу,
   * написанную руками и не разобравшуюся, поле показывает как есть: подставив
   * вместо неё число, оно потеряло бы написанное.
   */
  const { labels = {} } = defineProps<{
    /** Подписи формы-владельца: те же, что у строки ресурса. */
    labels?: FeatEditorLabelOverrides;
  }>();

  const model = defineModel<string>({ required: true });

  /**
   * Нижняя граница максимума; 0 — границы нет. Отдельным полем, а не частью
   * формулы: она подпирает расчёт снизу, а не участвует в нём.
   */
  const minimum = defineModel<number>('minimum', { required: true });

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

  /** «Свою формулу» выбрали в списке, а поле ещё пустое. */
  const isCustomFormulaPicked = ref(false);

  /** Разобранное правило; нет — формула написана руками. */
  const rule = computed(() => parseCounterMaxFormula(model.value));

  const kind = computed(() =>
    getCounterMaxKind(model.value, isCustomFormulaPicked.value),
  );

  const isFixed = computed(() => kind.value === 'fixed');

  const isFormula = computed(() => kind.value === 'formula');

  const isAbility = computed(() => kind.value === 'ability');

  /** Своё число: у «своего числа» оно целиком лежит в прибавке. */
  const fixedAmount = computed(() =>
    isFixed.value ? rule.value?.offset : COUNTER_COUNT_MIN,
  );

  const multiplier = computed(
    () => rule.value?.multiplier ?? COUNTER_MAX_MULTIPLIER_MIN,
  );

  const offset = computed(() => rule.value?.offset ?? COUNTER_MAX_NO_OFFSET);

  const ability = computed(
    () => rule.value?.ability ?? COUNTER_MAX_DEFAULT_ABILITY,
  );

  /**
   * Смена вида максимума переписывает формулу целиком.
   *
   * @param nextKind выбранный вид.
   */
  function handleKindChange(nextKind: FeatCounterMaxKind) {
    isCustomFormulaPicked.value = nextKind === 'formula';
    model.value = switchCounterMaxKind(model.value, nextKind);
  }

  /**
   * Своё число максимума.
   *
   * @param amount количество зарядов; очищенное поле — ноль.
   */
  function handleFixedAmountChange(amount: number | undefined) {
    model.value = String(amount ?? COUNTER_COUNT_MIN);
  }

  /**
   * Множитель значения источника.
   *
   * @param pickedMultiplier множитель; очищенное поле — единица.
   */
  function handleMultiplierChange(pickedMultiplier: number | undefined) {
    model.value = updateCounterMaxRule(model.value, {
      multiplier: pickedMultiplier ?? COUNTER_MAX_MULTIPLIER_MIN,
    });
  }

  /**
   * Прибавка к значению источника.
   *
   * @param pickedOffset прибавка; очищенное поле — без прибавки.
   */
  function handleOffsetChange(pickedOffset: number | undefined) {
    model.value = updateCounterMaxRule(model.value, {
      offset: pickedOffset ?? COUNTER_MAX_NO_OFFSET,
    });
  }

  /**
   * Характеристика, чей модификатор идёт в максимум.
   *
   * @param pickedAbility выбранная характеристика; очистка селекта формулу не
   *   меняет.
   */
  function handleAbilityChange(
    pickedAbility: AbilityKey | Array<AbilityKey> | undefined,
  ) {
    if (!pickedAbility || Array.isArray(pickedAbility)) {
      return;
    }

    model.value = updateCounterMaxRule(model.value, { ability: pickedAbility });
  }
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <UFormField
      class="w-full sm:w-60"
      :label="texts.counterMax"
    >
      <USelect
        :model-value="kind"
        :items="FEAT_COUNTER_MAX_KIND_OPTIONS"
        value-key="value"
        class="w-full"
        @update:model-value="handleKindChange"
      />
    </UFormField>

    <UFormField
      v-if="isFixed"
      class="w-28"
      :label="texts.counterMaxAmount"
    >
      <UInputNumber
        :model-value="fixedAmount"
        :min="COUNTER_COUNT_MIN"
        :max="COUNTER_COUNT_MAX"
        class="w-full"
        @update:model-value="handleFixedAmountChange"
      />
    </UFormField>

    <UFormField
      v-else-if="isFormula"
      class="w-40"
      :label="texts.counterMaxFormula"
    >
      <UInput
        v-model="model"
        :placeholder="texts.counterMaxFormulaPlaceholder"
      />
    </UFormField>

    <template v-else>
      <UFormField
        v-if="isAbility"
        class="w-44"
        :label="texts.counterMaxAbility"
      >
        <SelectAbilities
          :model-value="ability"
          @update:model-value="handleAbilityChange"
        />
      </UFormField>

      <UFormField
        class="w-28"
        :label="texts.counterMaxMultiplier"
      >
        <UInputNumber
          :model-value="multiplier"
          :min="COUNTER_MAX_MULTIPLIER_MIN"
          :max="COUNTER_MAX_MULTIPLIER_MAX"
          class="w-full"
          @update:model-value="handleMultiplierChange"
        />
      </UFormField>

      <UFormField
        class="w-28"
        :label="texts.counterMaxOffset"
      >
        <UInputNumber
          :model-value="offset"
          :min="COUNTER_MAX_OFFSET_MIN"
          :max="COUNTER_MAX_OFFSET_MAX"
          class="w-full"
          @update:model-value="handleOffsetChange"
        />
      </UFormField>
    </template>

    <!-- Нижняя граница нужна только считаемому максимуму: вдохновение барда
      равно модификатору Харизмы, но с Харизмой +0 оно всё равно одно -->
    <UFormField
      v-if="!isFixed"
      class="w-28"
      :label="texts.counterMin"
    >
      <UInputNumber
        v-model="minimum"
        :min="COUNTER_MINIMUM_MIN"
        :max="COUNTER_MINIMUM_MAX"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
