<script setup lang="ts">
  // Сам файл, а не barrel: рядом в barrel лежит история бросков с IndexedDB
  // (dexie), а кнопка стоит в сайдбаре каждой страницы и ей нужно только
  // состояние «окно кубиков открыто»
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const { isOpen, toggleModal } = useDiceRollerState();

  const icon = computed(() => (isOpen.value ? 'tabler:x' : 'ttg:dice-d20'));
</script>

<template>
  <UButton
    variant="ghost"
    color="neutral"
    class="md:hidden"
    :ui="{ leadingIcon: 'h-6 w-6' }"
    :icon
    @click.left.exact.prevent="toggleModal()"
  />
</template>
