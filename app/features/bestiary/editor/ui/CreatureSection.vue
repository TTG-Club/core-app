<script setup lang="ts">
  import { SelectHabitat, SelectTreasure } from '~ui/select';

  import type { CreateSection } from '~bestiary/model';

  const model = defineModel<CreateSection>({ required: true });
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Секция</h2>
    </template>

    <UForm
      class="grid grid-cols-24 gap-6"
      attach
      :state="model"
    >
      <div class="col-span-8 grid gap-1">
        <UFormField
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
          label="Подзаголовок"
          name="subtitle"
          help="Например, Драконы надежды и величия"
        >
          <UInput
            v-model="model.subtitle"
            placeholder="Введи подзаголовок"
          />
        </UFormField>
      </div>

      <div class="col-span-16 flex flex-col gap-7">
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Среда обитания"
            name="habitats"
          >
            <SelectHabitat
              v-model="model.habitats"
              multiple
            />
          </UFormField>

          <UFormField
            label="Сокровища"
            name="treasures"
          >
            <SelectTreasure
              v-model="model.treasures"
              multiple
            />
          </UFormField>
        </div>

        <UFormField
          label="Описание секции"
          name="description"
        >
          <UTextarea
            v-model="model.description"
            :rows="6"
            placeholder="Введи описание"
            clearable
          />
        </UFormField>
      </div>
    </UForm>
  </UCard>
</template>
