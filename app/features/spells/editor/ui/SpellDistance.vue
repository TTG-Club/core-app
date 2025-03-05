<script setup lang="ts">
  import { SelectDistanceType } from '~/shared/ui';
  import type { SpellCastingTime, SpellRange } from '~/shared/types';
  import { isEqual } from 'lodash-es';

  const ranges = defineModel<Array<SpellRange>>({
    default: () => [],
  });

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
    <ACol :span="6">
      <AFormItem
        label="Дистанция"
        :name="['range', index, 'value']"
      >
        <AInputNumber
          v-model:value="range.value"
          :disabled="!!range.custom"
          :precision="0"
          :min="0"
          placeholder="Введи значение"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Единицы дистанции"
        :name="['range', index, 'unit']"
      >
        <SelectDistanceType
          v-model="range.unit"
          :disabled="!!range.custom"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Собственное значение"
        :name="['range', index, 'custom']"
      >
        <AInput
          v-model:value="range.custom"
          :disabled="!!range.value || !!range.unit"
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
