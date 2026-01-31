<script setup lang="ts">
  import { EditorArrayControls } from '~ui/editor';

  import type { CreateAction } from '~bestiary/types';

  type ActionKey = 'actions' | 'bonusActions' | 'reactions';

  defineProps<{
    name: ActionKey;
  }>();

  const labelMap: Record<ActionKey, string> = {
    actions: 'Действия',
    bonusActions: 'Бонусные действия',
    reactions: 'Реакции',
  };

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

  const model = defineModel<Array<CreateAction>>({ default: () => [] });

  function isLastAction(index: number) {
    return index === model.value.length - 1;
  }

  function addAction(index: number) {
    model.value.splice(index, 0, getEmpty());
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        {{ labelMap[name] ?? 'Особенности' }}
      </h2>
    </template>

    <div class="grid gap-4">
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
            :name="`${name}.${actionIndex}.name.rus`"
          >
            <UInput
              v-model="action.name.rus"
              placeholder="Введи название"
            />
          </UFormField>

          <UFormField
            class="col-span-8"
            label="Название (англ.)"
            :name="`${name}.${actionIndex}.name.eng`"
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
            :name="`${name}.${actionIndex}.description`"
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
          Добавить {{ (labelMap[name] ?? 'Особенности').toLowerCase() }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>
