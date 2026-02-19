<script setup lang="ts">
  import {
    SelectAbilities,
    SelectCasterType,
    SelectClass,
    SelectDice,
  } from '~ui/select';

  import ClassEditorAbilityTemplate from './AbilityTemplate.vue';
  import PrimaryCharacteristics from './PrimaryCharacteristics.vue';

  import type {
    AbilityTemplateCreate,
    ClassPrimaryCharacteristicsCreate,
  } from '~classes/model';

  import type { AbilityKey } from '~/shared/types';

  const parentUrl = defineModel<string | undefined>('parentUrl', {
    required: true,
  });

  const hitDice = defineModel<string | undefined>('hitDice', {
    required: true,
  });

  const casterType = defineModel<string | undefined>('casterType', {
    required: true,
  });

  const primaryCharacteristics = defineModel<ClassPrimaryCharacteristicsCreate>(
    'primaryCharacteristics',
    { required: true },
  );

  const savingThrows = defineModel<AbilityKey[]>('savingThrows', {
    default: () => [],
    required: true,
  });

  const abilityTemplate = defineModel<AbilityTemplateCreate | undefined>(
    'abilityTemplate',
    { required: true },
  );
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        Характеристики и родительский класс
      </h2>
    </template>

    <div class="grid grid-cols-24 gap-4">
      <UFormField
        class="col-span-12"
        label="Родительский класс"
        name="parentUrl"
      >
        <SelectClass v-model="parentUrl" />
      </UFormField>

      <UFormField
        class="col-span-6"
        label="Кость хитов"
        name="hitDice"
      >
        <SelectDice
          v-model="hitDice"
          placeholder="Выбери кость хитов"
        />
      </UFormField>

      <UFormField
        class="col-span-6"
        label="Тип заклинателя"
        name="casterType"
      >
        <SelectCasterType v-model="casterType" />
      </UFormField>

      <PrimaryCharacteristics v-model="primaryCharacteristics" />

      <UFormField
        class="col-span-10"
        label="Спасброски"
        name="savingThrows"
      >
        <SelectAbilities
          v-model="savingThrows"
          :limit="2"
          multiple
        />
      </UFormField>

      <USeparator class="col-span-full my-2" />

      <div class="col-span-full">
        <ClassEditorAbilityTemplate v-model="abilityTemplate" />
      </div>
    </div>
  </UCard>
</template>
