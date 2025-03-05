<script setup lang="ts">
  import { SelectTimeUnit } from '~/shared/ui';
  import type { SpellCastingTime, SpellDuration } from '~/shared/types';
  import { isEqual } from 'lodash-es';

  const durations = defineModel<Array<SpellDuration>>({
    default: () => [],
  });

  function add(index: number) {
    durations.value.splice(index + 1, 0, getEmpty());
  }

  function clear(index: number) {
    durations.value.splice(index, 1, getEmpty());
  }

  function remove(index: number) {
    durations.value.splice(index, 1);
  }

  function getEmpty(): SpellCastingTime {
    return {
      value: undefined,
      unit: undefined,
      custom: undefined,
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
    <ACol :span="6">
      <AFormItem
        label="Длительность"
        :name="['duration', index, 'value']"
      >
        <AInputNumber
          v-model:value="duration.value"
          :disabled="!!duration.custom"
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
        :name="['duration', index, 'unit']"
      >
        <SelectTimeUnit
          v-model="duration.unit"
          :disabled="!!duration.custom"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Собственное значение"
        :name="['duration', index, 'custom']"
      >
        <AInput
          v-model:value="duration.custom"
          :disabled="!!duration.value || !!duration.unit"
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
