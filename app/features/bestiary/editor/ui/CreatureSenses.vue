<script setup lang="ts">
  import type {
    CreatureSenses,
    CreateSkill,
    CreateAbility,
  } from '~bestiary/types';

  const model = defineModel<CreatureSenses>({ required: true });

  const { wisdom, skills, proficiencyBonus } = defineProps<{
    wisdom: CreateAbility;
    skills: Array<CreateSkill>;
    proficiencyBonus: number;
  }>();

  watchEffect(() => {
    const wisdomModificator = getModifier(wisdom.value);

    const perception = skills.find(
      (skill) => skill.skill === 'PERCEPTION',
    )?.multiplier;

    let bonus = 0;

    if (perception) {
      bonus = perception * proficiencyBonus;
    }

    model.value.passivePerception = 10 + wisdomModificator + bonus;
  });
</script>

<template>
  <USeparator>
    <span class="font-bold text-secondary">Чувства</span>
  </USeparator>

  <UForm
    class="col-span-full grid grid-cols-5 gap-4"
    attach
    :state="model"
  >
    <UFormField
      label="Тёмное зрение"
      name="darkvision"
    >
      <UInputNumber
        v-model="model.darkvision"
        :min="0"
        :precision="0"
        placeholder="Введите значение"
      >
        <template #trailing> фт. </template>
      </UInputNumber>
    </UFormField>

    <UFormField
      label="Истинное зрение"
      name="truesight"
    >
      <UInputNumber
        v-model="model.truesight"
        :min="0"
        :precision="0"
        placeholder="Введите значение"
      >
        <template #trailing> фт. </template>
      </UInputNumber>
    </UFormField>

    <UFormField
      label="Слепое зрение"
      name="blindsight"
    >
      <UInputNumber
        v-model="model.blindsight"
        :min="0"
        :precision="0"
        placeholder="Введите значение"
      >
        <template #trailing> фт. </template>
      </UInputNumber>
    </UFormField>

    <UFormField
      label="Чувство вибрации"
      name="tremorsense"
    >
      <UInputNumber
        v-model="model.tremorsense"
        :min="0"
        :precision="0"
        placeholder="Введите значение"
      >
        <template #trailing> фт. </template>
      </UInputNumber>
    </UFormField>

    <UFormField
      label="Пассивная Внимательность"
      name="passivePerception"
    >
      <UInputNumber
        v-model="model.passivePerception"
        :min="0"
        :precision="0"
        placeholder="Введите значение"
      />
    </UFormField>
  </UForm>
</template>
