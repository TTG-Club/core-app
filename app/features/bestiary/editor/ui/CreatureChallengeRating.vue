<script setup lang="ts">
  import { watch } from 'vue';

  import { SelectChallengeRating } from '~ui/select';

  import type { CreateExperience } from '~bestiary/types';

  const model = defineModel<CreateExperience>({ required: true });

  const emit = defineEmits<{
    (e: 'update:proficiencyBonus', value: number): void;
  }>();

  const crToProficiencyBonus = (cr: number): number => {
    if (cr >= 29) return 9;
    if (cr >= 25) return 8;
    if (cr >= 21) return 7;
    if (cr >= 17) return 6;
    if (cr >= 13) return 5;
    if (cr >= 9) return 4;
    if (cr >= 5) return 3;

    return 2;
  };

  watch(
    () => model.value?.value,
    (val) => {
      if (typeof val === 'number') {
        emit('update:proficiencyBonus', crToProficiencyBonus(val));
      }
    },
  );
</script>

<template>
  <ARow :gutter="12">
    <ACol :span="8">
      <AFormItem
        label="Показатель опасности"
        :name="['immunityToDamage']"
      >
        <SelectChallengeRating v-model="model.value" />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem label="ПО в логове">
        <AInputNumber
          v-model:value="model.inLair"
          :precision="0"
          :min="0"
          placeholder="Значение в логове"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem label="Суффикс">
        <AInput
          v-model:value="model.suffix"
          placeholder="Доп. текст"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
