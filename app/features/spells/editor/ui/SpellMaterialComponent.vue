<script setup lang="ts">
  import type { SpellMaterialComponent } from '~/shared/types';

  const component = defineModel<SpellMaterialComponent>({
    required: true,
  });

  watch(component, (value) => {
    if (value) {
      return;
    }

    component.value.withCost = false;
    component.value.consumable = false;
  });
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Материальный компонент"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="16">
      <AFormItem
        label="Список материалов"
        :name="['components', 'm', 'text']"
      >
        <AInput
          v-model:value="component.text"
          placeholder="Введи список материалов"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Имеет цену"
        :name="['components', 'm', 'withCost']"
      >
        <ACheckbox
          v-model:checked="component.withCost"
          :disabled="!component.text"
        >
          Да
        </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Расходуемые материалы"
        :name="['components', 'm', 'consumable']"
      >
        <ACheckbox
          v-model:checked="component.consumable"
          :disabled="!component.text"
        >
          Да
        </ACheckbox>
      </AFormItem>
    </ACol>
  </ARow>
</template>
