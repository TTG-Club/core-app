<script setup lang="ts">
  import type { SpellDuration } from '~spells/model';

  import { isString } from 'es-toolkit';

  import { DictionaryService } from '~/shared/api';
  import { SPELL_USAGE_LABELS } from '~spells/model';
  import { EditorArrayControls } from '~ui/editor';

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
    const duration = durations.value[index];

    if (!duration) {
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
      // Цикл синхронизации завершается здесь: если массив пуст, добавляется один пустой элемент,
      // после чего длина становится больше нуля и повторные триггеры watcher игнорируются.
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
  <UForm
    v-for="(duration, index) in durations"
    :key="index"
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="duration"
  >
    <UFormField
      :label="SPELL_USAGE_LABELS.amount"
      name="value"
      class="col-span-full md:col-span-6 xl:col-span-4"
    >
      <UInputNumber
        v-model="duration.value"
        :disabled="isValueDisabled(duration.unit)"
        :min="0"
        :placeholder="SPELL_USAGE_LABELS.amountPlaceholder"
      />
    </UFormField>

    <UFormField
      :label="SPELL_USAGE_LABELS.timeUnit"
      name="unit"
      class="col-span-full md:col-span-6 xl:col-span-4"
    >
      <USelect
        :model-value="duration.unit"
        :loading="status === 'pending'"
        :items="units || []"
        :placeholder="SPELL_USAGE_LABELS.unitPlaceholder"
        searchable
        clearable
        @update:model-value="updateUnit($event, index)"
      />
    </UFormField>

    <UFormField
      name="concentration"
      class="col-span-full mb-2 flex items-end md:col-span-6 xl:col-span-4"
    >
      <UCheckbox
        v-model="duration.concentration"
        :label="SPELL_USAGE_LABELS.concentration"
      />
    </UFormField>

    <UFormField
      :label="SPELL_USAGE_LABELS.custom"
      name="custom"
      class="col-span-full md:col-span-12 xl:col-span-6"
    >
      <UInput
        v-model="duration.custom"
        :placeholder="SPELL_USAGE_LABELS.amountPlaceholder"
        clearable
      />
    </UFormField>

    <EditorArrayControls
      v-model="durations"
      :item="duration"
      :empty-object="getEmpty()"
      :index
      cols="col-span-full md:col-span-12 xl:col-span-6"
    />
  </UForm>
</template>
