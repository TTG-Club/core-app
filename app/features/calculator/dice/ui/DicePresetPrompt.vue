<script setup lang="ts">
  import type { DicePreset, DicePresetPrompt } from '../model';

  import { fillPresetFormula } from '../model';

  const { preset, prompt } = defineProps<{
    preset: DicePreset;
    prompt: DicePresetPrompt;
  }>();

  const emit = defineEmits<{
    submit: [formula: string];
  }>();

  const isOpen = ref(false);

  // Введённое число переживает закрытие поповера: второй раз бить по той же
  // цели — обычное дело, и вводить её КД заново незачем.
  const value = ref(prompt.defaultValue);

  function submit(): void {
    isOpen.value = false;
    emit('submit', fillPresetFormula(preset, value.value));
  }
</script>

<template>
  <UPopover
    v-model:open="isOpen"
    :ui="{ content: 'w-56' }"
  >
    <UButton
      color="neutral"
      variant="outline"
      size="sm"
      class="rounded-full"
      :active="isOpen"
      active-color="primary"
      active-variant="outline"
      :label="preset.label"
    />

    <template #content>
      <form
        class="flex flex-col gap-3 p-3"
        @submit.prevent="submit"
      >
        <UFormField
          :label="prompt.label"
          size="sm"
        >
          <UInputNumber
            v-model="value"
            class="w-full"
            :min="prompt.min"
            :max="prompt.max"
            autofocus
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="sm"
          block
          label="Бросить"
        />
      </form>
    </template>
  </UPopover>
</template>
