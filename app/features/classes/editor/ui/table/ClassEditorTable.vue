<script setup lang="ts">
  import { EditorArrayControls } from '~ui/editor';
  import type { ClassColumnCreate } from '~classes/types';
  import { TableColumnScaling } from './ui';

  const state = defineModel<Array<ClassColumnCreate>>({ required: true });

  function addEmptyColumn() {
    state.value.push(getEmptyColumn());
  }

  function getEmptyColumn(): ClassColumnCreate {
    return { name: '', scaling: [] };
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        Дополнительные колонки таблицы
      </h2>
    </template>

    <div class="flex flex-col gap-4">
      <template
        v-for="(column, index) in state"
        :key="index"
      >
        <UCard variant="subtle">
          <UForm
            class="grid grid-cols-24 gap-4"
            attach
            :state="column"
          >
            <UFormField
              class="col-span-12"
              label="Название"
              name="name"
            >
              <UInput
                v-model="column.name"
                placeholder="Например: Ячейки заклинаний"
              />
            </UFormField>

            <EditorArrayControls
              v-model="state"
              :item="column"
              :empty-object="getEmptyColumn()"
              :index="index"
              cols="12"
              only-remove
            />

            <TableColumnScaling v-model="column.scaling" />
          </UForm>
        </UCard>
      </template>
    </div>

    <div
      v-if="!state.length"
      class="grid place-items-center py-2"
    >
      <UButton @click.left.exact.prevent="addEmptyColumn">
        Добавить таблицу
      </UButton>
    </div>
  </UCard>
</template>
