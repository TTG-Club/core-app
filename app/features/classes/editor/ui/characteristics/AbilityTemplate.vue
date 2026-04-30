<script setup lang="ts">
  import type { AbilityTemplateCreate } from '../../../model';

  import { ABILITIES } from '~/shared/types';

  const modelValue = defineModel<AbilityTemplateCreate | undefined>();

  const defaultTemplate: AbilityTemplateCreate = [8, 8, 8, 8, 8, 8];

  function enableTemplate() {
    modelValue.value = [...defaultTemplate];
  }

  function disableTemplate() {
    modelValue.value = undefined;
  }
</script>

<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base text-highlighted">Шаблон характеристик</h3>

      <UButton
        v-if="!modelValue"
        color="primary"
        variant="soft"
        size="xs"
        trailing-icon="tabler:plus"
        label="Добавить шаблон"
        @click.left.exact.prevent="enableTemplate"
      />

      <UButton
        v-else
        color="error"
        variant="ghost"
        size="xs"
        trailing-icon="tabler:trash"
        label="Удалить шаблон"
        @click.left.exact.prevent="disableTemplate"
      />
    </div>

    <div
      v-if="modelValue"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6"
    >
      <UFormField
        v-for="(ability, index) in ABILITIES"
        :key="ability.key"
        :label="ability.label"
      >
        <UInputNumber
          v-model="modelValue[index]"
          :min="1"
          :max="30"
        />
      </UFormField>
    </div>
  </div>
</template>
