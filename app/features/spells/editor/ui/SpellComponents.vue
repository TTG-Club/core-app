<script setup lang="ts">
  import { ValidationBase } from '~/shared/utils';
  import type { SpellComponents, SpellMaterialComponent } from '~/shared/types';

  const components = defineModel<SpellComponents>({
    required: true,
  });

  const isConsumableChecked = computed(() => components.value.m?.consumable);

  const consumableLabelName = computed(() =>
    isConsumableChecked.value ? ['components', 'm', 'consumable'] : undefined,
  );

  const material = computed(() => {
    if (!components.value.m?.text) {
      return getEmptyMaterialComponent();
    }

    return components.value.m;
  });

  function updateConsumable(value: boolean) {
    if (components.value.m?.consumable === undefined) {
      return;
    }

    components.value.m.consumable = value;
  }

  function updateUseMaterialComponent(value: boolean) {
    if (!value) {
      components.value.m = undefined;

      return;
    }

    components.value.m = getEmptyMaterialComponent();
  }

  function getEmptyMaterialComponent(): SpellMaterialComponent {
    return {
      text: '',
      withCost: false,
      consumable: false,
    };
  }

  function handleBlurMaterialComponent() {
    if (components.value.m?.text) {
      return;
    }

    components.value.m = undefined;
  }
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      content="Компоненты"
      type="secondary"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="6">
      <AFormItem
        label="Вербальный компонент"
        :name="['components', 'v']"
      >
        <ACheckbox v-model:checked="components.v"> Требуется </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Соматический компонент"
        :name="['components', 's']"
      >
        <ACheckbox v-model:checked="components.s"> Требуется </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem label="Материальный компонент">
        <ACheckbox
          :checked="!!components.m"
          @update:checked="updateUseMaterialComponent"
        >
          Требуется
        </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Материалы расходуются"
        :name="consumableLabelName"
      >
        <ACheckbox
          :checked="material.consumable"
          :disabled="!components.m?.text"
          @update:checked="updateConsumable"
        >
          Да
        </ACheckbox>
      </AFormItem>
    </ACol>
  </ARow>

  <ARow
    v-if="components.m"
    :gutter="16"
  >
    <ACol :span="18">
      <AFormItem
        label="Список материалов"
        :name="['components', 'm', 'text']"
        :rules="[ValidationBase.ruleString()]"
      >
        <AInput
          v-model:value="components.m.text"
          placeholder="Введи список материалов"
          allow-clear
          @blur="handleBlurMaterialComponent"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Материалы имеют цену"
        :name="['components', 'm', 'withCost']"
      >
        <ACheckbox
          v-model:checked="components.m.withCost"
          :disabled="!components.m.text"
        >
          Да
        </ACheckbox>
      </AFormItem>
    </ACol>
  </ARow>
</template>
