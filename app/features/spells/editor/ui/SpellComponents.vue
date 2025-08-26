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
  <div class="col-span-full mt-4 flex gap-4">
    <p class="text-lg">Компоненты</p>

    <USeparator />
  </div>

  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="components"
  >
    <div class="col-span-5">
      <UFormField name="v">
        <UCheckbox
          v-model="components.v"
          label="Вербальный компонент"
        />
      </UFormField>
    </div>

    <div class="col-span-5">
      <UFormField name="s">
        <UCheckbox
          v-model="components.s"
          label="Соматический компонент"
        />
      </UFormField>
    </div>

    <div class="col-span-5">
      <UFormField>
        <UCheckbox
          :model-value="!!components.m"
          label="Материальный компонент"
          @update:model-value="updateUseMaterialComponent"
        />
      </UFormField>
    </div>

    <template v-if="components.m">
      <UFormField
        class="col-span-full"
        label="Список материалов"
        name="m.text"
      >
        <UInput
          v-model="components.m.text"
          placeholder="Введи список материалов"
        />
      </UFormField>

      <UFormField
        class="col-span-5"
        name="m.withCost"
      >
        <UCheckbox
          v-model="components.m.withCost"
          :disabled="!components.m.text"
          label="Материалы имеют цену"
        />
      </UFormField>

      <UFormField
        class="col-span-5"
        name="m.consumable"
      >
        <UCheckbox
          v-model="components.m.consumable"
          :disabled="!components.m.text"
          label="Материалы расходуются"
        />
      </UFormField>
    </template>
  </UForm>
</template>
