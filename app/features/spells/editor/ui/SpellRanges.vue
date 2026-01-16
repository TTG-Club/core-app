<script setup lang="ts">
  import { isString } from 'lodash-es';
  import { EditorArrayControls } from '~ui/editor';

  import { DictionaryService } from '~/shared/api';

  import type { SpellRange } from '~/shared/types';

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

    return units.value.find((el) => el.value === unitValue);
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
    const time = ranges.value[index];

    if (!time) {
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
  <div class="col-span-full mt-4 flex gap-4">
    <p class="text-lg">Дистанция</p>

    <USeparator />
  </div>

  <UForm
    v-for="(range, index) in ranges"
    :key="index"
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="range"
  >
    <UFormField
      label="Дистанция"
      name="value"
      class="col-span-4"
    >
      <UInputNumber
        v-model="range.value"
        :disabled="isValueDisabled(range.unit)"
        :precision="0"
        :min="0"
        placeholder="Введи значение"
      />
    </UFormField>

    <UFormField
      label="Тип дистанции"
      name="unit"
      class="col-span-4"
    >
      <USelect
        :model-value="range.unit"
        :loading="status === 'pending'"
        :items="units || []"
        placeholder="Выбери из списка"
        @update:model-value="updateUnit($event, index)"
      />
    </UFormField>

    <UFormField
      class="col-span-10"
      label="Собственное значение"
      name="custom"
    >
      <UInput
        v-model="range.custom"
        placeholder="Введи значение"
      />
    </UFormField>

    <EditorArrayControls
      v-model="ranges"
      :item="range"
      :empty-object="getEmpty()"
      :index
    />
  </UForm>
</template>
