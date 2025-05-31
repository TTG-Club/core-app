<script setup lang="ts">
  import { SelectHabitat, SelectTreasure } from '~ui/select';

  import type { CreatureSection } from '~bestiary/types';

  const model = defineModel<CreatureSection>({ required: true });
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Секция"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="6">
      <AFormItem
        label="Подзаголовок"
        :name="['subtitle']"
      >
        <AInput
          v-model:value="model.subtitle"
          :placeholder="`Например, Неумолимый страж Нижних планов`"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Среда обитания"
        :name="['habitates']"
      >
        <SelectHabitat
          v-model="model.habitats"
          multiple
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Сокровища"
        :name="['treasures']"
      >
        <SelectTreasure
          v-model="model.treasures"
          multiple
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
