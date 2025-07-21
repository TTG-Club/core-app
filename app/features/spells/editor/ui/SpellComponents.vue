<script setup lang="ts">
  import type { SpellComponents, SpellMaterialComponent } from '~/shared/types';

  const components = defineModel<SpellComponents>({
    required: true,
  });

  function updateUseMaterialComponent(value: boolean | 'indeterminate') {
    if (value === 'indeterminate') {
      return;
    }

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
  <USeparator>
    <span class="font-bold text-secondary">Компоненты</span>
  </USeparator>

  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="components"
  >
    <div class="col-span-8">
      <UFormField
        label="Вербальный компонент"
        name="v"
      >
        <UCheckbox
          v-model="components.v"
          label="Требуется"
        />
      </UFormField>
    </div>

    <div class="col-span-8">
      <UFormField
        label="Соматический компонент"
        name="s"
      >
        <UCheckbox
          v-model="components.s"
          label="Требуется"
        />
      </UFormField>
    </div>

    <div class="col-span-8">
      <UFormField label="Материальный компонент">
        <UCheckbox
          :model-value="!!components.m"
          label="Требуется"
          @update:model-value="updateUseMaterialComponent"
        />
      </UFormField>
    </div>

    <template v-if="components.m">
      <UFormField
        class="col-span-16"
        label="Список материалов"
        name="m.text"
      >
        <UInput
          v-model="components.m.text"
          placeholder="Введи список материалов"
        />
      </UFormField>

      <UFormField
        class="col-span-4"
        label="Материалы имеют цену"
        name="m.withCost"
      >
        <UCheckbox
          v-model="components.m.withCost"
          :disabled="!components.m.text"
          label="Да"
        />
      </UFormField>

      <UFormField
        class="col-span-4"
        label="Материалы расходуются"
        name="m.consumable"
      >
        <UCheckbox
          v-model="components.m.consumable"
          :disabled="!components.m.text"
          label="Да"
        />
      </UFormField>
    </template>
  </UForm>
</template>
