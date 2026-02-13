<script setup lang="ts">
  import { SelectChallengeRating } from '~ui/select';

  import type { CreateExperience } from '~bestiary/model';

  const model = defineModel<CreateExperience>({ required: true });

  const proficiencyBonus = defineModel<number>('proficiency-bonus', {
    required: true,
  });
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Уровень опасности</h2>
    </template>

    <UForm
      class="col-span-full grid grid-cols-24 gap-4"
      attach
      :state="model"
    >
      <UFormField
        class="col-span-4"
        label="Показатель опасности"
        name="value"
      >
        <SelectChallengeRating
          v-model="model.value"
          v-model:proficiency-bonus="proficiencyBonus"
        />
      </UFormField>

      <UFormField
        class="col-span-4"
        label="ПО в логове"
        name="inLair"
      >
        <UInputNumber
          v-model="model.inLair"
          :precision="0"
          :min="0"
          placeholder="Значение в логове"
        />
      </UFormField>

      <UFormField
        class="col-span-16"
        label="Суффикс"
        name="suffix"
      >
        <UInput
          v-model="model.suffix"
          placeholder="Доп. текст"
        />
      </UFormField>
    </UForm>
  </UCard>
</template>
