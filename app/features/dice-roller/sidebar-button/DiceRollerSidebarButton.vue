<script setup lang="ts">
  import { useDiceRollerState } from '~dice-roller/composables';

  const diceRoller = useDiceRollerState();

  const icon = computed(() =>
    diceRoller.isOpen.value ? 'i-fluent-dismiss-24-regular' : 'i-ttg-dice-d20',
  );
</script>

<template>
  <UButton
    variant="ghost"
    color="neutral"
    class="md:hidden"
    :ui="{ leadingIcon: 'h-6 w-6' }"
    :icon
    @click.left.exact.prevent="diceRoller.toggleModal()"
  />
</template>
