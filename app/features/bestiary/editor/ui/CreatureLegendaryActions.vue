<script setup lang="ts">
  import { EditorArrayControls } from '~ui/editor';

  import type { CreateAction, LegendaryActions } from '~bestiary/model';

  function getEmpty(): CreateAction {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
      attackType: '',
      savingThrows: [],
      damageTypes: [],
      recharge: undefined,
      restrictionOfUse: undefined,
    };
  }

  const model = defineModel<LegendaryActions>({ required: true });

  function isLastAction(index: number) {
    return index === model.value.actions.length - 1;
  }

  function addAction(index: number) {
    model.value.actions.splice(index, 0, getEmpty());
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Легендарные действия</h2>
    </template>

    <div class="grid gap-6">
      <UForm
        class="col-span-full grid grid-cols-24 gap-4"
        attach
        :state="model"
      >
        <div class="col-span-7 flex flex-col gap-6">
          <UFormField
            label="Количество легендарных действий"
            name="count"
          >
            <UInputNumber
              v-model="model.count"
              placeholder="Введи количество"
              :min="1"
            />
          </UFormField>

          <UFormField
            label="Количество легендарных действий в логове"
            name="inLair"
          >
            <UInputNumber
              v-model="model.inLair"
              placeholder="Введи количество"
              :min="1"
            />
          </UFormField>
        </div>

        <UFormField
          class="col-span-17"
          label="Описание легендарных действий"
          name="description"
        >
          <UTextarea
            v-model="model.description"
            :maxrows="0"
            :rows="5"
            placeholder="Введите описание (необязательно)"
          />
        </UFormField>
      </UForm>

      <template
        v-for="(action, actionIndex) in model.actions"
        :key="actionIndex"
      >
        <UForm
          class="col-span-full grid grid-cols-24 gap-4"
          attach
          :state="action"
        >
          <UFormField
            class="col-span-8"
            label="Название"
            name="name.rus"
          >
            <UInput
              v-model="action.name.rus"
              placeholder="Введи название"
            />
          </UFormField>

          <UFormField
            class="col-span-8"
            label="Название (англ.)"
            name="name.eng"
          >
            <UInput
              v-model="action.name.eng"
              placeholder="Введи английское название"
            />
          </UFormField>

          <EditorArrayControls
            v-model="model.actions"
            :item="action"
            :empty-object="getEmpty()"
            :index="actionIndex"
            cols="8"
            only-remove
          />

          <UFormField
            class="col-span-24"
            label="Описание"
            name="description"
          >
            <UTextarea
              v-model="action.description"
              :rows="3"
              placeholder="Введи описание"
            />
          </UFormField>
        </UForm>

        <USeparator v-if="!isLastAction(actionIndex)" />
      </template>

      <div
        v-if="!model.actions.length"
        class="col-span-full flex justify-center"
      >
        <UButton @click.left.exact.prevent="addAction(0)">
          Добавить первое
        </UButton>
      </div>
    </div>
  </UCard>
</template>
