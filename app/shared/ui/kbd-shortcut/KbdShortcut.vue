<script setup lang="ts">
  const { kbds } = defineProps<{
    kbds?: string[];
  }>();
</script>

<template>
  <div
    v-if="kbds && kbds.length"
    class="flex items-center gap-2"
  >
    <UKbd
      v-for="kbd in kbds"
      :key="kbd"
      :value="kbd"
      size="sm"
      variant="outline"
    />
  </div>
</template>
