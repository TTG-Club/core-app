<script setup lang="ts">
  import { isEqual } from 'lodash-es';
  import { SelectComparison } from '~/shared/ui';
  import type { SpellMaterialComponent } from '~/shared/types';

  const components = defineModel<Array<SpellMaterialComponent>>({
    default: () => [],
  });

  function add(index: number) {
    components.value.splice(index + 1, 0, getEmpty());
  }

  function clear(index: number) {
    components.value.splice(index, 1, getEmpty());
  }

  function remove(index: number) {
    components.value.splice(index, 1);
  }

  function getEmpty(): SpellMaterialComponent {
    return {
      name: '',
      price: undefined,
      comparison: undefined,
      consumable: false,
    };
  }

  watch(
    components,
    (value) => {
      if (!value.length) {
        components.value.push(getEmpty());
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
      content="Материальные компоненты"
      strong
    />
  </ADivider>

  <ARow
    v-for="(component, index) in components"
    :key="`${index}-${Date.now()}`"
    :gutter="16"
  >
    <ACol :span="8">
      <AFormItem
        label="Название"
        :name="['components', 'm', index, 'name']"
      >
        <AInput
          v-model:value="component.name"
          placeholder="Введи название"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Цена"
        :name="['components', 'm', index, 'price']"
      >
        <AInputNumber
          v-model:value="component.price"
          placeholder="Введи цену"
          allow-clear
          @change="
            typeof $event === 'number' || (component.comparison = undefined)
          "
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Тип цены"
        :name="['components', 'm', index, 'comparison']"
      >
        <SelectComparison
          v-model="component.comparison"
          :disabled="!component.price"
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Расходуемый компонент"
        :name="['components', 'm', index, 'consumable']"
      >
        <ACheckbox
          v-model:checked="component.consumable"
          allow-clear
        >
          Расходуемый
        </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem label="Управление">
        <AFlex :gap="8">
          <AButton @click.left.exact.prevent="add(index)"> Добавить </AButton>

          <AButton
            v-if="index === components.length - 1"
            :disabled="isEqual(component, getEmpty())"
            danger
            @click.left.exact.prevent="clear(index)"
          >
            Очистить
          </AButton>

          <AButton
            v-else
            danger
            @click.left.exact.prevent="remove(index)"
          >
            Удалить
          </AButton>
        </AFlex>
      </AFormItem>
    </ACol>
  </ARow>
</template>
