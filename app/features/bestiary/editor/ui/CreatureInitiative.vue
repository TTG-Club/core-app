<script setup lang="ts">
  import type { CreateAbility, CreateInitiative } from '~bestiary/model';

  import { SelectMastery } from '~ui/select';
  import { watchDerivedField } from '~workshop/composable';

  const { dex, proficiencyBonus } = defineProps<{
    dex: CreateAbility;
    proficiencyBonus: number;
  }>();

  const model = defineModel<CreateInitiative>({ required: true });

  const derivedValue = computed(
    () => getModifier(dex.value) + model.value.multiplier * proficiencyBonus,
  );

  // Пересчитываем только по правкам Ловкости, уровня владения и бонуса
  // мастерства. При загрузке записи сохранённое значение важнее формулы: у
  // существ оно берётся из статблока и может с ней не совпадать.
  watchDerivedField(
    model,
    () => derivedValue.value,
    (value, initiative) => {
      initiative.value = value;
    },
  );
</script>

<template>
  <UForm
    class="grid grid-cols-1 gap-4 md:grid-cols-22"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-full md:col-span-10"
      label="Инициатива"
      name="value"
    >
      <UFieldGroup>
        <!-- Без `min`: у существ с Ловкостью ниже 10 инициатива отрицательная
             (например, −2 у зомби), а `min="0"` не давал её ввести. -->
        <UInputNumber
          v-model="model.value"
          :precision="0"
          placeholder="Введи инициативу"
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
      class="col-span-full md:col-span-12"
      label="Уровень владения"
      name="multiplier"
    >
      <SelectMastery v-model="model.multiplier" />
    </UFormField>
  </UForm>
</template>
