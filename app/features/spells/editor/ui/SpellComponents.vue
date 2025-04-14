<script setup lang="ts">
  import { ValidationBase } from '~/shared/utils';

  import type { SpellComponents, SpellMaterialComponent } from '~/shared/types';

  const components = defineModel<SpellComponents>({
    required: true,
  });

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
    <ACol :span="8">
      <AFormItem
        label="Вербальный компонент"
        :name="['components', 'v']"
      >
        <ACheckbox v-model:checked="components.v"> Требуется </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Соматический компонент"
        :name="['components', 's']"
      >
        <ACheckbox v-model:checked="components.s"> Требуется </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem label="Материальный компонент">
        <ACheckbox
          :checked="!!components.m"
          @update:checked="updateUseMaterialComponent"
        >
          Требуется
        </ACheckbox>
      </AFormItem>
    </ACol>
  </ARow>

  <ARow
    v-if="components.m"
    :gutter="16"
  >
    <ACol :span="16">
      <AFormItem
        label="Список материалов"
        :name="['components', 'm', 'text']"
        :rules="[ValidationBase.ruleString()]"
      >
        <ATextarea
          v-model:value="components.m.text"
          :auto-size="{ minRows: 1, maxRows: 8 }"
          placeholder="Введи список материалов"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
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

    <ACol :span="4">
      <AFormItem
        label="Материалы расходуются"
        :name="['components', 'm', 'consumable']"
      >
        <ACheckbox
          v-model:checked="components.m.consumable"
          :disabled="!components.m?.text"
        >
          Да
        </ACheckbox>
      </AFormItem>
    </ACol>
  </ARow>
</template>
