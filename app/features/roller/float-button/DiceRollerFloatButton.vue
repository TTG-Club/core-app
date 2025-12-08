<script setup lang="ts">
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const { open } = useDiceRollerState();
</script>

<template>
  <button
    type="button"
    class="fixed right-4 bottom-4 z-[120] hidden h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] shadow-[0_12px_25px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(0,0,0,0.3)] md:inline-flex"
    aria-label="Открыть роллер кубов"
    @click="open"
  >
    <UIcon
      name="i-ttg-dice-d20"
      class="h-5 w-5 text-[var(--color-primary-500)]"
    />
  </button>
</template>
