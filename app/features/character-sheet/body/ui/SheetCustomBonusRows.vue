<script setup lang="ts">
  import type { Character, CharacterCustomBonus } from '../../model';

  import {
    CUSTOM_BONUS_FORMAT_OPTIONS,
    CUSTOM_BONUS_LABEL_MAX_LENGTH,
    CUSTOM_BONUS_MAX,
    CUSTOM_BONUS_MIN,
    CUSTOM_BONUS_SOURCE_OPTIONS,
    getCustomBonusSource,
    getCustomBonusValue,
    getFormattedBonus,
    NEW_CUSTOM_BONUS,
    SHEET_SETTINGS_LABELS,
    withCustomBonusSource,
  } from '../../model';

  // Персонаж нужен только для показа посчитанного вклада выбранного источника:
  // сами бонусы правятся через модель, лист от строк не меняется.
  const {
    character,
    withAdd = true,
    sourceItems = CUSTOM_BONUS_SOURCE_OPTIONS,
  } = defineProps<{
    character: Character;

    /**
     * Показывать кнопку «Добавить бонус» и подпись пустого списка. У навыков
     * бонус заводит плюс в шапке строки, и своя кнопка там только дублировала
     * бы его.
     */
    withAdd?: boolean;

    /**
     * Доступные источники бонуса. По умолчанию — все; раздел бонуса мастерства
     * сужает список, потому что сам себе слагаемым бонус мастерства не бывает.
     */
    sourceItems?: typeof CUSTOM_BONUS_SOURCE_OPTIONS;
  }>();

  const rows = defineModel<CharacterCustomBonus[]>({ required: true });

  /**
   * Вклад бонуса, который лист считает сам (модификатор характеристики или
   * бонус мастерства): место числа в строке занимает готовое значение —
   * вводить там нечего.
   *
   * @param bonus свой бонус строки.
   * @returns посчитанный вклад бонуса со знаком.
   */
  function getComputedValue(bonus: CharacterCustomBonus): string {
    return getFormattedBonus(getCustomBonusValue(character, bonus));
  }

  function handleAdd() {
    rows.value = [
      ...rows.value,
      { ...NEW_CUSTOM_BONUS, id: crypto.randomUUID() },
    ];
  }

  function handleRemove(rowId: string) {
    rows.value = rows.value.filter((row) => row.id !== rowId);
  }

  function handleSource(rowId: string, source: unknown) {
    const selectedOption = sourceItems.find(
      (option) => option.value === source,
    );

    if (!selectedOption) {
      return;
    }

    rows.value = rows.value.map((row) =>
      row.id === rowId ? withCustomBonusSource(row, selectedOption.value) : row,
    );
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="row in rows"
      :key="row.id"
      class="flex flex-wrap items-center gap-2"
    >
      <UInput
        v-model="row.label"
        :maxlength="CUSTOM_BONUS_LABEL_MAX_LENGTH"
        :placeholder="SHEET_SETTINGS_LABELS.customBonusLabelPlaceholder"
        class="min-w-0 grow basis-40"
      />

      <USelect
        :model-value="getCustomBonusSource(row)"
        :items="sourceItems"
        :placeholder="SHEET_SETTINGS_LABELS.customBonusSourcePlaceholder"
        class="min-w-0 grow basis-32"
        @update:model-value="handleSource(row.id, $event)"
      />

      <UInputNumber
        v-if="row.kind === 'flat'"
        v-model="row.value"
        :min="CUSTOM_BONUS_MIN"
        :max="CUSTOM_BONUS_MAX"
        :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
        class="w-28 shrink-0"
      />

      <!-- Модификатор характеристики и бонус мастерства лист считает сам,
        поэтому вместо поля ввода у строки стоит коробка того же размера:
        колонка значений не едет -->
      <span
        v-else
        class="w-28 shrink-0 rounded-md border border-default/50 bg-elevated/40 px-2 py-1.5 text-center text-sm font-semibold text-toned tabular-nums"
      >
        {{ getComputedValue(row) }}
      </span>

      <!-- Корзина красная, как и во всех остальных списках листа: заметки,
        валюты, ресурсы класса -->
      <UTooltip :text="SHEET_SETTINGS_LABELS.customBonusRemove">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          square
          class="shrink-0"
          :aria-label="SHEET_SETTINGS_LABELS.customBonusRemove"
          @click.left.exact.prevent="handleRemove(row.id)"
        />
      </UTooltip>
    </div>

    <!-- Кнопка во всю ширину с пунктиром: она же место будущей строки, поэтому
      пустому списку не нужна отдельная подпись «бонусов нет» -->
    <UButton
      v-if="withAdd"
      :label="SHEET_SETTINGS_LABELS.customBonusAdd"
      icon="tabler:plus"
      color="neutral"
      variant="ghost"
      size="sm"
      block
      class="border border-dashed border-default hover:border-primary hover:text-primary"
      @click.left.exact.prevent="handleAdd"
    />
  </div>
</template>
