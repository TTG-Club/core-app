<script setup lang="ts">
  import { SelectChallengeRating } from '~ui/select';

  import type { CreateExperience } from '~bestiary/types';

  const model = defineModel<CreateExperience>({ required: true });

  const proficiencyBonus = defineModel<number>('proficiency-bonus', {
    required: true,
  });
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Уровень опасности"
      strong
    />
  </ADivider>

  <ARow :gutter="12">
    <ACol :span="4">
      <AFormItem
        label="Показатель опасности"
        :name="['experience', 'value']"
      >
        <SelectChallengeRating
          v-model="model.value"
          v-model:proficiency-bonus="proficiencyBonus"
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="ПО в логове"
        :name="['experience', 'inLair']"
      >
        <AInputNumber
          v-model:value="model.inLair"
          :precision="0"
          :min="0"
          placeholder="Значение в логове"
        />
      </AFormItem>
    </ACol>

    <ACol :span="16">
      <AFormItem
        label="Суффикс"
        :name="['experience', 'suffix']"
      >
        <AInput
          v-model:value="model.suffix"
          placeholder="Доп. текст"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
