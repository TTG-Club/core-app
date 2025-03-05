<script setup lang="ts">
  import { isEqual } from 'lodash-es';
  import { SelectTimeUnit } from '~/shared/ui';
  import type { SpellCastingTime } from '~/shared/types';

  const times = defineModel<Array<SpellCastingTime>>({
    default: () => [],
  });

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
    :key="`${index}-${Date.now()}`"
    :gutter="16"
  >
    <ACol :span="6">
      <AFormItem
        label="Время накладывания"
        :name="['castingTime', index, 'value']"
      >
        <AInputNumber
          v-model:value="time.value"
          :disabled="!!time.custom"
          :precision="0"
          :min="0"
          placeholder="Введи значение"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Единица времени"
        :name="['castingTime', index, 'unit']"
      >
        <SelectTimeUnit
          v-model="time.unit"
          :disabled="!!time.custom"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Собственное значение"
        :name="['castingTime', index, 'custom']"
      >
        <AInput
          v-model:value="time.custom"
          :disabled="!!time.value || !!time.unit"
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
