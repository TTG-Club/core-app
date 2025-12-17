<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  const props = defineProps<{
    kbds?: DropdownMenuItem['kbds'];
  }>();

  const isMac = computed(() => {
    if (import.meta.server) return false;

    return /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
  });

  function formatKbd(kbd: string | undefined): string {
    if (!kbd) return '';

    if (kbd === 'meta') {
      return isMac.value ? '⌘' : 'Ctrl';
    }

    return kbd.toUpperCase();
  }

  const kbdsArray = computed(() => {
    if (!props.kbds) return [];

    if (Array.isArray(props.kbds)) {
      return props.kbds.filter(
        (k): k is string => typeof k === 'string' && k !== undefined,
      );
    }

    return [];
  });
</script>

<template>
  <div
    v-if="kbdsArray.length"
    class="flex items-center gap-2"
  >
    <UKbd
      v-for="kbd in kbdsArray"
      :key="kbd"
      size="sm"
      variant="outline"
    >
      {{ formatKbd(kbd) }}
    </UKbd>
  </div>
</template>
