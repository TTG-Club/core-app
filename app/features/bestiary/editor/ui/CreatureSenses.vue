<script setup lang="ts">
  import { getModifier, ValidationBase } from '~/shared/utils';

  import type {
    CreatureSenses,
    CreateAbilities,
    CreateSkill,
  } from '~bestiary/types';

  const model = defineModel<CreatureSenses>({ required: true });

  const { abilities, skills, proficiencyBonus } = defineProps<{
    abilities: CreateAbilities;
    skills: Array<CreateSkill>;
    proficiencyBonus: number;
  }>();

  watchEffect(() => {
    const wisdom = getModifier(abilities.wis.value);

    const perception = skills.find(
      (skill) => skill.skill === 'PERCEPTION',
    )?.multiplier;

    let bonus = 0;

    if (perception) {
      bonus = perception * proficiencyBonus;
    }

    model.value.passivePerception = 10 + wisdom + bonus;
  });
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Чувства"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="4">
      <AFormItem
        label="Тёмное зрение"
        :name="['senses', 'darkvision']"
      >
        <AInputNumber
          v-model:value="model.darkvision"
          :min="0"
          :precision="0"
          placeholder="Введите значение"
        >
          <template #addonAfter> фт. </template>
        </AInputNumber>
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Истинное зрение"
        :name="['senses', 'truesight']"
      >
        <AInputNumber
          v-model:value="model.truesight"
          :min="0"
          :precision="0"
          placeholder="Введите значение"
        >
          <template #addonAfter> фт. </template>
        </AInputNumber>
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Слепое зрение"
        :name="['senses', 'blindsight']"
      >
        <AInputNumber
          v-model:value="model.blindsight"
          :min="0"
          :precision="0"
          placeholder="Введите значение"
        >
          <template #addonAfter> фт. </template>
        </AInputNumber>
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Чувство вибрации"
        :name="['senses', 'tremorsense']"
      >
        <AInputNumber
          v-model:value="model.tremorsense"
          :min="0"
          :precision="0"
          placeholder="Введите значение"
        >
          <template #addonAfter> фт. </template>
        </AInputNumber>
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Пассивная Внимательность"
        :name="['senses', 'passivePerception']"
        :rules="[ValidationBase.ruleNumber()]"
      >
        <AInputNumber
          v-model:value="model.passivePerception"
          :min="0"
          :precision="0"
          placeholder="Введите значение"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
