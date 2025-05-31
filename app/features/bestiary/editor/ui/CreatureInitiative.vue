<script setup lang="ts">
  import { getModifier } from '~/shared/utils';
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
  <ACol :span="4">
    <AFormItem
      label="Инициатива"
      :name="['initiative', 'value']"
    >
      <AInputNumber
        v-model:value="model.value"
        :precision="0"
        placeholder="Введи инициативу"
        min="0"
        :addon-after="`+${10 + model.value}`"
      />
    </AFormItem>
  </ACol>

  <ACol :span="4">
    <AFormItem
      label="Уровень владения"
      :name="['initiative', 'multiplier']"
    >
      <SelectMastery v-model="model.multiplier" />
    </AFormItem>
  </ACol>
</template>
