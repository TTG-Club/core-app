<script setup lang="ts">
  import type { LegendaryActions } from '../../model';

  import { MarkupEditor } from '~ui/markup-editor';

  import { CREATURE_ACTION_ADD_LABELS } from '../constants';
  import { CreatureActionList } from './action';

  const model = defineModel<LegendaryActions>({ required: true });
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
        class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
        attach
        :state="model"
      >
        <div class="col-span-full flex flex-col gap-6 md:col-span-7">
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
          class="col-span-full md:col-span-17"
          label="Описание легендарных действий"
          name="description"
          :ui="{ root: 'w-full', container: 'w-full' }"
        >
          <MarkupEditor
            v-model="model.description"
            placeholder="Введите описание (необязательно)"
          />
        </UFormField>
      </UForm>

      <CreatureActionList
        v-model="model.actions"
        :add-label="CREATURE_ACTION_ADD_LABELS.legendary"
        path="legendary.actions"
      />
    </div>
  </UCard>
</template>
