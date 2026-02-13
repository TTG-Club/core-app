<script setup lang="ts">
  import { EditorArrayControls } from '~ui/editor';

  import type { CreateTrait, CreatureCreate } from '~bestiary/model';

  type Traits = CreatureCreate['traits'];

  function getEmptyTrait(): Traits[number] {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
    };
  }

  const model = defineModel<Array<CreateTrait>>({
    default: () => [],
  });

  function isLastTrait(index: number) {
    return index === model.value.length - 1;
  }

  function addTrait(indexOfNewTrait: number) {
    model.value.splice(indexOfNewTrait, 0, getEmptyTrait());
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Особенности</h2>
    </template>

    <div class="grid gap-4">
      <template
        v-for="(trait, traitIndex) in model"
        :key="traitIndex"
      >
        <UForm
          class="col-span-full grid grid-cols-24 gap-4"
          attach
          :state="trait"
        >
          <UFormField
            class="col-span-8"
            label="Название"
            name="name.rus"
          >
            <UInput
              v-model="trait.name.rus"
              placeholder="Введи название"
            />
          </UFormField>

          <UFormField
            class="col-span-8"
            label="Название (англ.)"
            help="Английское название"
            name="name.eng"
          >
            <UInput
              v-model="trait.name.eng"
              placeholder="Введи английское название"
            />
          </UFormField>

          <EditorArrayControls
            v-model="model"
            :item="trait"
            :empty-object="getEmptyTrait()"
            :index="traitIndex"
            cols="8"
            only-remove
          />

          <UFormField
            class="col-span-24"
            label="Описание"
            name="description"
          >
            <UTextarea
              v-model="trait.description"
              :rows="3"
              placeholder="Введи описание"
            />
          </UFormField>
        </UForm>

        <USeparator v-if="!isLastTrait(traitIndex)" />
      </template>

      <div
        v-if="!model.length"
        class="col-span-full flex justify-center"
      >
        <UButton @click.left.exact.prevent="addTrait(0)">
          Добавить умение
        </UButton>
      </div>
    </div>
  </UCard>
</template>
