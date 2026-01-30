<script setup lang="ts">
  import { useDiceRollerState } from '~dice-roller/composables';

  const { isOpen, toggleModal } = useDiceRollerState();

  const icon = computed(() =>
    isOpen.value ? 'i-fluent-dismiss-24-regular' : 'i-ttg-dice-d20',
  );
</script>

<template>
  <UButton
    :icon="icon"
    size="xl"
    color="primary"
    variant="soft"
    class="fixed right-4 bottom-4 z-50 hidden h-12 w-12 items-center justify-center rounded-xl shadow-xl transition md:inline-flex"
    :aria-label="isOpen ? 'Закрыть роллер кубов' : 'Открыть роллер кубов'"
    @click.left.exact.prevent="toggleModal"
  />
</template>
