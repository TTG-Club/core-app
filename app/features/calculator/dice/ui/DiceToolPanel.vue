<script setup lang="ts">
  import { HomeEyebrow } from '~home/ui-kit';

  /**
   * Панель калькулятора. Все карточки страницы собраны на ней, поэтому
   * отступы, рамка и подпись у них одни и те же.
   */
  defineProps<{
    /** Подпись над содержимым; без неё панель начинается сразу с содержимого */
    label?: string;
  }>();
</script>

<template>
  <section
    class="flex min-w-0 flex-col gap-3 rounded-xl border border-default bg-muted p-3 sm:gap-4 sm:p-4"
  >
    <HomeEyebrow
      v-if="label"
      :label
    />

    <slot />
  </section>
</template>
