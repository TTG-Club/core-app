<script setup lang="ts">
  import type {
    AbilityKey,
    FeatSelectOption,
    SheetChoicePoolStatus,
  } from '../../model';

  import {
    ABILITY_IMPROVEMENT_LABELS,
    ABILITY_ORDER,
    toAbilityPickerOptions,
    toFeatPickerOptions,
  } from '../../model';
  import SheetChoicePickerField from './SheetChoicePickerField.vue';

  /**
   * Выбор черты в мастерах листа: поле единого пикера с пулом черт и — у черты
   * с прибавками — по полю на каждый слот характеристики. Один на мастер
   * класса, мастер повышения уровня, мастера вида и предыстории.
   */
  const {
    title = ABILITY_IMPROVEMENT_LABELS.featTitle,
    explanation = ABILITY_IMPROVEMENT_LABELS.featExplanation,
    modalSubtitle = '',
    options,
    selected = null,
    abilities,
    scores,
    isLoading = false,
    hasError = false,
  } = defineProps<{
    /** Подпись выбора из записи умения; пусто — общая «Выберите черту». */
    title?: string;

    /** Почему этот выбор здесь; пусто — общее пояснение. */
    explanation?: string;

    /** Подзаголовок окна выбора: откуда выбор. */
    modalSubtitle?: string;

    /** Черты, доступные для выбора (уже отфильтрованы мастером). */
    options: FeatSelectOption[];

    /** Выбранная черта; null — выбора ещё не было. */
    selected?: FeatSelectOption | null;

    /** Выбранные характеристики по слотам прибавок (null — слот пуст). */
    abilities: (AbilityKey | null)[];

    /** Текущие значения характеристик персонажа (для подсказки о пределе). */
    scores: Record<AbilityKey, number>;

    isLoading?: boolean;

    /** Каталог черт загрузить не удалось — выбор недоступен. */
    hasError?: boolean;
  }>();

  const emit = defineEmits<{
    'update:feat': [featUrl: string];
    'update:ability': [payload: { slot: number; ability: AbilityKey | null }];
  }>();

  const featOptions = computed(() => toFeatPickerOptions(options));

  const featValues = computed(() => (selected ? [selected.url] : []));

  const status = computed<SheetChoicePoolStatus>(() => {
    if (hasError) {
      return 'error';
    }

    return isLoading ? 'loading' : 'ready';
  });

  /**
   * Слоты прибавок выбранной черты: у каждого свой список характеристик,
   * ограниченный чертой, и своя подпись с номером, если слотов несколько.
   */
  const abilitySlots = computed(() =>
    abilities.map((value, slot) => ({
      slot,
      values: value ? [value] : [],
      options: toAbilityPickerOptions(scores, selected?.abilities ?? []),
      title:
        abilities.length > 1
          ? `${ABILITY_IMPROVEMENT_LABELS.abilitySlotTitle} · ${slot + 1}`
          : ABILITY_IMPROVEMENT_LABELS.abilitySlotTitle,
    })),
  );

  /**
   * Передаёт наверх выбранную черту; пустой выбор — снятие.
   *
   * @param values значения пикера (url черты одним элементом).
   */
  function handleFeat(values: string[]) {
    emit('update:feat', values[0] ?? '');
  }

  /**
   * Передаёт наверх характеристику слота прибавки.
   *
   * @param slot номер слота (с нуля).
   * @param values значения пикера (ключ характеристики одним элементом).
   */
  function handleAbility(slot: number, values: string[]) {
    const ability = ABILITY_ORDER.find((key) => key === values[0]) ?? null;

    emit('update:ability', { slot, ability });
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <SheetChoicePickerField
      :title
      :explanation
      :modal-subtitle="modalSubtitle"
      :options="featOptions"
      :count="1"
      :status
      :model-value="featValues"
      @update:model-value="handleFeat"
    />

    <SheetChoicePickerField
      v-for="entry in abilitySlots"
      :key="entry.slot"
      :title="entry.title"
      :explanation="ABILITY_IMPROVEMENT_LABELS.abilitySlotExplanation"
      :modal-subtitle="modalSubtitle"
      :options="entry.options"
      :count="1"
      :model-value="entry.values"
      @update:model-value="handleAbility(entry.slot, $event)"
    />
  </div>
</template>
