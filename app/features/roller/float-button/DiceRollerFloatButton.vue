<script setup lang="ts">
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const { isOpen, toggle } = useDiceRollerState();
</script>

<template>
  <UButton
    :icon="isOpen ? 'i-fluent-dismiss-24-regular' : 'i-ttg-dice-d20'"
    size="xl"
    color="primary"
    variant="soft"
    class="fixed right-4 bottom-4 z-[120] hidden h-12 w-12 items-center justify-center rounded-xl shadow-[0_12px_25px_rgba(0,0,0,0.2)] transition md:inline-flex"
    :aria-label="isOpen ? 'Закрыть роллер кубов' : 'Открыть роллер кубов'"
    @click="toggle"
  />
</template>
