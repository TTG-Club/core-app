<script setup lang="ts">
  import type { SpellComponents, SpellMaterialComponent } from '~spells/model';

  import { SPELL_USAGE_LABELS } from '~spells/model';

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
  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="components"
  >
    <div class="col-span-full md:col-span-8 xl:col-span-5">
      <UFormField name="v">
        <UCheckbox
          v-model="components.v"
          :label="SPELL_USAGE_LABELS.verbal"
        />
      </UFormField>
    </div>

    <div class="col-span-full md:col-span-8 xl:col-span-5">
      <UFormField name="s">
        <UCheckbox
          v-model="components.s"
          :label="SPELL_USAGE_LABELS.somatic"
        />
      </UFormField>
    </div>

    <div class="col-span-full md:col-span-8 xl:col-span-5">
      <UFormField>
        <UCheckbox
          :model-value="!!components.m"
          :label="SPELL_USAGE_LABELS.material"
          @update:model-value="updateUseMaterialComponent"
        />
      </UFormField>
    </div>

    <template v-if="components.m">
      <UFormField
        class="col-span-full"
        :label="SPELL_USAGE_LABELS.materialList"
        name="m.text"
      >
        <UInput
          v-model="components.m.text"
          :placeholder="SPELL_USAGE_LABELS.materialListPlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-5"
        name="m.withCost"
      >
        <UCheckbox
          v-model="components.m.withCost"
          :disabled="!components.m.text"
          :label="SPELL_USAGE_LABELS.materialWithCost"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-5"
        name="m.consumable"
      >
        <UCheckbox
          v-model="components.m.consumable"
          :disabled="!components.m.text"
          :label="SPELL_USAGE_LABELS.materialConsumable"
        />
      </UFormField>
    </template>
  </UForm>
</template>
