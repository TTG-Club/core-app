<script setup lang="ts">
  import { EditorArrayControls } from '~ui/editor';
  import { SelectLevel } from '~ui/select';

  import type { ClassColumnScalingCreate } from '~classes/model';

  const state = defineModel<Array<ClassColumnScalingCreate>>({
    required: true,
  });

  function addEmptyScalingValue() {
    state.value.push(getEmptyColumnScaling());
  }

  function getEmptyColumnScaling(): ClassColumnScalingCreate {
    return { level: 1, value: '' };
  }
</script>

<template>
  <USeparator class="col-span-full my-2">
    <span class="font-bold text-secondary"> Масштабирование по уровням </span>
  </USeparator>

  <div class="col-span-full grid grid-cols-24 gap-4">
    <UForm
      v-for="(row, index) in state"
      :key="index"
      class="col-span-full grid grid-cols-24 gap-4"
      attach
      :state="row"
    >
      <UFormField
        class="col-span-8"
        label="Уровень"
        name="level"
      >
        <SelectLevel v-model="row.level" />
      </UFormField>

      <UFormField
        class="col-span-8"
        label="Значение"
        name="value"
      >
        <UInput
          v-model="row.value"
          placeholder="Значение"
        />
      </UFormField>

      <EditorArrayControls
        v-model="state"
        :item="row"
        :empty-object="getEmptyColumnScaling()"
        :index="index"
        cols="8"
        only-remove
      />
    </UForm>

    <div
      v-if="!state.length"
      class="col-span-full flex justify-center"
    >
      <UButton @click.left.exact.prevent="addEmptyScalingValue">
        Добавить масштабирование
      </UButton>
    </div>
  </div>
</template>
