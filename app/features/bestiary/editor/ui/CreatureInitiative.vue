<script setup lang="ts">
  import { SelectMastery } from '~ui/select';

  import type { CreateAbility, CreateInitiative } from '~bestiary/types';

  const { dex, proficiencyBonus } = defineProps<{
    dex: CreateAbility;
    proficiencyBonus: number;
  }>();

  const model = defineModel<CreateInitiative>({ required: true });

  watch(
    [() => dex.value, () => model.value.multiplier],
    ([dexValue, multiplier]) => {
      model.value.value = getModifier(dexValue) + multiplier * proficiencyBonus;
    },
    { immediate: true },
  );
</script>

<template>
  <UForm
    class="col-span-8 grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-12"
      label="Инициатива"
      name="value"
    >
      <UInputNumber
        v-model="model.value"
        :precision="0"
        placeholder="Введи инициативу"
        :min="0"
      >
        <template #trailing> +{{ 10 + model.value }} </template>
      </UInputNumber>
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Уровень владения"
      name="multiplier"
    >
      <SelectMastery v-model="model.multiplier" />
    </UFormField>
  </UForm>
</template>
