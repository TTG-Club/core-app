<script setup lang="ts">
  import { useDiceRollerState } from '~dice-roller/composables';

  const emit = defineEmits<{
    (e: 'submit'): void;
  }>();

  const { formula } = useDiceRollerState();

  const state = reactive({
    formula,
  });
</script>

<template>
  <UForm
    :state="state"
    class="flex shrink-0 items-center gap-2 border-t border-default p-4"
    @submit="emit('submit')"
  >
    <UFieldGroup class="w-full">
      <UInput
        v-model="state.formula"
        placeholder="Например: 1к20+5"
        class="w-full"
      />

      <slot name="help" />
    </UFieldGroup>

    <UButton
      type="submit"
      icon="i-fluent-send-24-filled"
      color="primary"
      class="rounded-md shadow-lg transition"
      aria-label="Бросить кубы"
    />
  </UForm>
</template>
