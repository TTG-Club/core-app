<script setup lang="ts">
  import type { SpellRange } from '~spells/model';

  import { isString } from 'es-toolkit';

  import { DictionaryService } from '~/shared/api';
  import { SPELL_USAGE_LABELS } from '~spells/model';
  import { EditorArrayControls } from '~ui/editor';

  const ranges = defineModel<Array<SpellRange>>({
    default: () => [],
  });

  const { data: units, status } = await useAsyncData(
    'dictionaries-range-types',
    () => DictionaryService.rangeTypes(),
  );

  function getUnitOption(unitValue: string | undefined) {
    if (!units.value?.length) {
      return undefined;
    }

    if (!unitValue) {
      return undefined;
    }

    return units.value.find((option) => option.value === unitValue);
  }

  function isValueDisabled(unit: string | undefined) {
    const unitSelected = getUnitOption(unit);

    if (!unitSelected) {
      return false;
    }

    return !unitSelected.measurable;
  }

  function updateUnit(value: string | undefined, index: number) {
    if (!isString(value) && value !== undefined) {
      return;
    }

    const unitOption = getUnitOption(value);
    const range = ranges.value[index];

    if (!range) {
      return;
    }

    ranges.value[index]!.unit = value;

    if (unitOption?.measurable) {
      return;
    }

    ranges.value[index]!.value = undefined;
  }

  function getEmpty(): SpellRange {
    return {
      value: undefined,
      unit: undefined,
      custom: undefined,
    };
  }

  watch(
    ranges,
    (value) => {
      // Цикл синхронизации завершается здесь: если массив пуст, добавляется один пустой элемент,
      // после чего длина становится больше нуля и повторные триггеры watcher игнорируются.
      if (!value.length) {
        ranges.value.push(getEmpty());
      }
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <UForm
    v-for="(range, index) in ranges"
    :key="index"
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="range"
  >
    <UFormField
      :label="SPELL_USAGE_LABELS.rangeValue"
      name="value"
      class="col-span-full md:col-span-6 xl:col-span-4"
    >
      <UInputNumber
        v-model="range.value"
        :disabled="isValueDisabled(range.unit)"
        :precision="0"
        :min="0"
        :placeholder="SPELL_USAGE_LABELS.amountPlaceholder"
      />
    </UFormField>

    <UFormField
      :label="SPELL_USAGE_LABELS.rangeUnit"
      name="unit"
      class="col-span-full md:col-span-6 xl:col-span-4"
    >
      <USelect
        :model-value="range.unit"
        :loading="status === 'pending'"
        :items="units || []"
        :placeholder="SPELL_USAGE_LABELS.unitPlaceholder"
        @update:model-value="updateUnit($event, index)"
      />
    </UFormField>

    <UFormField
      class="col-span-full xl:col-span-10"
      :label="SPELL_USAGE_LABELS.custom"
      name="custom"
    >
      <UInput
        v-model="range.custom"
        :placeholder="SPELL_USAGE_LABELS.amountPlaceholder"
      />
    </UFormField>

    <EditorArrayControls
      v-model="ranges"
      :item="range"
      :empty-object="getEmpty()"
      :index
      cols="col-span-full xl:col-span-6"
    />
  </UForm>
</template>
