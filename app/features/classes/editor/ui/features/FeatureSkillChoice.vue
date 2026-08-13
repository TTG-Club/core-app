<script setup lang="ts">
  import type { ClassFeatureSkillChoiceCreate } from '../../../model';

  import { SelectSkills } from '~ui/select';

  const state = defineModel<ClassFeatureSkillChoiceCreate | undefined>({
    required: true,
  });

  /** Заводит выбор с пустым пулом: пустой пул — выбор из всех навыков. */
  function reset() {
    state.value = { count: 1, skills: [] };
  }
</script>

<template>
  <USeparator class="col-span-full my-2">
    <span class="font-bold text-secondary">Выбор владения навыками</span>
  </USeparator>

  <UForm
    v-if="!!state"
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
    :state
    attach
  >
    <UFormField
      class="col-span-full md:col-span-4"
      label="Кол-во навыков"
      name="count"
    >
      <UInputNumber
        v-model="state.count"
        :min="1"
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-16"
      label="Навыки на выбор"
      name="skills"
      help="Пустой список — выбор из всех навыков"
    >
      <SelectSkills
        v-model="state.skills"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-4"
      label="Управление"
    >
      <UButton
        label="Удалить"
        block
        @click.left.exact.prevent="state = undefined"
      />
    </UFormField>
  </UForm>

  <div
    v-else
    class="col-span-full flex justify-center"
  >
    <UButton @click.left.exact.prevent="reset()">
      Добавить выбор владения навыками
    </UButton>
  </div>
</template>
