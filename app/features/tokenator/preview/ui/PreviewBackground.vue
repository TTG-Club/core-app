<script setup lang="ts">
  import { PREVIEW_ASSETS } from '~tokenator/model';
</script>

<template>
  <div class="absolute inset-0 z-0 opacity-75">
    <img
      :src="PREVIEW_ASSETS.BACKGROUND"
      alt="Background"
      class="h-full w-full object-cover"
    />
  </div>
</template>
