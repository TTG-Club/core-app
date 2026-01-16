<script setup lang="ts">
  import { isString } from 'lodash-es';
  import { EditorArrayControls } from '~ui/editor';

  import { DictionaryService } from '~/shared/api';

  import type { SpellDuration } from '~/shared/types';

  const durations = defineModel<Array<SpellDuration>>({
    default: () => [],
  });

  const { data: units, status } = await useAsyncData(
    'dictionaries-duration-units',
    () => DictionaryService.durationUnits(),
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
    const time = durations.value[index];

    if (!time) {
      return;
    }

    durations.value[index]!.unit = value;

    if (unitOption?.measurable) {
      return;
    }

    durations.value[index]!.value = undefined;
  }

  function getEmpty(): SpellDuration {
    return {
      value: undefined,
      unit: undefined,
      custom: undefined,
      concentration: false,
    };
  }

  watch(
    durations,
    (value) => {
      if (!value.length) {
        durations.value.push(getEmpty());
      }
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <div class="col-span-full mt-4 flex gap-4">
    <p class="text-lg">Длительность</p>

    <USeparator />
  </div>

  <UForm
    v-for="(duration, index) in durations"
    :key="index"
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="duration"
  >
    <UFormField
      label="Длительность"
      name="value"
      class="col-span-4"
    >
      <UInputNumber
        v-model="duration.value"
        :disabled="isValueDisabled(duration.unit)"
        :min="0"
        placeholder="Введи значение"
      />
    </UFormField>

    <UFormField
      label="Единица времени"
      name="unit"
      class="col-span-4"
    >
      <USelect
        :model-value="duration.unit"
        :loading="status === 'pending'"
        :items="units || []"
        placeholder="Выбери из списка"
        searchable
        clearable
        @update:model-value="updateUnit($event, index)"
      />
    </UFormField>

    <UFormField
      name="concentration"
      class="col-span-4 mb-2 flex items-end"
    >
      <UCheckbox
        v-model="duration.concentration"
        label="Концентрация"
      />
    </UFormField>

    <UFormField
      label="Собственное значение"
      name="custom"
      class="col-span-6"
    >
      <UInput
        v-model="duration.custom"
        placeholder="Введи значение"
        clearable
      />
    </UFormField>

    <EditorArrayControls
      v-model="durations"
      :item="duration"
      :empty-object="getEmpty()"
      :index
    />
  </UForm>
</template>
