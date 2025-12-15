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
    class="col-span-1 grid grid-cols-22 gap-4"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-10"
      label="Инициатива"
      name="value"
    >
      <UFieldGroup>
        <UInputNumber
          v-model="model.value"
          :precision="0"
          placeholder="Введи инициативу"
          :min="0"
        />

        <UBadge
          color="neutral"
          variant="subtle"
        >
          +{{ 10 + model.value }}
        </UBadge>
      </UFieldGroup>
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
