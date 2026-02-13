<script setup lang="ts">
  import { isString } from 'es-toolkit';
  import { EditorArrayControls } from '~ui/editor';

  import { DictionaryService } from '~/shared/api';

  import type { SpellCastingTime } from '~spells/model';

  const times = defineModel<Array<SpellCastingTime>>({
    default: () => [],
  });

  const { data: units, status } = await useAsyncData(
    'dictionaries-time-units',
    () => DictionaryService.timeUnits(),
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
    const time = times.value[index];

    if (!time) {
      return;
    }

    times.value[index]!.unit = value;

    if (unitOption?.measurable) {
      return;
    }

    times.value[index]!.value = undefined;
  }

  function getEmpty(): SpellCastingTime {
    return {
      value: undefined,
      unit: undefined,
      custom: undefined,
    };
  }

  watch(
    times,
    (value) => {
      if (!value.length) {
        times.value.push(getEmpty());
      }
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <div class="col-span-full mt-4 flex gap-4">
    <p class="w-1/5 text-lg">Время накладывания</p>

    <USeparator />
  </div>

  <UForm
    v-for="(time, index) in times"
    :key="index"
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="time"
  >
    <UFormField
      class="col-span-4"
      label="Время накладывания"
      name="value"
    >
      <UInput
        v-model="time.value"
        type="number"
        :disabled="isValueDisabled(time.unit)"
        :min="0"
        placeholder="Введи значение"
        clearable
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Единица времени"
      name="unit"
    >
      <USelect
        v-model="time.unit"
        :loading="status === 'pending'"
        :items="units || []"
        placeholder="Выбери из списка"
        searchable
        clearable
        @update:model-value="updateUnit($event, index)"
      />
    </UFormField>

    <UFormField
      class="col-span-10"
      label="Собственное значение"
      name="custom"
    >
      <UInput
        v-model="time.custom"
        placeholder="Введи значение"
        clearable
      />
    </UFormField>

    <EditorArrayControls
      v-model="times"
      :item="time"
      :empty-object="getEmpty()"
      :index
    />
  </UForm>
</template>
