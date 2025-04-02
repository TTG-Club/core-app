<script setup lang="ts">
  import { Dictionaries } from '~/shared/api';
  import type { SpellCastingTime, SpellRange } from '~/shared/types';
  import { isEqual, isString } from 'lodash-es';
  import type { SelectValue } from 'ant-design-vue/es/select';

  const ranges = defineModel<Array<SpellRange>>({
    default: () => [],
  });

  const { data: units, status } = await useAsyncData(
    'dictionaries-range-types',
    () => Dictionaries.rangeTypes(),
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

  function updateUnit(value: SelectValue, index: number) {
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

  function add(index: number) {
    ranges.value.splice(index + 1, 0, getEmpty());
  }

  function clear(index: number) {
    ranges.value.splice(index, 1, getEmpty());
  }

  function remove(index: number) {
    ranges.value.splice(index, 1);
  }

  function getEmpty(): SpellCastingTime {
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
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Дистанция"
      strong
    />
  </ADivider>

  <ARow
    v-for="(range, index) in ranges"
    :key="`${index}-${Date.now()}`"
    :gutter="16"
  >
    <ACol :span="4">
      <AFormItem
        label="Дистанция"
        :name="['range', index, 'value']"
      >
        <AInputNumber
          v-model:value="range.value"
          :disabled="isValueDisabled(range.unit)"
          :precision="0"
          :min="0"
          placeholder="Введи значение"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Тип дистанции"
        :name="['range', index, 'unit']"
      >
        <ASelect
          :value="range.unit"
          :loading="status === 'pending'"
          :options="units || []"
          placeholder="Выбери из списка"
          show-search
          show-arrow
          allow-clear
          @update:value="updateUnit($event, index)"
        />
      </AFormItem>
    </ACol>

    <ACol :span="10">
      <AFormItem
        label="Собственное значение"
        :name="['range', index, 'custom']"
      >
        <AInput
          v-model:value="range.custom"
          placeholder="Введи значение"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem label="Управление">
        <AFlex :gap="8">
          <AButton
            block
            @click.left.exact.prevent="add(index)"
          >
            Добавить
          </AButton>

          <AButton
            v-if="index === ranges.length - 1"
            :disabled="isEqual(range, getEmpty())"
            danger
            block
            @click.left.exact.prevent="clear(index)"
          >
            Очистить
          </AButton>

          <AButton
            v-else
            danger
            block
            @click.left.exact.prevent="remove(index)"
          >
            Удалить
          </AButton>
        </AFlex>
      </AFormItem>
    </ACol>
  </ARow>
</template>
