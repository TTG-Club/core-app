<script setup lang="ts">
  import { SelectHabitat, SelectTreasure } from '~ui/select';

  import type { CreateSection } from '~bestiary/types';

  const model = defineModel<CreateSection>({ required: true });
</script>

<template>
  <USeparator>
    <span class="font-bold text-secondary">Секция</span>
  </USeparator>

  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-8"
      label="Название секции"
      name="name.rus"
      help="Например, Золотые драконы"
    >
      <UInput
        v-model="model.name.rus"
        placeholder="Введи название секции"
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Название секции (англ.)"
      name="name.eng"
      help="Например, Gold Dragons"
    >
      <UInput
        v-model="model.name.eng"
        placeholder="Введи название секции"
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Подзаголовок"
      name="subtitle"
      help="Например, Драконы надежды и величия"
    >
      <UInput
        v-model="model.subtitle"
        placeholder="Введи подзаголовок"
      />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Среда обитания"
      name="habitats"
    >
      <SelectHabitat
        v-model="model.habitats"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Сокровища"
      name="treasures"
    >
      <SelectTreasure
        v-model="model.treasures"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-24"
      label="Описание секции"
      name="description"
    >
      <UTextarea
        v-model="model.description"
        :rows="8"
        placeholder="Введи описание"
        clearable
      />
    </UFormField>
  </UForm>
</template>
