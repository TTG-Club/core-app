<script setup lang="ts">
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  import DiceRollerHelpPopover from './DiceRollerHelpPopover.vue';

  const props = defineProps<{
    onSubmit: () => void;
  }>();

  const { formula } = useDiceRollerState();
</script>

<template>
  <form
    class="mt-3 flex items-center gap-2 border-t border-[var(--ui-border)] pt-3"
    @submit.prevent="props.onSubmit"
  >
    <UInput
      v-model="formula"
      placeholder="Например: 1к20+5"
      size="xl"
      class="w-full"
    >
      <template #trailing>
        <DiceRollerHelpPopover />
      </template>
    </UInput>

    <button
      type="submit"
      class="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(0,0,0,0.22)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:outline-none"
      aria-label="Бросить кубы"
      title="Кидай!"
    >
      <UIcon
        name="i-heroicons-paper-airplane-20-solid"
        class="h-6 w-6 text-[var(--color-primary-500)]"
      />
    </button>
  </form>
</template>
