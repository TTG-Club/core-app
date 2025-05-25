<script setup lang="ts">
  import { isEqual, isString } from 'lodash-es';

  import { ValidationBase, ValidationDictionaries } from '~/shared/utils';
  import { SelectSize } from '~ui/select';

  import type { SpeciesCreate } from '~/shared/types';

  type Sizes = SpeciesCreate['properties']['sizes'];

  const sizes = defineModel<Sizes>({
    default: () => [],
  });

  const disabledKeys = computed(() =>
    sizes.value.map((size) => size.type).filter((size) => isString(size)),
  );

  function add(index: number) {
    sizes.value.splice(index + 1, 0, getEmpty());
  }

  function clear(index: number) {
    sizes.value.splice(index, 1, getEmpty());
  }

  function remove(index: number) {
    sizes.value.splice(index, 1);
  }

  function getEmpty(): Sizes[number] {
    return {
      type: undefined,
      from: undefined,
      to: undefined,
    };
  }

  watch(
    sizes,
    (value) => {
      if (!value.length) {
        sizes.value.push(getEmpty());
      }
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <ARow
    v-for="(size, index) in sizes"
    :key="index"
    :gutter="16"
  >
    <ACol :span="6">
      <AFormItem
        :name="['properties', 'sizes', index, 'type']"
        :rules="[ValidationDictionaries.ruleSize()]"
        label="Размер"
      >
        <SelectSize
          v-model="size.type"
          :disabled-keys="disabledKeys"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Высота от"
        :name="['properties', 'sizes', index, 'from']"
        :rules="[ValidationBase.ruleNumber()]"
      >
        <AInputNumber
          v-model:value="size.from"
          :precision="0"
          :min="0"
          placeholder="Введи минимальную высоту"
          addon-after="футов"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Высота до"
        :name="['properties', 'sizes', index, 'to']"
        :rules="[ValidationBase.ruleNumber()]"
      >
        <AInputNumber
          v-model:value="size.to"
          :precision="0"
          :min="0"
          placeholder="Введи максимальную высоту"
          addon-after="футов"
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
            v-if="index === sizes.length - 1 && !isEqual(size, getEmpty())"
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
