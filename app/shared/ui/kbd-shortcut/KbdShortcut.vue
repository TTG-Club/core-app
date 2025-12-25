<script setup lang="ts">
  const {
    kbds,
    size = 'sm',
    color = 'neutral',
    variant = 'outline',
  } = defineProps<{
    kbds: string[];
    variant?: 'outline' | 'soft' | 'subtle' | 'solid';
    size?: 'sm' | 'md' | 'lg';
    color?:
      | 'error'
      | 'primary'
      | 'secondary'
      | 'success'
      | 'info'
      | 'warning'
      | 'neutral';
  }>();
</script>

<template>
  <div
    v-if="kbds.length"
    class="flex items-center gap-2"
  >
    <UKbd
      v-for="kbd in kbds"
      :key="kbd"
      :value="kbd"
      :variant
      :color
      :size
    />
  </div>
</template>
