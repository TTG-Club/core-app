<script setup lang="ts">
  import { isEqual, isString } from 'lodash-es';

  import { Dictionaries } from '~/shared/api';

  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { SpellCastingTime } from '~/shared/types';

  const times = defineModel<Array<SpellCastingTime>>({
    default: () => [],
  });

  const { data: units, status } = await useAsyncData(
    'dictionaries-time-units',
    () => Dictionaries.timeUnits(),
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

  function add(index: number) {
    times.value.splice(index + 1, 0, getEmpty());
  }

  function clear(index: number) {
    times.value.splice(index, 1, getEmpty());
  }

  function remove(index: number) {
    times.value.splice(index, 1);
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
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Время накладывания"
      strong
    />
  </ADivider>

  <ARow
    v-for="(time, index) in times"
    :key="index"
    :gutter="16"
  >
    <ACol :span="4">
      <AFormItem
        label="Время накладывания"
        :name="['castingTime', index, 'value']"
      >
        <AInputNumber
          v-model:value="time.value"
          :disabled="isValueDisabled(time.unit)"
          :precision="0"
          :min="0"
          placeholder="Введи значение"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Единица времени"
        :name="['castingTime', index, 'unit']"
      >
        <ASelect
          :value="time.unit"
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
        :name="['castingTime', index, 'custom']"
      >
        <AInput
          v-model:value="time.custom"
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
            v-if="index === times.length - 1"
            :disabled="isEqual(time, getEmpty())"
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
