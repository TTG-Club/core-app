<script setup lang="ts">
  import { isEqual, isString } from 'lodash-es';

  import { Dictionaries } from '~/shared/api';

  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { SpellDuration } from '~/shared/types';

  const durations = defineModel<Array<SpellDuration>>({
    default: () => [],
  });

  const { data: units, status } = await useAsyncData(
    'dictionaries-duration-units',
    () => Dictionaries.durationUnits(),
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

  function add(index: number) {
    durations.value.splice(index + 1, 0, getEmpty());
  }

  function clear(index: number) {
    durations.value.splice(index, 1, getEmpty());
  }

  function remove(index: number) {
    durations.value.splice(index, 1);
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
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Длительность"
      strong
    />
  </ADivider>

  <ARow
    v-for="(duration, index) in durations"
    :key="`${index}-${Date.now()}`"
    :gutter="16"
  >
    <ACol :span="4">
      <AFormItem
        label="Длительность"
        :name="['duration', index, 'value']"
      >
        <AInputNumber
          v-model:value="duration.value"
          :disabled="isValueDisabled(duration.unit)"
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
        :name="['duration', index, 'unit']"
      >
        <ASelect
          :value="duration.unit"
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

    <ACol :span="4">
      <AFormItem
        label="Концентрация"
        :name="['duration', index, 'concentration']"
      >
        <ACheckbox v-model:checked="duration.concentration">
          Требуется
        </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Собственное значение"
        :name="['duration', index, 'custom']"
      >
        <AInput
          v-model:value="duration.custom"
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
            v-if="index === durations.length - 1"
            :disabled="isEqual(duration, getEmpty())"
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
