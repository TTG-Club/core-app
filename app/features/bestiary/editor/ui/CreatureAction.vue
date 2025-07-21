<script setup lang="ts">
  import type { CreateAction } from '~bestiary/types';
  import { EditorArrayControls } from '~ui/editor';

  type ActionKey =
    | 'actions'
    | 'bonusActions'
    | 'reactions'
    | 'legendaryActions';

  defineProps<{
    name: ActionKey;
  }>();

  const labelMap: Record<ActionKey, string> = {
    actions: 'Действия',
    bonusActions: 'Бонусные действия',
    reactions: 'Реакции',
    legendaryActions: 'Легендарные действия',
  };

  function getEmpty(): CreateAction {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
      attackType: '',
      sawingThrows: [],
      damageTypes: [],
      recharge: undefined,
      restrictionOfUse: undefined,
    };
  }

  const model = defineModel<Array<CreateAction>>({
    default: () => [],
  });

  function isLastAction(index: number) {
    return index === model.value.length - 1;
  }

  function addAction(indexOfNewFeature: number) {
    model.value.splice(indexOfNewFeature, 0, getEmpty());
  }
</script>

<template>
  <USeparator>
    <span class="font-bold text-secondary">
      {{ labelMap[name] ?? 'Особенности' }}
    </span>
  </USeparator>

  <template
    v-for="(action, actionIndex) in model"
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
        v-model="model"
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
    v-if="!model.length"
    class="col-span-full flex justify-center"
  >
    <UButton @click.left.exact.prevent="addAction(0)">
      Добавить первое
    </UButton>
  </div>
</template>
