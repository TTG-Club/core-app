<script setup lang="ts">
  import { useDiceRollerState } from '~dice-roller/composables';

  const props = defineProps<{
    onSubmit: () => void;
  }>();

  const { formula } = useDiceRollerState();
</script>

<template>
  <form
    class="mt-3 flex items-center gap-2 border-t border-default pt-3"
    @submit.prevent="props.onSubmit"
  >
    <UFieldGroup class="w-full">
      <UInput
        v-model="formula"
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
  </form>
</template>
