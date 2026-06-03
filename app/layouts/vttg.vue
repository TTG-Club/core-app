<script setup lang="ts">
  import { AppFooter } from '~infrastructure/footer';
</script>

<template>
  <div class="flex min-h-dvh w-full flex-col overflow-x-hidden">
    <div class="flex-auto">
      <slot name="default" />
    </div>

    <AppFooter />
  </div>
</template>
