<script setup lang="ts">
  import type { CreatureLair } from '~bestiary/model';

  import { MarkupEditor } from '~ui/markup-editor';

  import { CREATURE_ACTION_ADD_LABELS } from '../constants';
  import { CreatureActionList } from './action';

  const model = defineModel<CreatureLair>({ required: true });
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
          <MarkupEditor
            v-model="model.description"
            placeholder="Введите описание (необязательно)"
          />
        </UFormField>
      </UForm>

      <CreatureActionList
        v-model="model.effects"
        :add-label="CREATURE_ACTION_ADD_LABELS.lair"
        path="lair.effects"
      />

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
          <MarkupEditor
            v-model="model.ending"
            placeholder="Описание окончания действия логова (необязательно)"
          />
        </UFormField>
      </UForm>
    </div>
  </UCard>
</template>
