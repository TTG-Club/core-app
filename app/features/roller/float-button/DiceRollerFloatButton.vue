<script setup lang="ts">
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const { isOpen, toggle } = useDiceRollerState();
</script>

<template>
  <button
    type="button"
    class="fixed right-4 bottom-4 z-[120] hidden h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] shadow-[0_12px_25px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(0,0,0,0.3)] md:inline-flex"
    :aria-label="isOpen ? 'Закрыть роллер кубов' : 'Открыть роллер кубов'"
    @click="toggle"
  >
    <Transition
      mode="out-in"
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 rotate-90 scale-50"
      enter-to-class="opacity-100 rotate-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 rotate-0 scale-100"
      leave-to-class="opacity-0 -rotate-90 scale-50"
    >
      <UIcon
        v-if="!isOpen"
        name="i-ttg-dice-d20"
        class="h-8 w-8 text-[var(--color-primary-500)]"
      />

      <UIcon
        v-else
        name="i-fluent-dismiss-24-regular"
        class="h-8 w-8 text-[var(--ui-text-muted)]"
      />
    </Transition>
  </button>
</template>
