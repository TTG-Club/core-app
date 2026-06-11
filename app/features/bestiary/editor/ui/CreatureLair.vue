<script setup lang="ts">
  import type { CreateAction, CreatureLair } from '~bestiary/model';

  import { EditorArrayControls } from '~ui/editor';

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

  const model = defineModel<CreatureLair>({ required: true });

  function isLastAction(index: number) {
    return index === model.value.effects.length - 1;
  }

  function addAction(index: number) {
    model.value.effects.splice(index, 0, getEmpty());
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Логово</h2>
    </template>

    <div class="grid gap-6">
      <UForm
        class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
        attach
        :state="model"
      >
        <UFormField
          class="col-span-full"
          label="Название логова"
          name="lair.name"
        >
          <UInput
            v-model="model.name"
            placeholder="Название логова (необязательно)"
          />
        </UFormField>

        <UFormField
          class="col-span-full"
          label="Описание логова"
          name="lair.description"
          :ui="{ root: 'w-full', container: 'w-full' }"
        >
          <UTextarea
            v-model="model.description"
            class="w-full"
            :ui="{ root: 'flex w-full', base: 'w-full' }"
            :maxrows="6"
            :rows="2"
            placeholder="Введите описание (необязательно)"
          />
        </UFormField>
      </UForm>

      <template
        v-for="(effect, effectIndex) in model.effects"
        :key="effectIndex"
      >
        <UForm
          class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
          attach
          :state="effect"
        >
          <UFormField
            class="col-span-full md:col-span-8"
            label="Название"
            name="name.rus"
          >
            <UInput
              v-model="effect.name.rus"
              placeholder="Введи название"
            />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-8"
            label="Название (англ.)"
            name="name.eng"
          >
            <UInput
              v-model="effect.name.eng"
              placeholder="Введи английское название"
            />
          </UFormField>

          <EditorArrayControls
            v-model="model.effects"
            :item="effect"
            :empty-object="getEmpty()"
            :index="effectIndex"
            cols="8"
            only-remove
          />

          <UFormField
            class="col-span-full md:col-span-24"
            label="Описание"
            name="description"
            :ui="{ root: 'w-full', container: 'w-full' }"
          >
            <UTextarea
              v-model="effect.description"
              class="w-full"
              :ui="{ root: 'flex w-full', base: 'w-full' }"
              :rows="3"
              placeholder="Введи описание"
            />
          </UFormField>
        </UForm>

        <USeparator v-if="!isLastAction(effectIndex)" />
      </template>

      <div
        v-if="!model.effects.length"
        class="col-span-full flex justify-center"
      >
        <UButton @click.left.exact.prevent="addAction(0)">
          Добавить первый
        </UButton>
      </div>

      <UForm
        class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
        attach
        :state="model"
      >
        <UFormField
          class="col-span-full"
          label="Описание окончания действия логова"
          name="lair.ending"
          :ui="{ root: 'w-full', container: 'w-full' }"
        >
          <UTextarea
            v-model="model.ending"
            class="w-full"
            :ui="{ root: 'flex w-full', base: 'w-full' }"
            :maxrows="6"
            :rows="2"
            placeholder="Описание окончания действия логова (необязательно)"
          />
        </UFormField>
      </UForm>
    </div>
  </UCard>
</template>
