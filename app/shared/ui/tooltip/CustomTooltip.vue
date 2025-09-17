<script setup lang="ts">
  import { ref } from 'vue';
  import { onClickOutside } from '@vueuse/core';

  defineProps<{
    text: string;
    icon?: string;
    size?: string;
  }>();

  const open = ref(false);
  const root = ref<HTMLElement | null>(null);

  onClickOutside(root, () => (open.value = false));

  function toggle() {
    open.value = !open.value;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open.value = false;
  }
</script>

<template>
  <span
    ref="root"
    class="inline-flex items-center"
  >
    <UTooltip
      v-model:open="open"
      manual
      :text="text"
    >
      <UIcon
        :name="icon || 'i-ttg-info'"
        :class="size || 'h-3 w-3'"
        class="cursor-pointer align-[-2px] text-gray-500 hover:text-gray-700"
        role="button"
        tabindex="0"
        :aria-expanded="open"
        @click.stop="toggle"
        @keydown.enter.prevent="toggle"
        @keydown.space.prevent="toggle"
        @keydown.esc.stop="onKeydown"
      />
    </UTooltip>
  </span>
</template>
