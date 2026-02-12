<script setup lang="ts">
  import { SelectAbilities } from '~ui/select';

  import type { ClassFeatureAbilityBonusCreate } from '~classes/types';

  const state = defineModel<ClassFeatureAbilityBonusCreate | undefined>({
    required: true,
  });

  function reset() {
    state.value = { abilities: [], bonus: 0, upto: 25 };
  }
</script>

<template>
  <USeparator class="col-span-full my-2">
    <span class="font-bold text-secondary"> Увеличение характеристик </span>
  </USeparator>

  <UForm
    v-if="!!state"
    class="col-span-full grid grid-cols-24 gap-4"
    :state
    attach
  >
    <UFormField
      class="col-span-12"
      label="Характеристики"
      name="abilities"
    >
      <SelectAbilities
        v-model="state.abilities"
        :limit="2"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Бонус характеристики"
      name="bonus"
    >
      <UInputNumber
        v-model="state.bonus"
        placeholder="Введи бонус"
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Лимит увеличения"
      name="upto"
    >
      <UInputNumber
        v-model="state.upto"
        placeholder="Введи лимит"
      />
    </UFormField>

    <UFormField
      class="col-span-4"
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
      Добавить увеличение характеристик
    </UButton>
  </div>
</template>
